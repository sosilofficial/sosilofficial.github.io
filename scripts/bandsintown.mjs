import fs from 'node:fs';

export const ARTIST_ID = '15665087';
export const CACHE_FILE = 'content/works/live/upcoming.json';
export const OVERRIDES_FILE = 'content/works/live/event-overrides.json';
export const ARTIST_URL = `https://www.bandsintown.com/a/${ARTIST_ID}`;
const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// API URLs can contain app_id, including inside nested ticket redirect URLs.
// Reject any link still containing the credential after removing known parameters.
export function publicUrl(value, secret = '') {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(app_id|api_key|apikey|access_token|token)$/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = '';
    let decoded = url.href;
    for (let i = 0; i < 4; i++) {
      if (secret && decoded.includes(secret)) return '';
      try { decoded = decodeURIComponent(decoded); } catch { break; }
    }
    return url.href;
  } catch { return ''; }
}

export function normalizeEvents(payload, secret = '') {
  if (!Array.isArray(payload)) throw new Error('Invalid event response');
  const seen = new Set();
  return payload.map((event) => {
    if (!event || !/^\d+$/.test(String(event.id)) || String(event.artist_id) !== ARTIST_ID ||
        typeof event.datetime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(event.datetime) ||
        !Number.isFinite(Date.parse(`${event.datetime}Z`)) ||
        new Date(`${event.datetime}Z`).toISOString().slice(0, 19) !== event.datetime || !event.venue ||
        !Array.isArray(event.lineup) || !Array.isArray(event.offers)) throw new Error('Invalid event response');
    const text = (value) => typeof value === 'string' ? value.replaceAll(secret || '\0', '').trim() : '';
    const ticket = event.offers.find((offer) => offer.type?.toLowerCase() === 'tickets' &&
      offer.status?.toLowerCase() === 'available' && publicUrl(offer.url, secret));
    return {
      id: String(event.id), datetime: event.datetime,
      title: text(event.title) || text(event.venue.name) || 'Sosil live',
      lineup: event.lineup.map(text).filter((name) => name && !/^(sosil|소실|소실\s+sosil)$/i.test(name)),
      venue: [text(event.venue.name), text(event.venue.city), text(event.venue.country)].filter(Boolean).join(' · '),
      url: ticket ? publicUrl(ticket.url, secret) : `https://www.bandsintown.com/e/${event.id}`,
      label: ticket ? 'tickets' : 'rsvp',
    };
  }).filter((event) => !seen.has(event.id) && seen.add(event.id))
    .sort((a, b) => a.datetime.localeCompare(b.datetime) || a.id.localeCompare(b.id));
}

export async function syncEvents({ key, file = CACHE_FILE, fetchImpl = fetch, warn = console.warn } = {}) {
  if (!key?.trim()) {
    warn('::warning::BANDSINTOWN_API_KEY is missing; retaining the last successful snapshot.');
    return false;
  }
  try {
    const url = new URL(`https://rest.bandsintown.com/artists/id_${ARTIST_ID}/events/`);
    url.searchParams.set('app_id', key.trim());
    url.searchParams.set('date', 'upcoming');
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok) throw new Error('API request failed');
    const events = normalizeEvents(await response.json(), key.trim());
    const serialized = `${JSON.stringify({ artistId: ARTIST_ID, events }, null, 2)}\n`;
    if (serialized.includes(key.trim())) throw new Error('Unsafe response');
    // No timestamps: unchanged responses produce no commit.
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== serialized) {
      fs.writeFileSync(`${file}.tmp`, serialized);
      fs.renameSync(`${file}.tmp`, file);
    }
    return true;
  } catch {
    // Never log errors, response bodies or request URLs: they may echo the key.
    warn('::warning::Bandsintown sync failed; retaining the last successful snapshot.');
    return false;
  }
}

// Korean names sort in 가나다 order; names written only in Latin use alphabetic order.
export function displayLineup(names = []) {
  const canonical = names.map(name => name.trim()).filter(Boolean).map(name =>
    /^(소실(?:\s+sosil)?|sosil(?:\s+소실)?)$/i.test(name) ? '소실 Sosil' : name);
  return [...new Set([...canonical, '소실 Sosil'])].sort(new Intl.Collator('ko', { sensitivity: 'base' }).compare);
}

export function readUpcoming({ file = CACHE_FILE, overridesFile = OVERRIDES_FILE, now = new Date() } = {}) {
  const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {};
  if (!overrides || Array.isArray(overrides) || typeof overrides !== 'object' ||
      Object.entries(overrides).some(([id, item]) => !/^\d+$/.test(id) || !item || typeof item !== 'object' || Array.isArray(item) || (item.title !== undefined && (typeof item.title !== 'string' || !item.title.trim())) || (item.lineup !== undefined && (!Array.isArray(item.lineup) || item.lineup.some(name => typeof name !== 'string' || !name.trim()))))) {
    throw new Error('Event overrides must map event IDs to a title and/or an array of artist names.');
  }
  const snapshot = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { events: null };
  // A local show date has no timezone. Keep that date through the end of day
  // everywhere on earth, avoiding early removal for international shows.
  const today = new Date(now.getTime() - 12 * 3600000).toISOString().slice(0, 10);
  const events = snapshot.events?.filter((event) => event.datetime.slice(0, 10) >= today) || [];
  return { events: events.map(event => ({ ...event,
    title: overrides[event.id]?.title?.trim() || event.title,
    lineup: displayLineup(overrides[event.id]?.lineup ?? event.lineup),
  })), initialized: snapshot.events !== null };
}

export function upcomingHtml(options = {}) {
  const { events, initialized } = readUpcoming(options);
  const rows = events.map((event) => `<div class="live-row live-upcoming-row"><time datetime="${esc(event.datetime)}">${esc(event.datetime.slice(0, 10).replaceAll('-', '.'))}<small class="live-time">${esc(event.datetime.slice(11, 16))} local</small></time><span class="live-title">${esc(event.title)}</span><span class="live-artists">${esc(event.lineup.join(', '))}</span><small class="live-venue">${esc(event.venue)}<a class="live-cta" href="${esc(publicUrl(event.url) || ARTIST_URL)}" target="_blank" rel="noopener noreferrer">${esc(event.label)}</a></small></div>`).join('');
  return `<section aria-labelledby="live-upcoming"><h2 class="live-section-heading" id="live-upcoming">upcoming</h2>${rows || `<p class="empty-note">${!initialized ? 'Check Bandsintown for upcoming shows.' : 'No upcoming shows announced.'}</p>`}<p class="live-source"><a href="${ARTIST_URL}" target="_blank" rel="noopener noreferrer">shows on Bandsintown</a></p></section>`;
}


export function homeUpcomingHtml(options = {}) {
  const { events, initialized } = readUpcoming(options);
  const shows = events.slice(0, 2).map((event) => `<article class="home-show"><p><time datetime="${esc(event.datetime)}">${esc(event.datetime.slice(0, 10).replaceAll('-', '.'))} · ${esc(event.datetime.slice(11, 16))} local</time></p><a class="home-show-title" href="/live">${esc(event.title)}</a><p class="home-show-venue">${esc(event.venue.startsWith(`${event.title} · `) ? event.venue.slice(event.title.length + 3) : event.venue)}</p><a class="home-show-ticket" href="${esc(publicUrl(event.url) || ARTIST_URL)}" target="_blank" rel="noopener noreferrer">${esc(event.label)}</a></article>`).join('');
  return `<section class="home-live" aria-labelledby="home-live-heading"><h2 id="home-live-heading">upcoming live</h2>${shows || `<p class="empty-note">${initialized ? 'No upcoming shows announced.' : 'Check Bandsintown for upcoming shows.'}</p>`}<a class="small-link" href="/live">all live dates</a></section>`;
}

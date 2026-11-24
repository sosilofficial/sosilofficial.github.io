import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ARTIST_ID, normalizeEvents, publicUrl, syncEvents, upcomingHtml, homeUpcomingHtml, readUpcoming, displayLineup } from './bandsintown.mjs';
const event = (overrides = {}) => ({ id: '42', artist_id: ARTIST_ID, datetime: '2030-12-10T19:30:00', title: 'Winter <show>', venue: { name: 'Club', city: 'Seoul', country: 'South Korea' }, lineup: ['Sosil', 'Guest & friend'], offers: [], ...overrides });
const temporary = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sosil-live-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'upcoming.json');
};

test('sorts, deduplicates, excludes Sosil and selects available tickets', () => {
  const events = normalizeEvents([event(), event(), event({ id: '43', datetime: '2030-11-10T18:00:00', offers: [{ type: 'Tickets', status: 'unavailable', url: 'https://example.com/no' }, { type: 'Tickets', status: 'available', url: 'https://example.com/yes?app_id=private-test-key' }] })], 'private-test-key');
  assert.deepEqual(events.map(e => e.id), ['43', '42']);
  assert.equal(events[0].label, 'tickets');
  assert.equal(events[0].url, 'https://example.com/yes');
  assert.equal(events[1].label, 'rsvp');
  assert.deepEqual(events[1].lineup, ['Guest & friend']);
});

test('sanitizes authentication parameters, nested secrets and unsafe links', () => {
  assert.equal(publicUrl('javascript:alert(1)'), '');
  assert.equal(publicUrl('https://user:pass@example.com/'), '');
  assert.equal(publicUrl('https://example.com/?APP_ID=secret&x=1#secret', 'secret'), 'https://example.com/?x=1');
  assert.equal(publicUrl('https://example.com/?next=https%3A%2F%2Fexample.com%3Fapp_id%3Dsecret', 'secret'), '');
});

test('rejects API errors, partial malformed responses and wrong artist', () => {
  for (const data of [{ error: 'bad' }, [event(), {}], [event({ artist_id: '123' })], [event({ datetime: 'invalid' })], [event({ datetime: '2030-02-30T19:00:00' })]]) {
    assert.throws(() => normalizeEvents(data));
  }
});

test('missing key, HTTP errors, timeouts, invalid JSON preserve snapshot and redact logs', async t => {
  const file = temporary(t);
  fs.writeFileSync(file, 'original');
  const logs = [];
  const warn = message => logs.push(message);
  assert.equal(await syncEvents({ file, warn, fetchImpl: () => { throw new Error('must not fetch'); } }), false);
  for (const fetchImpl of [async () => ({ ok: false }), async () => { throw new Error('private-test-key'); }, async () => ({ ok: true, json: async () => { throw new Error('private-test-key'); } }), async () => ({ ok: true, json: async () => ({ error: 'private-test-key' }) })]) {
    assert.equal(await syncEvents({ key: 'private-test-key', file, warn, fetchImpl }), false);
    assert.equal(fs.readFileSync(file, 'utf8'), 'original');
  }
  assert(!logs.join('').includes('private-test-key'));
});

test('successful fetch is atomic, key-free, stable, and empty response clears cancellations', async t => {
  const file = temporary(t);
  let payload = [event({ title: 'private-test-key Show' })];
  const fetchImpl = async (url, options) => {
    assert.equal(url.pathname, `/artists/id_${ARTIST_ID}/events/`);
    assert.equal(url.searchParams.get('date'), 'upcoming');
    assert.equal(url.searchParams.get('app_id'), 'private-test-key');
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => payload };
  };
  assert(await syncEvents({ key: 'private-test-key', file, fetchImpl }));
  const before = fs.statSync(file).mtimeMs;
  assert(!fs.readFileSync(file, 'utf8').includes('private-test-key'));
  assert(await syncEvents({ key: 'private-test-key', file, fetchImpl }));
  assert.equal(fs.statSync(file).mtimeMs, before);
  payload = [];
  assert(await syncEvents({ key: 'private-test-key', file, fetchImpl }));
  assert.deepEqual(JSON.parse(fs.readFileSync(file)).events, []);
});

test('render escapes API text, preserves local time and prunes old cached shows', t => {
  const file = temporary(t);
  fs.writeFileSync(file, JSON.stringify({ events: normalizeEvents([event()]) }));
  const html = upcomingHtml({ file, now: new Date('2030-12-10T10:00:00Z') });
  assert(html.includes('Winter &lt;show&gt;'));
  assert(html.includes('Guest &amp; friend'));
  assert(html.includes('19:30 local'));
  assert(!upcomingHtml({ file, now: new Date('2030-12-12T00:00:00Z') }).includes('live-upcoming-row'));
});

test('distinguishes unsynchronized snapshot from a confirmed empty result', t => {
  const file = temporary(t);
  assert(upcomingHtml({ file }).includes('Check Bandsintown'));
  fs.writeFileSync(file, JSON.stringify({ events: [] }));
  assert(upcomingHtml({ file }).includes('No upcoming shows announced.'));
});


test('home uses the same upcoming snapshot, limits previews and handles empty data', t => {
  const file = temporary(t);
  const options = { file, now: new Date('2030-12-01T00:00:00Z') };
  assert(homeUpcomingHtml(options).includes('Check Bandsintown'));
  fs.writeFileSync(file, JSON.stringify({ events: normalizeEvents([event(), event({ id: '43' }), event({ id: '44' })]) }));
  const html = homeUpcomingHtml(options);
  assert.equal((html.match(/class="home-show"/g) || []).length, 2);
  assert(html.includes('Winter &lt;show&gt;'));
  assert(html.includes('19:30 local'));
  assert(html.includes('href="/live"'));
  assert(!html.includes('/news'));
  assert(homeUpcomingHtml({ ...options, now: new Date('2031-01-01') }).includes('No upcoming shows announced.'));
  fs.writeFileSync(file, JSON.stringify({ events: [] }));
  assert(homeUpcomingHtml(options).includes('No upcoming shows announced.'));
});


test('manual lineup survives API refresh without changing event data or resurrecting events', async t => {
  const file = temporary(t);
  const overridesFile = `${file}.lineup.json`;
  fs.writeFileSync(overridesFile, JSON.stringify({ '42': { title: 'Authored show', lineup: ['Guest <name>', 'Other musician'] }, '999': { lineup: ['Cancelled guest'] } }));
  const options = { file, overridesFile, now: new Date('2030-12-01') };
  fs.writeFileSync(file, JSON.stringify({ events: normalizeEvents([event()]) }));
  assert.deepEqual(readUpcoming(options).events[0].lineup, ['소실 Sosil', 'Guest <name>', 'Other musician']);
  assert(upcomingHtml(options).includes('Guest &lt;name&gt;'));
  assert(!upcomingHtml(options).includes('Cancelled guest'));
  await syncEvents({ key: 'test-key', file, fetchImpl: async () => ({ ok: true, json: async () => [event({ title: 'Updated show' })] }) });
  assert.equal(readUpcoming(options).events[0].title, 'Authored show');
  assert(homeUpcomingHtml(options).includes('Authored show'));
  assert.deepEqual(readUpcoming(options).events[0].lineup, ['소실 Sosil', 'Guest <name>', 'Other musician']);
  assert.equal(JSON.parse(fs.readFileSync(overridesFile))['42'].lineup[0], 'Guest <name>');
  fs.writeFileSync(overridesFile, '{"42":"invalid"}');
  assert.throws(() => readUpcoming(options), /Event overrides/);
});


test('display lineup includes Sosil exactly once and sorts Korean names', () => {
  assert.deepEqual(displayLineup(['사가 SAGA', '김초원 Kim Chowon', 'Sosil', '소실', '소실 Sosil']), ['김초원 Kim Chowon', '사가 SAGA', '소실 Sosil']);
  assert.deepEqual(displayLineup(['이로 eero', '소피 Sophy']), ['소실 Sosil', '소피 Sophy', '이로 eero']);
  assert.deepEqual(displayLineup([]), ['소실 Sosil']);
});

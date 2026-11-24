import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ARTIST_ID, normalizeEvents, publicUrl, syncEvents, upcomingHtml, homeUpcomingHtml } from './bandsintown.mjs';
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

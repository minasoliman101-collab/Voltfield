// VOLTFIELD Practice Sandbox — anonymous leaderboard.
// The only server-side component on an otherwise fully static site (see README.md).
// Stores, per challenge scenario, the top 20 fastest completed (5/5) solve times.
// No accounts, no email, no IP logged — just a free-text display name (defaults to
// "Anonymous") and an elapsed time in milliseconds. Fails closed: bad input is
// rejected with 400 rather than silently stored.
import { getStore } from '@netlify/blobs';

const KNOWN_SCENARIOS = new Set([
  'clean', 'undersized-main', 'voltage-drop', 'fault-current', 'xfmr-overload', 'feeder-undersized'
]);
const MAX_ENTRIES = 20;
const MIN_TIME_MS = 3000;           // faster than this is not a real solve attempt
const MAX_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours — generous ceiling, just to reject garbage
const MAX_NAME_LEN = 24;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json' }
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore('sandbox-leaderboard');

  if (req.method === 'GET') {
    const scenario = url.searchParams.get('scenario');
    if (!scenario || !KNOWN_SCENARIOS.has(scenario)) return json({ error: 'unknown scenario' }, 400);
    const entries = (await store.get(scenario, { type: 'json' })) || [];
    return new Response(JSON.stringify({ scenario, entries }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' }
    });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }
    const scenario = body && body.scenario;
    if (!scenario || !KNOWN_SCENARIOS.has(scenario)) return json({ error: 'unknown scenario' }, 400);

    const t = Number(body.timeMs);
    if (!Number.isFinite(t) || t < MIN_TIME_MS || t > MAX_TIME_MS) return json({ error: 'invalid time' }, 400);

    const rawName = typeof body.name === 'string' ? body.name : '';
    const cleanName = rawName.trim().slice(0, MAX_NAME_LEN) || 'Anonymous';

    const existing = (await store.get(scenario, { type: 'json' })) || [];
    const updated = existing
      .concat([{ name: cleanName, timeMs: t }])
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, MAX_ENTRIES);
    await store.setJSON(scenario, updated);

    return json({ scenario, entries: updated });
  }

  return json({ error: 'method not allowed' }, 405);
};

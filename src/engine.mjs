import { emptyWorld, migrateWorld, validWorld, rewardedWorkouts } from './gameplay.mjs';
export const EXERCISE_REVIEW_VERSION = 1;
export const MINUTES = [7, 10, 15, 20];
export const EXERCISES = [
  { id: 'march', name: 'Easy march', reviewStatus: 'unreviewed', group: 'mobility', pose: 'march', cue: 'Stand tall. Step gently in place.', alternative: 'reach' },
  { id: 'squat', name: 'Shallow squat', reviewStatus: 'unreviewed', group: 'legs', pose: 'squat', cue: 'Feet apart. Sit back a little. Rise slowly.', alternative: 'calf' },
  { id: 'push', name: 'Wall push', reviewStatus: 'unreviewed', group: 'upper', pose: 'push', cue: 'Hands on a wall. Bend elbows, then press away.', alternative: 'reach' },
  { id: 'calf', name: 'Calf raise', reviewStatus: 'unreviewed', group: 'legs', pose: 'calf', cue: 'Hold support if needed. Lift heels, lower slowly.', alternative: 'march' },
  { id: 'reach', name: 'Gentle reach', reviewStatus: 'unreviewed', group: 'mobility', pose: 'reach', cue: 'Reach up comfortably, then lower your arms.', alternative: 'march' },
];
export const exercise = id => EXERCISES.find(e => e.id === id);
export const freshState = () => ({ schemaVersion: 1, deviceId: crypto.randomUUID(), active: null, history: [], world: emptyWorld(), settings: { muted: false, volume: 0.45 }, updatedAt: Date.now(), lastExportAt: null });
export function recovery(history, now = Date.now()) {
  const until = {};
  for (const h of history.filter(h => h.mode !== 'preview')) for (const group of h.groups) {
    if (group !== 'mobility') until[group] = Math.max(until[group] || 0, h.endedAt + 24 * 3600_000);
  }
  return { until, resting: Object.keys(until).filter(g => until[g] > now) };
}
export function createSession(minutes, history = [], now = Date.now(), { mode = 'workout' } = {}) {
  if (!['workout', 'preview'].includes(mode)) throw new Error('Unknown session mode.');
  if (!MINUTES.includes(minutes)) throw new Error('Choose 7, 10, 15 or 20 minutes.');
  const resting = recovery(history, now).resting;
  const pool = EXERCISES.filter(e => e.reviewStatus !== 'blocked' && !resting.includes(e.group));
  if (!pool.length) throw new Error('No eligible exercises available.');
  const segments = [];
  for (let i = 0; i < minutes; i++) {
    const e = pool[i % pool.length];
    segments.push({ exerciseId: e.id, kind: 'work', durationMs: 45_000 });
    segments.push({ exerciseId: e.id, kind: 'rest', durationMs: 15_000 });
  }
  return { id: crypto.randomUUID(), mode, minutes, startedAt: now, segments, elapsedMs: 0, runningSince: now, checkpointAt: now, status: 'running', reason: null, events: [] };
}
export const duration = s => s.segments.reduce((n, b) => n + b.durationMs, 0);
export const elapsed = (s, now = Date.now()) => Math.min(duration(s), Math.max(0, s.elapsedMs + (s.status === 'running' ? Math.max(0, now - s.runningSince) : 0)));
export function position(s, now = Date.now()) {
  let remaining = elapsed(s, now);
  for (let index = 0; index < s.segments.length; index++) {
    const segment = s.segments[index];
    if (remaining < segment.durationMs) return { ...segment, index, remainingMs: segment.durationMs - remaining, rep: Math.min(15, Math.floor(remaining / 3000) + 1) };
    remaining -= segment.durationMs;
  }
  return { done: true, index: s.segments.length, remainingMs: 0 };
}
export function freeze(s, now = Date.now(), reason = 'paused') {
  return { ...s, elapsedMs: elapsed(s, now), runningSince: null, checkpointAt: now, status: 'paused', reason };
}
export function resume(s, now = Date.now()) {
  return { ...s, runningSince: now, checkpointAt: now, status: 'running', reason: null };
}
export function restore(s) {
  return s ? freeze(s, s.checkpointAt, 'interrupted') : null;
}
export function skip(s, now = Date.now()) {
  const p = position(s, now);
  if (p.done) return s;
  const next = s.segments.slice(0, p.index + 1).reduce((n, b) => n + b.durationMs, 0);
  return { ...s, elapsedMs: next, runningSince: s.status === 'running' ? now : null, checkpointAt: now, events: [...s.events, { type: 'skip', index: p.index, at: now }] };
}
export function replace(s, now = Date.now()) {
  const p = position(s, now);
  if (p.done || p.kind !== 'work') return s;
  const id = exercise(p.exerciseId).alternative;
  return { ...s, segments: s.segments.map((b, i) => i === p.index ? { ...b, exerciseId: id } : b), events: [...s.events, { type: 'replace', index: p.index, exerciseId: id, at: now }] };
}
export function finish(state, completed, now = Date.now()) {
  const s = state.active;
  if (!s) return state;
  const consumed = elapsed(s, now);
  let start = 0;
  const groups = new Set();
  let activeMs = 0;
  for (const [index, b] of s.segments.entries()) {
    const performed = Math.min(b.durationMs, Math.max(0, consumed - start));
    if (b.kind === 'work' && performed > 0 && !s.events.some(e => e.type === 'skip' && e.index === index)) {
      activeMs += performed;
      groups.add(exercise(b.exerciseId).group);
    }
    start += b.durationMs;
  }
  const record = { schemaVersion: 1, id: s.id, deviceId: state.deviceId, startedAt: s.startedAt, endedAt: now, minutes: s.minutes, elapsedMs: consumed, activeMs, mode: s.mode || 'workout', completed: completed && consumed === duration(s), groups: [...groups], segments: s.segments, events: s.events };
  return { ...state, active: null, history: [...state.history.filter(h => h.id !== s.id), record], updatedAt: now };
}
export const progress = history => rewardedWorkouts(history).length;
export function validateBackup(input) {
  const fail = () => { throw new Error('This is not a valid Little Strides backup. Your current data is unchanged.'); };
  const num = n => Number.isFinite(n) && n >= 0;
  const segmentsOk = (segments, minutes) => Array.isArray(segments) && segments.length === minutes * 2 && segments.every((b, i) => b && exercise(b.exerciseId) && b.kind === (i % 2 ? 'rest' : 'work') && b.durationMs === (i % 2 ? 15_000 : 45_000));
  const eventsOk = (events, count) => Array.isArray(events) && events.length <= 20_000 && events.every(e => e && ['replace', 'skip'].includes(e.type) && Number.isInteger(e.index) && e.index >= 0 && e.index < count && num(e.at) && (e.type !== 'replace' || exercise(e.exerciseId)));
  const identity = x => x && typeof x.id === 'string' && x.id.length > 0 && x.id.length <= 100;
  if (!input || input.format !== 'little-strides' || input.schemaVersion !== 1) fail();
  const s = input.data;
  if (!s || s.schemaVersion !== 1 || typeof s.deviceId !== 'string' || s.deviceId.length > 100 || !num(s.updatedAt) || !(s.lastExportAt === null || num(s.lastExportAt)) || !s.settings || typeof s.settings.muted !== 'boolean' || !num(s.settings.volume) || s.settings.volume > 1 || !Array.isArray(s.history) || s.history.length > 100_000) fail();
  const ids = new Set();
  for (const h of s.history) {
    if (!(h.mode === undefined || ['workout', 'preview'].includes(h.mode)) || !identity(h) || ids.has(h.id) || h.schemaVersion !== 1 || typeof h.deviceId !== 'string' || !MINUTES.includes(h.minutes) || !num(h.startedAt) || !num(h.endedAt) || h.endedAt < h.startedAt || !num(h.elapsedMs) || h.elapsedMs > h.minutes * 60_000 || !num(h.activeMs) || h.activeMs > h.elapsedMs || typeof h.completed !== 'boolean' || !Array.isArray(h.groups) || !h.groups.every(g => ['upper', 'legs', 'mobility'].includes(g)) || !segmentsOk(h.segments, h.minutes) || !eventsOk(h.events, h.segments.length)) fail();
    ids.add(h.id);
  }
  if (s.active !== null) {
    const a = s.active;
    if (!(a.mode === undefined || ['workout', 'preview'].includes(a.mode)) || !identity(a) || ids.has(a.id) || !MINUTES.includes(a.minutes) || !num(a.startedAt) || !num(a.checkpointAt) || a.checkpointAt < a.startedAt || !num(a.elapsedMs) || a.elapsedMs > a.minutes * 60_000 || !['running', 'paused'].includes(a.status) || !(a.reason === null || ['paused', 'interrupted'].includes(a.reason)) || (a.status === 'running' ? !num(a.runningSince) || a.runningSince > a.checkpointAt : a.runningSince !== null) || !segmentsOk(a.segments, a.minutes) || !eventsOk(a.events, a.segments.length)) fail();
  }
  if (!(s.settings.exerciseReviewVersion === undefined || Number.isInteger(s.settings.exerciseReviewVersion) && s.settings.exerciseReviewVersion >= 1 && s.settings.exerciseReviewVersion <= EXERCISE_REVIEW_VERSION)) fail();
  const world = migrateWorld(s);
  if (!validWorld(world, s.history)) fail();
  return structuredClone({ ...s, world });
}

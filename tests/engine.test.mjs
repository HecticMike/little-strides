import { testSession as createSession, TEST_SETTINGS } from './fixtures.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MINUTES, elapsed, position, freeze, resume, restore, skip, replace, finish, freshState, duration, recovery, progress, validateBackup } from '../src/engine.mjs';
const start = 1_000_000;
for (const minutes of MINUTES) {
  test(`${minutes} minutes: exact plan duration and every transition`, () => {
    const s = createSession(minutes, [], start);
    assert.equal(duration(s), minutes * 60_000);
    let offset=0;
    for(const segment of s.segments){
      assert.equal(position(s,start+offset).kind,segment.kind);
      assert.equal(position(s,start+offset+segment.durationMs-1).kind,segment.kind);
      offset+=segment.durationMs;
    }
    assert.equal(position(s, start + minutes * 60_000).done, true);
  });
}
test('pause excludes time away; restore freezes at durable checkpoint', () => {
  const s = createSession(7, [], start), paused = freeze(s, start + 12345);
  assert.equal(elapsed(paused, start + 8_000_000), 12345);
  const continued = resume(paused, start + 8_000_000);
  assert.equal(elapsed(continued, start + 8_001_000), 13345);
  const recovered = restore({ ...continued, checkpointAt: start + 8_002_000 });
  assert.equal(elapsed(recovered, start + 90_000_000), 14345);
  assert.equal(recovered.reason, 'interrupted');
});
test('skip and replace retain paused state and exact total duration', () => {
  const choices={enabledExercises:['abdominal-bracing','pelvic-tilt','heel-slide']};
  const s = freeze(createSession(3, [], start,{settings:choices}), start + 35000);
  const replacement = replace(s, start + 36000, {settings:choices});
  assert.notEqual(replacement.segments[1].exerciseId, s.segments[1].exerciseId);
  assert.equal(duration(replacement), duration(s));
  assert.equal(position(skip(replacement, start + 37000), start + 7000).kind, 'rest');
  assert.equal(skip(replacement).status, 'paused');
});
test('finishing is idempotent, skipping earns no growth, recovery uses actual groups', () => {
  let state = freshState(); state.settings={...state.settings,...TEST_SETTINGS}; state.active = createSession(7, [], start);
  const done = finish(state, true, start + 7 * 60_000);
  assert.equal(done.history.length, 1); assert.equal(progress(done.history), 1);
  assert.deepEqual(finish(done, true), done);
  assert.ok(recovery(done.history, start + 8 * 60_000).resting.includes('legs'));
  const easy = createSession(7, done.history, start + 8 * 60_000);
  assert.ok(easy.segments.every(b => b.kind!=='work'||['march', 'reach'].includes(b.exerciseId)));
  assert.equal(recovery(done.history, start + 49 * 3600_000).resting.length, 0);
  while (!position(state.active, start).done) state.active = skip(state.active, start);
  assert.equal(progress(finish(state, true, start).history), 0);
});
test('JSON roundtrip preserves history and rejects corrupt or unsupported backups', () => {
  const state = freshState(); state.active = createSession(10, [], start);
  const envelope = { format: 'little-strides', schemaVersion: 1, data: state };
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(envelope))), state);
  for (const mutate of [e => e.schemaVersion = 2, e => e.data.active.segments[0].durationMs = -1, e => e.data.settings.volume = 9, e => e.data.active.events.push({ type: 'invalid' }), e => e.data.active.elapsedMs = Infinity]) {
    const invalid = structuredClone(envelope); mutate(invalid); assert.throws(() => validateBackup(invalid));
  }
});

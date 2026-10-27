import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CHARACTER, WORLD } from '../src/art-spec.mjs';
import { EXERCISES } from '../src/engine.mjs';
const dimensions = name => { const b = readFileSync(`public/art/${name}.png`); assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a'); return [b.readUInt32BE(16),b.readUInt32BE(20)]; };
test('exported character sheets fit the canonical frame grid', () => {
  assert.deepEqual(dimensions('hero-body'), [CHARACTER.poses.length * 48,64]);
  assert.deepEqual(dimensions('hero-equipment'), [CHARACTER.poses.length * 48,128]);
  assert.deepEqual(CHARACTER.stages.map(s=>s.name), ['Beginner','Adventurer','Veteran']);
  const metadata = JSON.parse(readFileSync('public/art/avatar.json','utf8'));
  assert.equal(metadata.id,CHARACTER.id); assert.deepEqual(metadata.stages,CHARACTER.stages);
});
test('supported exercises map to their own poses and lying remains an art study', () => {
  for (const e of EXERCISES) { assert.equal(CHARACTER.exercisePoses[e.id],e.pose); assert.ok(CHARACTER.poses.includes(e.pose)); }
  const metadata=JSON.parse(readFileSync('public/art/avatar.json','utf8'));
  assert.equal(metadata.frames.find(f=>f.id==='lying').usage,'identity-study-only');
  assert.ok(!EXERCISES.some(e=>e.pose==='lying'));
});
test('world and building art use a compact tile grid and real editable Aseprite masters', () => {
  assert.equal(WORLD.width % WORLD.tileSize,0); assert.equal(WORLD.height % WORLD.tileSize,0);
  assert.deepEqual(dimensions('village-ground'),[WORLD.width,WORLD.height]);
  assert.deepEqual(dimensions('village-foreground'),[WORLD.width,WORLD.height]);
  assert.deepEqual(dimensions('buildings'),[288,112]);
  for (const name of ['hero-body','hero-equipment','tiles','village-ground','village-foreground','buildings','vista','training','icons']) {
    assert.ok(existsSync(`art/source/${name}.aseprite`));
    assert.equal(readFileSync(`art/source/${name}.aseprite`).readUInt16LE(4),0xa5e0);
  }
});
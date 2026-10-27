import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CHARACTER, WORLD } from '../src/art-spec.mjs';
import { EXERCISES } from '../src/engine.mjs';
const dimensions = name => { const b = readFileSync(`public/art/${name}.png`); assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a'); return [b.readUInt32BE(16),b.readUInt32BE(20)]; };
test('exported character sheets fit the canonical frame grid', () => {
  assert.deepEqual(dimensions('hero-body'), [CHARACTER.poses.length * CHARACTER.frameWidth,CHARACTER.frameHeight]);
  assert.deepEqual(dimensions('hero-equipment'), [CHARACTER.poses.length * CHARACTER.frameWidth,2*CHARACTER.frameHeight]);
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
  assert.deepEqual(dimensions('village-ground'),[WORLD.width*WORLD.textureScale,WORLD.height*WORLD.textureScale]);
  assert.deepEqual(dimensions('village-foreground'),[WORLD.width*WORLD.textureScale,WORLD.height*WORLD.textureScale]);
  assert.deepEqual(dimensions('buildings'),[3*WORLD.buildingFrameWidth,WORLD.buildingFrameHeight]);
  for (const name of ['hero-body','hero-equipment','tiles','village-ground','village-foreground','buildings','vista','training','icons']) {
    assert.ok(existsSync(`art/source/${name}.aseprite`));
    assert.equal(readFileSync(`art/source/${name}.aseprite`).readUInt16LE(4),0xa5e0);
  }
});
test('approved master layers remain editable and withheld poses are never advertised as available', () => {
  const source=readFileSync('art/source/hero-body.aseprite');
  for(const layer of ['Skin and face','Chestnut hair','Outfit and boots']) assert.ok(source.includes(Buffer.from(layer)));
  const metadata=JSON.parse(readFileSync('public/art/avatar.json','utf8'));
  for(const id of ['squat','push','lying']) assert.equal(metadata.frames.find(f=>f.id===id).available,false);
  for(const id of ['stand','march','calf','reach','walk-a','walk-b','idle-blink']) assert.equal(metadata.frames.find(f=>f.id===id).available,true);
  assert.equal(new Set(metadata.palette).size,metadata.palette.length);
  assert.ok(metadata.palette.length>=32);
});

test('workshop context and structure have independently editable component layers',()=>{
  const audit=JSON.parse(readFileSync('art/source-inventory.json','utf8'));
  const building=audit.find(a=>a.asset==='buildings'),context=audit.find(a=>a.asset==='workshop-context');
  for(const name of ['Original - Roof','Original - Walls and doorway','Restored - Roof','Restored - Window and banner']) assert.ok(building.layers.includes(name));
  assert.deepEqual(context.layers,['Approach terrain and foliage','Workbench tools and barrels','Front fence and stored stone']);
  assert.deepEqual(dimensions('workshop-context'),[WORLD.buildingFrameWidth,WORLD.buildingFrameHeight]);
  assert.ok(existsSync('art/source/workshop-context.aseprite'));
  assert.ok(building.visiblePixels.every(n=>n>0));
  assert.ok(context.visiblePixels.every(n=>n>0));
  assert.equal(CHARACTER.feetY,120);
});

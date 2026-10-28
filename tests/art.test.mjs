import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CHARACTER, WORLD, CORE_ILLUSTRATIONS } from '../src/art-spec.mjs';
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
  for (const e of EXERCISES) { if(e.illustration){assert.equal(e.artStatus,'illustrative');assert.equal(CHARACTER.exerciseIllustrations[e.id],e.illustration);assert.ok(CORE_ILLUSTRATIONS.poses.includes(e.illustration));}else if(e.pose===null){assert.equal(e.artStatus,'missing');assert.equal(e.focus,'core');}else{assert.equal(CHARACTER.exercisePoses[e.id],e.pose);assert.ok(CHARACTER.poses.includes(e.pose));} }
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

test('light outfit and review-only core use editable shared-model exports without scheduling lying',()=>{
  assert.deepEqual(dimensions('hero-training-outfit'),[CHARACTER.poses.length*CHARACTER.frameWidth,3*CHARACTER.frameHeight]);
  assert.equal(CHARACTER.trainingEquipment,'./art/hero-training-outfit.png');
  const core=readFileSync('art/review/core-study.png');assert.equal(core.readUInt32BE(16),160);assert.equal(core.readUInt32BE(20),288);
  const audit=JSON.parse(readFileSync('art/source-inventory.json','utf8'));
  for(const name of ['hero-training-outfit','hero-core-study'])assert.ok(audit.find(a=>a.asset===name).layers.length>=2);
  assert.ok(!EXERCISES.some(e=>e.id==='lying'||e.pose==='lying'));
  assert.equal(JSON.parse(readFileSync('public/art/avatar.json','utf8')).frames.find(f=>f.id==='lying').available,false);
});

test('four floor illustrations share canonical stages, editable parts and explicit unvalidated status',()=>{
 assert.deepEqual(dimensions('hero-core-poses'),[4*192,3*128]);
 const inventory=JSON.parse(readFileSync('art/source-inventory.json','utf8'));
 for(const id of CORE_ILLUSTRATIONS.poses){
  const e=EXERCISES.find(e=>e.id===id);assert.equal(e.reviewStatus,'unreviewed');assert.equal(e.artStatus,'illustrative');assert.notEqual(e.illustration,'lying');
  const source=readFileSync(`art/source/hero-core-${id}.aseprite`);assert.equal(source.readUInt16LE(4),0xa5e0);
  const record=inventory.find(x=>x.asset===`hero-core-${id}`);for(const layer of ['Skin and face','Chestnut hair','Teal training shirt','Adventurer cuffs','Veteran cuffs']){const i=record.layers.indexOf(layer);assert.ok(i>=0);assert.ok(record.visiblePixels[i]>0);}
 }
 const meta=JSON.parse(readFileSync('public/art/avatar.json'));assert.equal(meta.coreIllustrations.characterId,CHARACTER.id);assert.deepEqual(meta.coreIllustrations.stages,CHARACTER.stages);
 assert.equal(EXERCISES.find(e=>e.id==='modified-dead-bug').selectable,false);
});

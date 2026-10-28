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
  assert.equal(metadata.id,CHARACTER.id); assert.deepEqual(metadata.stages,CHARACTER.stages);assert.deepEqual(metadata.poseReferenceOffsets,CHARACTER.poseReferenceOffsets);
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
  const record=inventory.find(x=>x.asset===`hero-core-${id}`);for(const layer of ['Skin and face','Chestnut hair','Teal training shirt','Adventurer cuffs','Veteran cuffs','Supine head - face and neck','Supine head - collar and contour','Near forearm - separated','Far forearm - shaded depth','Upper-back support - shirt underside','Support contact shadows']){const i=record.layers.indexOf(layer);assert.ok(i>=0);assert.ok(record.visiblePixels[i]>0);}
 }
 const meta=JSON.parse(readFileSync('public/art/avatar.json'));assert.equal(meta.coreIllustrations.characterId,CHARACTER.id);assert.deepEqual(meta.coreIllustrations.stages,CHARACTER.stages);
 assert.equal(EXERCISES.find(e=>e.id==='modified-dead-bug').selectable,false);
});

test('launcher exports match the PWA/iOS contracts and retain editable Aseprite layers',()=>{
 const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
 assert.equal(manifest.name,'Little Strides');assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.id,'./');
 for(const icon of manifest.icons){const b=readFileSync('public/'+icon.src);assert.equal(`${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`,icon.sizes);assert.equal(icon.type,'image/png');}
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512'));
 const apple=readFileSync('public/icons/strides-apple-touch.png');assert.equal(apple.readUInt32BE(16),180);assert.equal(apple.readUInt32BE(20),180);
 const index=readFileSync('index.html','utf8');assert.ok(index.includes('strides-apple-touch.png'));assert.ok(index.includes('strides-favicon-32.png'));
 const audit=JSON.parse(readFileSync('art/review/interface-audit.json','utf8'));assert.ok(audit.criticalRadius<=audit.safeRadius);assert.equal(audit.safeRadius,64*.4);
 const source=readFileSync('art/source/app-icon.aseprite');assert.equal(source.readUInt16LE(4),0xa5e0);
 const record=JSON.parse(readFileSync('art/source-inventory.json','utf8')).find(a=>a.asset==='app-icon');for(const name of ['Forest enamel','Brass frame','Golden trail','Stride - front boot','Stride - rear boot'])assert.ok(record.layers.includes(name));assert.equal(record.visiblePixels[record.layers.indexOf('Forest enamel')],64*64);
});
test('UI glyphs use native 24px frames with separate editable icon layers',()=>{
 assert.deepEqual(dimensions('icons'),[24*8,24]);const record=JSON.parse(readFileSync('art/source-inventory.json','utf8')).find(a=>a.asset==='icons');assert.equal(record.layers.length,8);assert.ok(record.layers.includes('Timber - bound oak logs'));assert.ok(record.visiblePixels.every(n=>n>0));
});

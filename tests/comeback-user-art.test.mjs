import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/prototypes/comeback/user-art/';
const proof=JSON.parse(readFileSync(root+'proof.json','utf8'));
const imported=JSON.parse(readFileSync(root+'import.json','utf8'));
const inventory=JSON.parse(readFileSync(root+'inventory.json','utf8'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
test('supplied art retains honest provenance and byte-identical original copies',()=>{
 const sources=JSON.parse(readFileSync('art/direction/comeback-user/sources.json','utf8'));
 assert.equal(sources.originalsUnmodified,true);assert.equal(sources.files.length,6);
 for(const source of sources.files)assert.equal(hash(source.file),source.sha256);
 assert.equal(proof.nativeAuthored,false);assert.equal(proof.integrated,false);assert.equal(imported.nativeAuthored,false);assert.equal(proof.anatomyStatus,'provisional-unreviewed');
});
test('prepared character has crisp alpha, stable registration and connected figures',()=>{
 const m=proof.measurements;assert.equal(m.partialAlphaPixels,0);assert.ok(m.clearPixels>0);assert.ok(m.paletteSize<=32);assert.deepEqual(m.connectedComponentCounts,[1,1,1,1]);assert.equal(m.viewCropContainsSprites,true);assert.deepEqual(m.standingFootBaselines,[123,123]);assert.ok(m.standingStageDifference>30);assert.ok(m.floorStageDifference>30);
});
test('source-matched pose junctions preserve head and neck without rejected transforms',()=>{
 for(const master of proof.masters){assert.equal(hash(root+master.file),master.sha256);assert.equal(readFileSync(root+master.file).readUInt16LE(4),0xa5e0);}
 assert.equal(proof.masters.length,3);const parts=inventory.find(i=>i.name==='character');assert.ok(parts.layers.filter(l=>l.pixels>0).length>=24);
 const heads=inventory.find(i=>i.name==='heads');assert.equal(heads.structure,'source-matched-pose-junctions-with-shared-standing-head');assert.equal(heads.layers.length,4);assert.equal(imported.floorHead.rotationDegrees,0);assert.equal(imported.floorHead.bridgeAdded,false);assert.equal(proof.measurements.floorSourcePoseDifference,0);
 assert.equal(proof.measurements.standingHeadDifference,0);assert.equal(proof.measurements.floorSourcePoseDifference,0);assert.equal(proof.measurements.layerRecompositionDifference,0);
 const room=inventory.find(i=>i.name==='studio');assert.equal(room.structure,'full-detail-flattened-user-background');assert.equal(room.layers.length,1);assert.deepEqual(proof.measurements.roomDimensions,[1620,971]);assert.equal(imported.room.fullDetailPreserved,true);assert.equal(room.width,1620);assert.equal(room.height,971);assert.equal(proof.measurements.apartmentPixelDifference,0);
});
test('uploaded-art phone compositions fit both stages in touch WebKit and Chromium',()=>{
 assert.equal(proof.mobileChecks.length,8);for(const c of proof.mobileChecks){assert.equal(c.overflow,false);assert.equal(c.scrollHeight,c.clientHeight);assert.ok(c.primaryBottom<=c.navigationTop);assert.ok(c.targets.every(t=>t.width>=44&&t.height>=44));assert.deepEqual(c.errors,[]);}
 assert.ok(!readFileSync('src/art-spec.mjs','utf8').includes('comeback/user-art'));
});
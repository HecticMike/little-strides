import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {EXERCISES} from '../src/catalog.mjs';
const root='art/prototypes/comeback/';
const proof=JSON.parse(readFileSync(root+'proof.json','utf8'));
const inventory=JSON.parse(readFileSync(root+'inventory.json','utf8'));
const review=JSON.parse(readFileSync('docs/comeback-exercise-review.json','utf8'));
test('comeback proof is isolated, native-grid and materially editable',()=>{
 assert.equal(proof.integrated,false);assert.equal(proof.nativeAuthored,true);assert.equal(proof.clinicalStatus,'unreviewed-art-proof');
 for(const master of proof.masters){const b=readFileSync(root+master.file);assert.equal(b.readUInt16LE(4),0xa5e0);assert.equal(createHash('sha256').update(b).digest('hex'),master.sha256);}
 assert.deepEqual(inventory.map(i=>[i.name,i.width,i.height]),[['character',192,128],['studio',160,96]]);
 assert.ok(inventory[0].layers.filter(l=>l.pixels>0).length>=28);assert.ok(inventory[1].layers.filter(l=>l.pixels>0).length>=8);
 assert.equal(inventory[1].layers.find(l=>l.name==='Workout / Side-view mat').visible,false);for(const fragment of ['Near arm','Far bent leg','Near sliding leg','Shared canonical head'])assert.ok(inventory[0].layers.some(l=>l.name.includes(fragment)));
 assert.ok(!readFileSync('src/art-spec.mjs','utf8').includes('prototypes/comeback'));
});
test('proof stages preserve identity and anchors with visible native-grid physique differences',()=>{
 assert.equal(proof.measurements.wallPatchUnexpectedPixels,0);assert.equal(proof.measurements.workoutBackdropMatPixels,0);assert.equal(proof.measurements.standingHeadChangedPixels,0);assert.equal(proof.measurements.floorHeadChangedPixels,0);assert.deepEqual(proof.measurements.standingFootBaselines,[61,61]);assert.ok(proof.measurements.paletteSize<=32);
 assert.ok(proof.measurements.standingChangedPixels>=90);assert.ok(proof.measurements.heelSlideChangedPixels>=15);
 assert.deepEqual(proof.frames.map(f=>f.id),['starting-stand','developed-stand','starting-heel-slide','developed-heel-slide']);
});
test('phone proof review covers both stages and browsers without scrolling or hidden primary controls',()=>{
 assert.equal(proof.mobileChecks.length,8);assert.equal(proof.reviewChecks.length,2);for(const r of proof.reviewChecks){assert.equal(r.overflow,false);assert.ok(r.summaryHeight>=44);}
 for(const c of proof.mobileChecks){assert.equal(c.overflow,false);assert.equal(c.scrollHeight,c.clientHeight);assert.ok(c.primary.bottom<=c.nav.top);assert.ok(c.controls.every(b=>b.width>=44&&b.height>=44));assert.deepEqual(c.errors,[]);assert.ok(existsSync(root+c.engine+'-'+c.view+'-'+c.stage+'.png'));}
});
test('review matrix preserves existing eligibility and keeps new Pilates candidates out of prescriptions',()=>{
 assert.equal(review.status,'proposal-only-no-live-eligibility-changes');
 for(const e of EXERCISES){const row=review.rows.find(r=>r.id===e.id);assert.ok(row);assert.equal(row.currentSelectable,e.selectable);assert.equal(row.clinicalStatus,e.reviewStatus);assert.equal(row.loadKind,e.loadKind);}
 for(const id of ['bent-knee-fall-out','single-knee-fold']){const row=review.rows.find(r=>r.id===id);assert.equal(row.currentSelectable,false);assert.equal(row.clinicalStatus,'research-only-unreviewed');assert.equal(row.scheduling,null);assert.equal(row.loadKind,null);assert.equal(row.artStatus,'missing');assert.ok(!EXERCISES.some(e=>e.id===id));assert.ok(row.sourceUrl.startsWith('https://'));}
 assert.equal(review.rows.find(r=>r.id==='reach').proposedProfileAction,'profile-review');
 assert.ok(review.gaps.length>=4);
});
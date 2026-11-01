import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {REVIEW_CANDIDATES} from '../src/review-candidates.mjs';import {EXERCISES} from '../src/catalog.mjs';
test('research cards match source-reviewed records and remain unavailable with no invented dose',()=>{
 const source=JSON.parse(readFileSync('docs/comeback-exercise-review.json','utf8')).rows.filter(r=>r.proposedProfileAction==='research-only');assert.deepEqual(REVIEW_CANDIDATES.map(r=>r.id),source.map(r=>r.id));assert.ok(Object.isFrozen(REVIEW_CANDIDATES));
 for(const r of REVIEW_CANDIDATES){const original=source.find(s=>s.id===r.id);assert.equal(r.selectable,false);assert.equal(r.scheduling,null);assert.equal(r.clinicalStatus,'research-only-unreviewed');assert.equal(r.sourceUrl,original.sourceUrl);assert.equal(r.purpose,original.purposeReview);assert.equal(r.reviewNeeded,original.individualReview);assert.ok(!EXERCISES.some(e=>e.id===r.id));assert.ok(new URL(r.sourceUrl).hostname.endsWith('nhs.uk'));}
});

import { testSession as createSession, TEST_SETTINGS } from './fixtures.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshState, finish, progress, recovery, validateBackup } from '../src/engine.mjs';
import { workshopState, restoreWorkshop, rewardOutcome, TIMBER_RULE } from '../src/gameplay.mjs';
import { route, walkable, destinations } from '../src/village-path.mjs';
const at = 1_000_000;
function earned(mode='workout') { const state=freshState();state.active=createSession(7,[],at,{mode});return finish(state,true,at+420_000); }
test('one genuine completion gives one reward; early, preview and duplicate records cannot add rewards',()=>{
  const done=earned();assert.equal(progress(done.history),1);assert.equal(workshopState(done).balance,1);
  assert.equal(progress([...done.history,...done.history]),1);
  assert.equal(progress(earned('preview').history),0);
  assert.deepEqual(recovery(earned('preview').history,at+500_000).resting,[]);
  const early=freshState();early.active=createSession(7,[],at);assert.equal(progress(finish(early,true,at+31_000).history),0);
  assert.deepEqual(finish(done,true,at+900_000),done);
});
test('restoration spends one earned record once, persists through JSON and refuses insufficient funds',()=>{
  assert.throws(()=>restoreWorkshop(freshState()));
  const state=earned();assert.equal(workshopState(state).stage,0);
  const restored=restoreWorkshop(state,at+500_000);
  assert.equal(workshopState(restored).balance,0);assert.equal(workshopState(restored).stage,1);
  assert.strictEqual(restoreWorkshop(restored),restored);
  assert.deepEqual(validateBackup({format:'little-strides',schemaVersion:1,data:restored}),restored);
  const corrupt=structuredClone(restored);corrupt.world.workshop.spentRewardIds=['unearned'];
  assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:corrupt}));
});
test('legacy phase-2 building is preserved without changing exercise history',()=>{
  const state=earned(),history=structuredClone(state.history);delete state.world;
  const migrated=validateBackup({format:'little-strides',schemaVersion:1,data:state});
  assert.equal(workshopState(migrated).stage,1);assert.equal(workshopState(migrated).balance,0);assert.deepEqual(migrated.history,history);
});
test('all building approaches route through passable adjacent tiles and blocked ground is rejected',()=>{
  for(const target of Object.values(destinations)){
    const path=route([168,216],target);assert.ok(path.length);assert.deepEqual(path.at(-1),target);
    let previous=[168,216];
    for(const point of path){assert.ok(walkable(Math.floor(point[0]/16),Math.floor(point[1]/16)));assert.equal(Math.abs(point[0]-previous[0])+Math.abs(point[1]-previous[1]),16);previous=point;}
  }
  assert.deepEqual(route([168,216],[312,255]),[]);assert.deepEqual(route([168,216],[64,96]),[]);
});
test('timber outcomes explain partial, preview, early-ended and fully completed sessions consistently',()=>{
 assert.match(TIMBER_RULE,/one entire/);assert.match(TIMBER_RULE,/automatically/);
 const state=freshState();state.active=createSession(7,[],at);
 const partial=finish(state,false,at+25000).history[0];assert.equal(rewardOutcome(partial).earned,0);assert.match(rewardOutcome(partial).reason,/scheduled movement/);
 const setupOnly=finish(state,false,at+1000).history[0];assert.match(rewardOutcome(setupOnly).reason,/no movement time/);
 assert.equal(rewardOutcome(earned().history[0]).earned,1);
 const allWorkButEarly=finish(state,false,at+419000).history[0];assert.equal(rewardOutcome(allWorkButEarly).earned,0);assert.match(rewardOutcome(allWorkButEarly).reason,/final countdown/);
 assert.equal(rewardOutcome({...earned().history[0],mode:'preview'}).earned,0);
 for(const h of [partial,setupOnly,allWorkButEarly,earned().history[0]])assert.equal(rewardOutcome(h).earned,progress([h]));
});

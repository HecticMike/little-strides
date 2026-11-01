import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MILESTONE_MOMENTS,earnedMoments} from '../src/milestone-moments.mjs';
import {COMEBACK_MILESTONES,comebackProgress,migrateComeback} from '../src/comeback.mjs';
import {comebackAppearance} from '../src/comeback-stages.mjs';
import {freshState,createSession,createPreviewSession,finish,duration,freeze,validateBackup} from '../src/engine.mjs';
import {backup} from '../src/storage.mjs';
import {milestoneState} from './milestone-fixture.mjs';
const now=Date.parse('2026-11-01T10:00:00Z');
test('five short moments use existing thresholds and canonical historical stages',()=>{
 assert.deepEqual(MILESTONE_MOMENTS.map(m=>m.at),COMEBACK_MILESTONES.map(m=>m.at));assert.ok(Object.isFrozen(MILESTONE_MOMENTS));
 for(const m of MILESTONE_MOMENTS){assert.equal(m.appearance,comebackAppearance(m.at));assert.equal(m.paragraphs.length,2);assert.ok(m.paragraphs.join(' ').split(/\s+/).length<80);assert.ok(Object.isFrozen(m.paragraphs));}
});
test('reading moments never awards, mutates records, invents dates or unlocks from unsaved activity',()=>{
 assert.deepEqual(earnedMoments(freshState()),[]);const state=milestoneState(7,now),before=structuredClone(state);assert.deepEqual(earnedMoments(state).map(m=>m.at),[0]);assert.deepEqual(earnedMoments(state),earnedMoments(state));assert.deepEqual(state,before);
 state.active=createSession(3,state.history,now,{settings:state.settings});assert.deepEqual(earnedMoments(state).map(m=>m.at),[0]);state.active=freeze(state.active,now+duration(state.active));assert.deepEqual(earnedMoments(state).map(m=>m.at),[0]);
 const saved=finish(state,true,now+duration(state.active));assert.deepEqual(earnedMoments(saved).map(m=>m.at),[0,8]);assert.equal(earnedMoments(saved)[1].unlockedAt,saved.comeback.milestones[1].unlockedAt);assert.equal(earnedMoments(saved)[1].sessionId,saved.history.at(-1).id);
});
test('all illustrated milestones retain their original dates and stages through backup and absence',()=>{
 const state=milestoneState(96,now),before=structuredClone(state),moments=earnedMoments(state);assert.deepEqual(moments.map(m=>m.appearance),['starting','rhythm','form','confident','developed']);assert.equal(comebackProgress(state).appearance,'developed');
 const restored=validateBackup(JSON.parse(backup(state)));assert.deepEqual(earnedMoments(restored),moments);assert.deepEqual(earnedMoments(migrateComeback(restored,now+365*86400000)),moments);assert.deepEqual(state,before);
});
test('preview completion creates no milestone moment or extra credit',()=>{
 const state=milestoneState(7,now),before=structuredClone(state.comeback);state.active=createPreviewSession(3,now);const saved=finish(state,true,now+180000);assert.deepEqual(saved.comeback,before);assert.deepEqual(earnedMoments(saved).map(m=>m.at),[0]);
});

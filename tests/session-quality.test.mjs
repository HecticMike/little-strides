import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,createSession,finish,duration,skip} from '../src/engine.mjs';
import {planSession,capacityFits,exerciseEligibility} from '../src/scheduler.mjs';
import {withTrainingProfile,recommendationSettings,setTodayAdjustment} from '../src/training.mjs';
import {openingCosts} from '../src/suggestions.mjs';
import {exercise,RECOVERY_DEFAULTS} from '../src/catalog.mjs';
const at=Date.parse('2026-11-01T10:00:00Z'),hour=3600000;
const start=()=>withTrainingProfile(freshState());
function completed(s,t=at){s.active=createSession(10,s.history,t,{settings:recommendationSettings(s,t)});return finish(s,true,t+duration(s.active));}
const plan=(s,m,t=at)=>planSession(m,s.history,t,recommendationSettings(s,t));
const blocks=p=>p.segments.filter(b=>b.kind==='work');
function check(p,m,s,t){assert.ok(p.segments);assert.equal(p.segments.reduce((n,b)=>n+b.durationMs,0),m*60000);assert.ok(capacityFits(blocks(p).map(b=>({exerciseId:b.exerciseId,actualMs:b.durationMs})),s.history,t,recommendationSettings(s,t)));const positions=blocks(p).map(b=>exercise(b.exerciseId).position);assert.ok(positions.filter((v,i)=>i&&v!==positions[i-1]).length<=1);}
test('profile shortages offer an exact same-focus shorter plan, or an explicitly different gentle three-minute alternative',()=>{
 const s=start();for(const m of [15,20]){const p=plan(s,m);assert.equal(p.segments,null);assert.deepEqual(p.fallback,{minutes:10,focus:'balanced'});check(plan(s,10),10,s,at);}
 const done=completed(s),t=at+5*hour,p=plan(done,10,t);assert.equal(p.segments,null);assert.deepEqual(p.fallback,{minutes:3,focus:'recovery'});assert.deepEqual(p.availableMinutes,[]);assert.match(p.reason,/three-minute activation\/mobility alternative/);const gentle=plan(done,3,t);check(gentle,3,done,t);assert.ok(blocks(gentle).every(b=>['activation','mobility'].includes(exercise(b.exerciseId).loadKind)));assert.equal(gentle.summary.strength,0);assert.equal(gentle.summary.aerobic,0);
});
test('fallback never clears symptoms, clinical locks, exclusions or exhausted exposure limits',()=>{
 let s=start();s.settings.enabledExercises=[];assert.equal(plan(s,10).fallback,null);
 s=start();s=setTodayAdjustment(s,{areas:['knees'],worseThanUsual:true,fatigue:'unknown'},at);const before=structuredClone(s);assert.equal(plan(s,10).fallback,null);assert.deepEqual(s,before);
 s=start();s.settings.recovery={maxJointSeconds:60};assert.equal(plan(s,10).fallback,null);assert.ok(['squat','push','modified-dead-bug'].every(id=>exerciseEligibility([],at,recommendationSettings(s)).find(e=>e.id===id).status==='locked'));
});
test('a regular cardio shortage labels the gentle fallback as a different purpose',()=>{
 const s=completed(start()),t=at+5*hour;s.settings.sessionFocus='cardio';const p=plan(s,10,t);assert.equal(p.segments,null);assert.deepEqual(p.fallback,{minutes:3,focus:'recovery'});assert.match(p.reason,/not a strengthening or aerobic session/);assert.equal(plan(s,3,t).focus,'recovery');
});
test('actual session openings vary deterministically after recovery within unchanged dose and eligibility limits',()=>{
 const s=start(),first=plan(s,10);const done=completed(s),t=at+50*hour,next=plan(done,10,t),before=structuredClone(done);check(next,10,done,t);assert.notEqual(blocks(first)[0].exerciseId,blocks(next)[0].exerciseId);assert.deepEqual(next,plan(done,10,t));assert.deepEqual(done,before);assert.equal(next.summary.strength,first.summary.strength);assert.ok(!blocks(next).some(b=>['reach','squat','push','modified-dead-bug'].includes(b.exerciseId)));
});
test('opening preferences use performed replacements, not skipped plans, previews, duplicates or future records',()=>{
 const base={id:'fictional-opening',mode:'workout',endedAt:at,movements:[{exerciseId:'abdominal-bracing',actualMs:0},{exerciseId:'heel-slide',actualMs:15000},{exerciseId:'pelvic-tilt',actualMs:30000}]};assert.deepEqual(openingCosts([base],at),{'heel-slide':30});assert.deepEqual(openingCosts([base,base],at),openingCosts([base],at));assert.deepEqual(openingCosts([{...base,mode:'preview'}],at),{});assert.deepEqual(openingCosts([{...base,endedAt:at+1}],at),{});assert.deepEqual(openingCosts([base],at+8*24*hour),{});
});
test('variety remains optional with a single eligible gentle movement',()=>{
 let s=start();s.settings.enabledExercises=['heel-slide'];s.active=createSession(3,[],at,{settings:s.settings});s=finish(s,true,at+duration(s.active));const t=at+hour,p=plan(s,3,t);check(p,3,s,t);assert.ok(blocks(p).every(b=>b.exerciseId==='heel-slide'));
});
test('same-afternoon and next-day recommendations use actual completed and skipped exposure without lifting defaults',()=>{
 const done=completed(start());for(const t of [at+5*hour,at+25*hour]){const p=plan(done,10,t);if(p.segments){check(p,10,done,t);assert.ok(blocks(p).every(b=>exercise(b.exerciseId).loadKind!=='strength'));}else assert.ok(p.fallback);}
 let partial=start();partial.active=createSession(10,[],at,{settings:partial.settings});const setup=partial.active.segments[0].durationMs;partial.active=skip(partial.active,at+setup);partial=finish(partial,false,at+setup);assert.equal(partial.history[0].activeMs,0);assert.ok(plan(partial,10,at+hour).segments);assert.deepEqual(RECOVERY_DEFAULTS,{strengthHours:48,discomfortHours:48,windowHours:24,maxStrengthSeconds:90,maxRepeatableSeconds:600,maxJointSeconds:600});
});

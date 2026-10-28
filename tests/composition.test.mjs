import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EXERCISES,RECOVERY_DEFAULTS,LOADING_MODEL,planningMetadata,normaliseFocus} from '../src/catalog.mjs';
import {planSession,recovery,capacityFits,exerciseEligibility} from '../src/scheduler.mjs';
import {createSession,finish,freshState,progress,validateBackup,freeze,resume,performedMovements,replace,position} from '../src/engine.mjs';
import {activitySummary} from '../src/activity.mjs';
const at=Date.parse('2026-10-28T09:00:00Z'),settings={muted:false,volume:.45,enabledExercises:EXERCISES.filter(e=>e.selectable).map(e=>e.id)};
const work=p=>p.segments.filter(b=>b.kind==='work');
function complete(state,minutes,time){state.active=createSession(minutes,state.history,time,{settings:state.settings});return finish(state,true,time+minutes*60000);}
function check(plan,minutes,history=[],time=at,custom=settings){
  assert.ok(plan.segments);assert.equal(plan.segments.reduce((n,b)=>n+b.durationMs,0),minutes*60000);
  assert.ok(capacityFits(work(plan).map(b=>({exerciseId:b.exerciseId,actualMs:b.durationMs})),history,time,custom));
  const ids=new Set(exerciseEligibility(history,time,custom).filter(e=>e.status==='eligible').map(e=>e.id));
  for(const b of work(plan))assert.ok(ids.has(b.exerciseId));
  assert.equal(Object.values(plan.summary).reduce((n,v)=>n+v,0),work(plan).reduce((n,b)=>n+b.durationMs,0));
  const blocks=work(plan);for(let i=1;i<blocks.length;i++)if(blocks[i].exerciseId===blocks[i-1].exerciseId)assert.ok(blocks[i].intentionalContinuation||blocks[i].intentionalInterval);
  let previous=null;for(const b of plan.segments){if(b.kind==='work'&&previous){const rest=plan.segments.slice(previous.index+1,plan.segments.indexOf(b)).reduce((n,x)=>n+x.durationMs,0),e=EXERCISES.find(e=>e.id===previous.b.exerciseId),next=EXERCISES.find(e=>e.id===b.exerciseId);if(!b.intentionalContinuation)assert.ok(rest>=Math.max(planningMetadata(e,custom).restSeconds,e.position!==next.position?45:0)*1000);}
    if(b.kind==='work')previous={b,index:plan.segments.indexOf(b)};}
}
for(const minutes of [7,10,15,20])test(`audit scenario: ${minutes} minutes is deterministic, exact and within unchanged caps`,()=>{
  const before=structuredClone(settings),p=planSession(minutes,[],at,settings);check(p,minutes);assert.deepEqual(p,planSession(minutes,[],at,settings));assert.deepEqual(settings,before);
  assert.ok(!p.segments.some(b=>['squat','push','modified-dead-bug'].includes(b.exerciseId)));
  const core=work(p).filter(b=>b.exerciseId==='glute-bridge').reduce((n,b)=>n+b.durationMs,0);assert.equal(core,90000);
  if(minutes>=10)assert.ok(p.summary.aerobic>45000);
  if(minutes>=15){assert.ok(p.summary.activation<=90000);assert.ok(work(p).some(b=>b.exerciseId==='march'&&b.durationMs>=120000));}
});
test('same afternoon and following day use completed history, exclude recovering strength and label alternatives',()=>{
  let state=freshState();state.settings=structuredClone(settings);state=complete(state,10,at);
  for(const time of [at+6*3600000,at+25*3600000]){
    const p=planSession(10,state.history,time,state.settings);check(p,10,state.history,time);assert.equal(p.summary.strength,0);assert.match(p.label,/Movement/);assert.ok(p.notes.some(s=>/Core strengthening is recovering/.test(s)));
    assert.ok(!work(p).some(b=>['glute-bridge','calf'].includes(b.exerciseId)));state=complete(state,10,time);
  }
  assert.equal(state.history.length,3);assert.equal(progress(state.history),3);assert.equal(progress([...state.history,...state.history]),3);assert.deepEqual(finish(state,true),state);
  assert.deepEqual(validateBackup({format:'little-strides',schemaVersion:1,data:state}),state);
  assert.ok(recovery(state.history,at+25*3600000,settings).resting.includes('core'));
});
test('four focuses express preferences without changing eligibility or strength recovery',()=>{
  assert.equal(normaliseFocus('mixed'),'balanced');assert.equal(normaliseFocus(undefined),'balanced');
  for(const focus of ['balanced','core','cardio','recovery']){
    const p=planSession(10,[],at,{...settings,sessionFocus:focus});check(p,10,[],at,{...settings,sessionFocus:focus});
    if(focus==='core')assert.ok(work(p).every(b=>EXERCISES.find(e=>e.id===b.exerciseId).focus==='core'));
    if(focus==='recovery'){assert.equal(p.summary.strength,0);assert.equal(p.summary.aerobic,0);}
    if(focus==='cardio'){assert.ok(p.summary.aerobic>=120000);assert.ok(p.summary.aerobic>planSession(10,[],at,settings).summary.aerobic);}
  }
  const missing=planSession(10,[],at,{...settings,enabledExercises:settings.enabledExercises.filter(id=>id!=='march'),sessionFocus:'cardio'});assert.equal(missing.segments,null);assert.equal(missing.alternativeFocus,'balanced');assert.match(missing.reason,/No eligible aerobic/);
  const recoveryMissing=planSession(7,[],at,{...settings,enabledExercises:['march'],sessionFocus:'recovery'});assert.equal(recoveryMissing.segments,null);assert.match(recoveryMissing.reason,/No eligible activation or mobility/);assert.equal(recoveryMissing.alternativeFocus,'balanced');
});
test('limited pools and symptoms cannot be filled with recovering or disabled activity',()=>{
  assert.equal(planSession(7,[],at,{enabledExercises:[]}).segments,null);
  assert.equal(planSession(7,[],at,{enabledExercises:['glute-bridge']}).segments,null);
  assert.equal(planSession(20,[],at,{enabledExercises:['march']}).segments,null);
  assert.equal(planSession(20,[],at,{...settings,sessionFocus:'core'}).segments,null);
  const custom={...settings,exerciseHolds:{march:at}},p=planSession(10,[],at,custom);check(p,10,[],at,custom);assert.ok(!work(p).some(b=>b.exerciseId==='march'));assert.ok(p.notes.some(s=>/discomfort/.test(s)));
});
test('active preparation/wind-down is recorded, passive setup/rest is not; activation stays separate',()=>{
  let state=freshState();state.settings=settings;state=complete(state,10,at);const h=state.history[0],summary=activitySummary(state.history,at+600000).today;
  assert.ok(h.segments.some(b=>b.kind==='work'&&b.phase==='warmup'));assert.ok(h.segments.some(b=>b.kind==='work'&&b.phase==='winddown'&&b.durationMs<=60000));
  assert.equal(summary.activeMs,h.activeMs);assert.equal(summary.aerobicMs+summary.strengthMs+summary.mobilityMs+summary.activationMs,h.activeMs);assert.ok(summary.activationMs>0);
  assert.equal(h.activeMs,h.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0));assert.ok(h.movements.every(m=>m.repetitions===null));
});
test('paused continuous blocks, skip accounting and unavailable long-block replacements remain honest',()=>{
  const s=createSession(10,[],at,{settings}),start=s.segments[0].durationMs;
  const paused=freeze(s,at+start+10000),continued=resume(paused,at+3600000),moves=performedMovements(continued,at+3605000);
  assert.equal(moves.reduce((n,m)=>n+m.actualMs,0),15000);
  const longIndex=s.segments.findIndex(b=>b.exerciseId==='march'&&b.durationMs>120000),offset=s.segments.slice(0,longIndex).reduce((n,b)=>n+b.durationMs,0);
  const attempt=replace(s,at+offset+1000,{settings});assert.match(attempt.replacementMessage,/No suitable/);
  assert.equal(position(s,at+offset+1000).paceTotal,Math.ceil(s.segments[longIndex].durationMs/3000));
});
test('existing fixed-block engine-v2 sessions import, resume and complete without conversion',()=>{
  let state=freshState();state.settings={...settings,sessionFocus:'mixed'};let s=createSession(7,[],at,{settings});
  delete s.compositionVersion;delete s.focus;delete s.focusLabel;
  s.segments=[{kind:'prepare',exerciseId:null,durationMs:30000}];for(let i=0;i<6;i++)s.segments.push({kind:'work',exerciseId:'march',durationMs:45000},{kind:'rest',exerciseId:'march',durationMs:15000});s.segments.push({kind:'cooldown',exerciseId:null,durationMs:30000});s.plan=structuredClone(s.segments);state.active=s;
  const restored=validateBackup({format:'little-strides',schemaVersion:1,data:state});assert.deepEqual(restored.active,s);state=finish(restored,true,at+420000);assert.equal(state.history[0].activeMs,270000);assert.equal(progress(state.history),1);
});
test('loading assumptions are explicit and quantitative limits are unchanged',()=>{
  assert.deepEqual(RECOVERY_DEFAULTS,{strengthHours:48,discomfortHours:48,windowHours:24,maxStrengthSeconds:90,maxRepeatableSeconds:600,maxJointSeconds:600});assert.equal(LOADING_MODEL.biomechanicalLoad,null);assert.match(LOADING_MODEL.jointExposureBasis,/unweighted/);
  const e=EXERCISES.find(e=>e.id==='march');assert.equal(planningMetadata(e,{planning:{march:{maxSeconds:600}}}).maxSeconds,180);
  const state=freshState();state.settings.planning={march:{restSeconds:NaN}};assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:state}));
});

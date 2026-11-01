import {test} from 'node:test';import assert from 'node:assert/strict';
import {jointTimeMode,validLoadingPolicy} from '../src/loading-policy.mjs';
import {freshState,createSession,finish,duration,freeze,skip,canResumeSession,validateBackup,setExerciseHold} from '../src/engine.mjs';
import {planSession,exerciseEligibility,recovery,capacityFits} from '../src/scheduler.mjs';
import {withTrainingProfile,recommendationSettings,setTodayAdjustment} from '../src/training.mjs';
import {EXERCISES,exercise,RECOVERY_DEFAULTS,planningMetadata} from '../src/catalog.mjs';
import {migrateComeback,comebackProgress} from '../src/comeback.mjs';
import {backup} from '../src/storage.mjs';
const at=Date.parse('2026-11-01T10:00:00Z'),hour=3600000,policy=mode=>({version:1,mode,selectedAt:at});
function start(mode){let s=withTrainingProfile(freshState());if(mode)s.settings.loadingPolicy=policy(mode);return migrateComeback(s,at);}
const plan=(s,m=20,t=at)=>planSession(m,s.history,t,recommendationSettings(s,t));
function complete(s,minutes=20){s.active=createSession(minutes,s.history,at,{settings:recommendationSettings(s,at)});return finish(s,true,at+duration(s.active));}
const round=s=>validateBackup(JSON.parse(backup(s)));
test('absence, old backups and malformed raw policies fail closed to unchanged strict defaults',()=>{
 const s=start(),before=structuredClone(s);assert.equal(jointTimeMode(s.settings),'strict');assert.equal(plan(s).segments,null);assert.equal(round(s).settings.loadingPolicy,undefined);assert.deepEqual(s,before);assert.deepEqual(RECOVERY_DEFAULTS,{strengthHours:48,discomfortHours:48,windowHours:24,maxStrengthSeconds:90,maxRepeatableSeconds:600,maxJointSeconds:600});
 for(const p of [null,{},[],{version:2,mode:'advisory',selectedAt:at},{version:1,mode:'advisory'},{version:1,mode:'unlimited',selectedAt:at}]){assert.equal(validLoadingPolicy(p),false);assert.equal(jointTimeMode({loadingPolicy:p}),'strict');}
});
test('explicit advisory mode permits exact7/10/15/20 plans without raising numerical budgets or per-block limits',()=>{
 const s=start('advisory'),before=structuredClone(s.settings);for(const m of [7,10,15,20]){const p=plan(s,m);assert.ok(p.segments);assert.equal(p.segments.reduce((n,b)=>n+b.durationMs,0),m*60000);assert.equal(p.jointExposure.mode,'advisory');assert.equal(p.jointExposure.guideMs,600000);assert.ok(capacityFits(p.segments.filter(b=>b.kind==='work').map(b=>({exerciseId:b.exerciseId,actualMs:b.durationMs})),[],at,s.settings));const positions=p.segments.filter(b=>b.kind==='work').map(b=>exercise(b.exerciseId).position);assert.ok(positions.filter((v,i)=>i&&v!==positions[i-1]).length<=1);}
 const long=plan(s),knees=long.jointExposure.rows.find(r=>r.joint==='knees');assert.equal(knees.completedMs,0);assert.ok(knees.plannedMs>600000);assert.equal(knees.exceedsGuide,true);assert.ok(long.notes.some(n=>n.includes('exceeds your 10-minute')));assert.deepEqual(s.settings,before);assert.equal(planningMetadata(exercise('march'),s.settings).maxSeconds,180);
});
test('strength, muscles, discomfort, profile restrictions and per-movement caps remain strict in advisory mode',()=>{
 let s=complete(start('advisory'));for(const time of [at+5*hour,at+25*hour]){const p=plan(s,10,time);assert.ok(p.segments);assert.equal(p.summary.strength,0);assert.ok(!p.segments.some(b=>['calf','glute-bridge'].includes(b.exerciseId)));}
 const choices=exerciseEligibility([],at,start('advisory').settings);for(const id of ['squat','push','modified-dead-bug'])assert.equal(choices.find(e=>e.id===id).status,'locked');assert.equal(choices.find(e=>e.id==='reach').status,'profile');
 assert.equal(capacityFits([{exerciseId:'march',actualMs:600001}],[],at,s.settings),false);assert.equal(capacityFits([{exerciseId:'glute-bridge',actualMs:90001}],[],at,s.settings),false);
 s=setExerciseHold(start('advisory'),'heel-slide',true,at);assert.ok(!plan(s,10).segments.some(b=>b.exerciseId==='heel-slide'));s=setTodayAdjustment(start('advisory'),{areas:['knees'],worseThanUsual:true,fatigue:'unknown'},at);assert.equal(plan(s).segments,null);assert.equal(plan(s,3,at+72*hour).segments,null);
 const tired=setTodayAdjustment(start('advisory'),{areas:[],worseThanUsual:null,fatigue:'high'},at),gentle=plan(tired,10);assert.ok(gentle.segments);assert.equal(gentle.summary.strength,0);assert.equal(gentle.summary.aerobic,0);
});
test('advisory projections count actual completed movement, exclude preparation/skip time and do not infer force',()=>{
 let s=start('advisory');s.active=createSession(20,[],at,{settings:s.settings});const first=s.active.segments.find(b=>b.kind==='work'),setup=s.active.segments[0].durationMs;s=finish({...s,active:freeze(s.active,at+setup+10000)},false,at+setup+10000);const p=plan(s,10,at+hour),used=recovery(s.history,at+hour,s.settings).jointUsed;
 for(const row of p.jointExposure.rows){assert.equal(row.completedMs,used[row.joint]||0);assert.equal(row.totalMs,row.completedMs+row.plannedMs);}for(const joint of exercise(first.exerciseId).joints)assert.equal(used[joint],10000);
 let skipped=start('advisory');skipped.active=createSession(20,[],at,{settings:skipped.settings});skipped.active=skip(skipped.active,at+skipped.active.segments[0].durationMs);skipped=finish(skipped,false,at+setup);assert.equal(skipped.history[0].activeMs,0);assert.deepEqual(recovery(skipped.history,at+hour,skipped.settings).jointUsed,{});
});
test('switching back to strict checks remaining plans without rewriting past records or duplicate credit',()=>{
 let s=complete(start('advisory')),before=structuredClone(s);s.settings.loadingPolicy=policy('strict');const restored=round(s);assert.deepEqual(restored.history,before.history);assert.deepEqual(restored.comeback,before.comeback);assert.equal(comebackProgress(restored).units,1);assert.equal(plan(restored).segments,null);
 const a=start('advisory');a.active=freeze(createSession(20,[],at,{settings:a.settings}),at+45000);assert.equal(canResumeSession(a.active,[],at+hour,a.settings),true);a.settings.loadingPolicy=policy('strict');assert.equal(canResumeSession(a.active,[],at+hour,a.settings),false);
});
test('backups preserve explicit policy, existing custom numerical limits, holds and interrupted sessions',()=>{
 const s=start('advisory');s.settings.recovery={maxJointSeconds:900,maxRepeatableSeconds:600};s.settings.exerciseHolds={reach:at};s.active=freeze(createSession(20,[],at,{settings:s.settings}),at+45000);assert.deepEqual(round(s),s);
 for(const bad of [null,{},[],{version:99,mode:'advisory',selectedAt:at},{version:1,mode:'advisory',selectedAt:-1},{version:1,mode:'unsafe',selectedAt:at},{version:1,mode:'advisory'}]){const broken=structuredClone(s);broken.settings.loadingPolicy=bad;assert.throws(()=>round(broken));}assert.deepEqual(round(s).settings.recovery,s.settings.recovery);
});

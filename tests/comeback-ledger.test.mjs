import {test} from 'node:test';import assert from 'node:assert/strict';
import {freshState,createSession,createPreviewSession,finish,freeze,duration,validateBackup,setFeedback,setExerciseHold,canResumeSession} from '../src/engine.mjs';
import {exercise} from '../src/catalog.mjs';
import {migrateComeback,awardComeback,comebackProgress,comebackCredit,validComeback} from '../src/comeback.mjs';
import {purchaseProject} from '../src/gameplay.mjs';
import {backup} from '../src/storage.mjs';
const at=Date.parse('2026-10-29T10:00:00Z'),day=86400000;
const round=s=>validateBackup(JSON.parse(backup(s)));
function complete(state=freshState(),t=at,minutes=3){const active=createSession(minutes,state.history,t,{settings:state.settings});return finish({...state,active},true,t+duration(active));}
function past(count){let s=freshState();for(let i=0;i<count;i++)s=complete(s,at+i*day);return s;}
function oldRecord(s,id,completed){const segments=[];for(let i=0;i<7;i++)segments.push({kind:'work',exerciseId:'march',durationMs:45000},{kind:'rest',exerciseId:'march',durationMs:15000});return {schemaVersion:1,id,deviceId:s.deviceId,startedAt:at,endedAt:at+420000,minutes:7,elapsedMs:completed?420000:120000,activeMs:completed?315000:90000,completed,groups:['mobility'],segments,events:[]};}
test('one-time migration preserves history, training, exclusions and interrupted checkpoint exactly',()=>{
 let s=past(2);s=setExerciseHold(s,'reach',true,at+2*day);s.active=freeze(createSession(3,s.history,at+3*day,{settings:s.settings}),at+3*day+45000);const original=structuredClone(s),next=migrateComeback(s,at+4*day);for(const k of ['history','settings','active','world','updatedAt'])assert.deepEqual(next[k],original[k]);assert.equal(next.comeback.entries.length,2);assert.equal(comebackProgress(next).units,2);assert.strictEqual(migrateComeback(next,at+8*day),next);assert.deepEqual(s,original);assert.deepEqual(round(next),next);
});
test('full sessions have equal persisted credit at every length; zero/previews cannot manufacture credit',()=>{
 for(const minutes of [3,7,10,15,20]){const s=complete(migrateComeback(freshState(),at),at,minutes);assert.equal(s.comeback.entries.length,1);assert.equal(s.comeback.entries[0].units,1);assert.equal(comebackProgress(round(s)).units,1);}
 let s=migrateComeback(freshState(),at);s.active=createPreviewSession(3,at);s=finish(s,true,at+180000);assert.equal(s.history.length,0);assert.equal(s.comeback.entries.length,0);s.active=createSession(3,[],at,{settings:s.settings});s=finish(s,false,at);assert.equal(s.comeback.entries[0].units,0);assert.equal(comebackProgress(s).sessionCount,0);
});
test('partial credit is actual eligible movement only; pauses and skipped time never earn units',()=>{
 let s=migrateComeback(freshState(),at);s.active=createSession(3,[],at,{settings:s.settings});const planned=s.active.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0),prep=s.active.segments[0].durationMs;s.active=freeze(s.active,at+prep+10000);s=finish(s,false,at+prep+100000);const e=s.comeback.entries[0];assert.equal(e.actualMs,10000);assert.equal(e.plannedMs,planned);assert.equal(e.units,10000/planned);assert.equal(comebackCredit(s.history[0],s.comeback),e.units);assert.deepEqual(round(s),s);
});
test('duplicate finish and migration retain the first record and cannot award again',()=>{
 let s=migrateComeback(freshState(),at);const active=createSession(3,[],at,{settings:s.settings});s=finish({...s,active},true,at+180000);const before=structuredClone(s);const duplicate=finish({...s,active},true,at+300000);assert.deepEqual(duplicate.history,before.history);assert.deepEqual(duplicate.comeback,before.comeback);assert.strictEqual(awardComeback(s,s.history[0],at+day),s);assert.strictEqual(migrateComeback(s,at+day),s);assert.equal(comebackProgress(round(duplicate)).units,1);
});
test('old reliable full rewards migrate once; unknown partial estimates and previews stay uncredited',()=>{
 const s=freshState();s.history=[oldRecord(s,'old-full',true),oldRecord(s,'old-partial',false),{...oldRecord(s,'old-preview',true),mode:'preview'}];const next=migrateComeback(s,at+day);assert.equal(comebackProgress(next).units,1);assert.equal(next.comeback.entries.length,2);assert.equal(next.comeback.entries[0].actualMs,null);assert.equal(next.comeback.entries.find(e=>e.sessionId==='old-partial').basis,'unverified-legacy');assert.deepEqual(round(next),next);assert.deepEqual(next.history,s.history);
});
test('ledger and legacy restoration survive a later catalogue restriction without enabling future exercise',()=>{
 let s=past(2);s=purchaseProject(s,'workshop',null,at+2*day);s=migrateComeback(s,at+3*day);const units=comebackProgress(s).units,archive=structuredClone(s.comeback.legacy);const originals=['abdominal-bracing','pelvic-tilt','heel-slide'].map(id=>[exercise(id),exercise(id).selectable]);try{for(const [e]of originals)e.selectable=false;assert.equal(comebackProgress(s).units,units);assert.deepEqual(round(s).comeback.legacy,archive);assert.strictEqual(migrateComeback(s,at+5*day),s);const active=createSession(3,[],at+5*day,{settings:{enabledExercises:['reach']}});assert.ok(active.segments.every(b=>!['abdominal-bracing','pelvic-tilt','heel-slide'].includes(b.exerciseId)));}finally{for(const [e,value]of originals)e.selectable=value;}
});
test('milestone dates persist, including fractional crossings; absence and feedback never undo progress',()=>{
 let s=migrateComeback(past(7),at+8*day);const active=createSession(3,s.history,at+9*day,{settings:s.settings}),prep=active.segments[0].durationMs;s=finish({...s,active:freeze(active,at+9*day+prep+20000)},false,at+9*day+prep+20000);assert.equal(s.comeback.milestones.length,1);s=complete(s,at+10*day);const milestone=s.comeback.milestones.find(m=>m.threshold===8);assert.ok(milestone);assert.equal(milestone.unlockedAt,s.history.at(-1).endedAt);const before=structuredClone(s.comeback);s=setFeedback(s,s.history.at(-1).id,'discomfort',['knees'],at+11*day);assert.deepEqual(s.comeback,before);assert.deepEqual(migrateComeback(round(s),at+100*day).comeback,before);assert.ok(comebackProgress(s).units>8);
});
test('legacy archive freezes earned/unspent timber and world while later sessions add comeback progress',()=>{
 let s=past(3);s=purchaseProject(s,'workshop',null,at+3*day);s=purchaseProject(s,'banner','fern',at+3*day);s=migrateComeback(s,at+4*day);assert.equal(s.comeback.legacy.earnedTimberIds.length,3);assert.equal(s.comeback.legacy.unspentTimberIds.length,1);assert.equal(s.comeback.legacy.world.projects[0].choice,'fern');const old=structuredClone(s.comeback.legacy);s=complete(s,at+5*day);assert.equal(comebackProgress(s).units,4);assert.deepEqual(round(s).comeback.legacy,old);assert.deepEqual(s.world,old.world);
});
test('malformed ledger, orphaned/duplicate awards, altered evidence and invented milestones reject safely',()=>{
 const good=migrateComeback(past(1),at+day);for(const edit of [s=>s.comeback.version=2,s=>s.comeback.entries.push({...s.comeback.entries[0]}),s=>s.comeback.entries[0].sessionId='absent',s=>s.comeback.entries[0].units=2,s=>s.comeback.entries[0].actualMs=1,s=>s.comeback.entries[0].eligibleIds=['squat'],s=>s.comeback.entries[0].ruleVersion=2,s=>s.comeback.milestones.push({threshold:8,sessionId:good.history[0].id,unlockedAt:at}),s=>s.comeback.legacy.unspentTimberIds=[],s=>s.comeback.legacy.earnedTimberIds=[]]){const broken=structuredClone(good);edit(broken);assert.equal(validComeback(broken),false);assert.throws(()=>round(broken));}assert.deepEqual(round(good),good);
});
test('existing ledger can adopt missed genuine records once without replacing its archive or prior awards',()=>{
 let s=migrateComeback(past(1),at+day);const before=structuredClone(s.comeback);const second=complete(freshState(),at+2*day).history[0];s={...s,history:[...s.history,second]};assert.equal(validComeback(s),true);const synced=migrateComeback(s,at+3*day);assert.equal(comebackProgress(synced).units,2);assert.deepEqual(synced.comeback.entries[0],before.entries[0]);assert.deepEqual(synced.comeback.legacy,before.legacy);assert.strictEqual(migrateComeback(synced,at+4*day),synced);assert.deepEqual(round(synced),synced);
});
test('reordered JSON object keys remain valid and old backups do not acquire progress without migration',()=>{
 const old=freshState();assert.equal(round(old).comeback,undefined);const s=migrateComeback(old,at);s.comeback.milestones=s.comeback.milestones.map(m=>({sessionId:m.sessionId,unlockedAt:m.unlockedAt,threshold:m.threshold}));assert.deepEqual(round(s),s);
});

test('historical small-step classification is frozen, but a newly reclassified movement cannot resume as gentle work',()=>{
 const base=freshState();base.settings.enabledExercises=['heel-slide'];let s=migrateComeback(complete(base),at+day);s.active=freeze(createSession(3,[],at+2*day,{settings:s.settings}),at+2*day+40000);const e=exercise('heel-slide'),kind=e.loadKind,position=e.position;try{e.loadKind='strength';e.position='standing';assert.deepEqual(round(s).history,s.history);assert.equal(round(s).active.id,s.active.id);assert.equal(canResumeSession(s.active,s.history,at+3*day,s.settings),false);assert.equal(comebackProgress(round(s)).units,1);}finally{e.loadKind=kind;e.position=position;}
});

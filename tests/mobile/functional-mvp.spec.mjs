import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {freshState,createSession,elapsed} from '../../src/engine.mjs';
import {TEST_SETTINGS} from '../fixtures.mjs';
import {startWorkout,enableCandidates} from './helpers.mjs';
const read=page=>page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});const value=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});db.close();return value;});
async function put(page,state){await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;});db.close();},state);await page.reload();}
async function end(page){page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();await page.getByRole('button',{name:'Done',exact:true}).tap();}

test('grouped opt-ins and explicit discomfort reassessment persist offline and in JSON',async({page,context})=>{
  await page.goto('/');await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Start 10-minute session'}).tap();
  const review=page.getByRole('dialog');for(const name of ['Core & Strength','Cardio & Movement','Mobility & Recovery'])await expect(review.getByRole('heading',{name,exact:true})).toBeVisible();
  await expect(review.getByText('No candidate here has professional approval recorded.',{exact:false})).toBeVisible();
  for(const name of ['Wall push','Shallow squat'])await expect(review.getByRole('checkbox',{name:'Enable '+name,exact:true})).toBeDisabled();
  await enableCandidates(page);await review.getByRole('button',{name:'Flag Easy march as uncomfortable'}).tap();
  await expect(review.getByRole('checkbox',{name:'Enable Easy march'})).toBeDisabled();
  await review.getByRole('button',{name:'Go back'}).tap();await page.reload();
  await page.getByRole('button',{name:'Settings',exact:true}).tap();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).tap();const file=await download;const exported=JSON.parse(readFileSync(await file.path(),'utf8'));expect(exported.data.settings.exerciseHolds.march).toBeGreaterThan(0);
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Review or disable movements'}).tap();
  await expect(review.getByRole('button',{name:'Reassess Easy march'})).toBeVisible();
  page.once('dialog',d=>d.accept());await review.getByRole('button',{name:'Reassess Easy march'}).tap();
  const march=review.getByRole('checkbox',{name:'Enable Easy march'});await expect(march).toBeEnabled();await expect(march).not.toBeChecked();
  await march.check();await review.getByRole('button',{name:'Save choices'}).tap();
  await page.getByRole('button',{name:'Today',exact:true}).tap();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  await context.setOffline(false);await page.getByRole('button',{name:'Settings',exact:true}).tap();
  page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles({name:'fictional-eligibility.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
  await expect(page.getByText('Backup restored on this device.')).toBeVisible();expect((await read(page)).settings.exerciseHolds.march).toBe(exported.data.settings.exerciseHolds.march);
});

test('real ten-minute flow, afternoon and next-day requests adapt without repeating strength',async({page,context})=>{
  test.setTimeout(150000);const morning=new Date(2026,9,27,9).getTime();await page.clock.install({time:morning});await page.goto('/');
  await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Start 10-minute session'}).tap();await enableCandidates(page);await page.getByRole('button',{name:'Use enabled movements'}).tap();
  await expect(page.getByRole('heading',{name:'Preparation',exact:true})).toBeVisible();await page.clock.runFor(600500);
  await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();let state=await read(page);expect(state.history).toHaveLength(1);expect(state.history[0].completed).toBe(true);expect(state.history[0].activeMs).toBe(state.history[0].segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0));expect(state.history[0].qualityVersion).toBe(3);
  await page.getByRole('button',{name:'Comfortable',exact:true}).tap();await page.getByRole('button',{name:'Done',exact:true}).tap();
  await page.getByRole('button',{name:'Journal',exact:true}).tap();await expect(page.getByRole('region',{name:'Activity totals'})).toContainText('1 completed session');await expect(page.getByRole('region',{name:'Activity totals'})).toContainText('Strengthening: 1.5 min');
  await page.clock.setSystemTime(morning+6*3600000);await page.clock.runFor(300);await page.getByRole('button',{name:'Today',exact:true}).tap();await startWorkout(page,10);
  state=await read(page);expect(state.active.segments.filter(b=>b.kind==='work').every(b=>b.exerciseId!=='calf')).toBe(true);await end(page);
  await page.clock.setSystemTime(morning+25*3600000);await page.clock.runFor(300);await startWorkout(page,10);state=await read(page);expect(state.active.segments.filter(b=>b.kind==='work').every(b=>b.exerciseId!=='calf')).toBe(true);await end(page);
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Journal',exact:true}).tap();await expect(page.getByRole('region',{name:'Activity totals'})).toContainText('1 completed session');
  state=await read(page);expect(state.history).toHaveLength(3);expect(state.history.filter(h=>h.completed)).toHaveLength(1);await page.getByRole('button',{name:'Village',exact:true}).tap();await expect(page.getByText('1 timber',{exact:true})).toBeVisible();
});

test('late visibility event cannot count a suspended wall-clock gap as movement',async({page})=>{
  await page.clock.install();await page.goto('/');await startWorkout(page,10);await page.clock.runFor(10000);
  const before=await read(page);await page.clock.setSystemTime(Date.now()+3600000);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeEnabled();await end(page);
  const h=(await read(page)).history[0];expect(h.activeMs).toBeGreaterThanOrEqual(9750);expect(h.activeMs).toBeLessThanOrEqual(10250);expect(h.completed).toBe(false);expect(h.elapsedMs).toBeLessThanOrEqual(elapsed(before.active,before.active.checkpointAt)+1250);
});

test('visibility during delayed automatic completion cannot resurrect or duplicate a workout',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(window.__delayFinal&&value?.active===null&&value.history?.length)this.transaction.__finalWrite=true;return put.call(this,value,...args);};const descriptor=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...descriptor,set(handler){descriptor.set.call(this,function(e){if(this.__finalWrite)setTimeout(()=>handler.call(this,e),2500);else handler.call(this,e);});}});});
  await page.clock.install();await page.goto('/');await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeVisible();const at=Date.now();let state=freshState();state.settings={...state.settings,...TEST_SETTINGS};state.active=createSession(10,[],at-599000,{settings:state.settings});state.active.elapsedMs=599000;state.active.runningSince=at;state.active.checkpointAt=at;await put(page,state);
  await page.getByRole('button',{name:'Resume',exact:true}).tap();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();await page.evaluate(()=>{window.__delayFinal=true;});await page.clock.runFor(1200);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.clock.runFor(3000);
  await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();await page.reload();const saved=await read(page);expect(saved.active).toBe(null);expect(saved.history).toHaveLength(1);expect(saved.history[0].completed).toBe(true);
});
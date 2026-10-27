import { testSession as createSession, TEST_SETTINGS } from '../fixtures.mjs';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { freshState, finish } from '../../src/engine.mjs';
import { startWorkout } from './helpers.mjs';
async function seed(page, count=1) {
  await page.goto('/');await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  let state=freshState();state.settings={...state.settings,...TEST_SETTINGS};
  for(let i=0;i<count;i++){const at=Date.now()-2*86400_000+i*600_000;state.active=createSession(7,[],at);state=finish(state,true,at+420_000);}
  await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;});db.close();},state);
  await page.reload();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
}
async function village(page){await page.getByRole('button',{name:'Village',exact:true}).tap();const map=page.locator('.village-canvas[data-ready=true]');await expect(map).toBeVisible();return map;}
async function mapTap(page,x,y){const b=await page.locator('.village-canvas canvas').boundingBox();await page.touchscreen.tap(b.x+x*b.width/320,b.y+y*b.height/288);}
test('unreviewed exercises require explicit review; a cancelled review earns nothing',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Start 10-minute session'}).tap();
  const review=page.getByRole('dialog',{name:'Review this unreviewed routine'});await expect(review).toBeVisible();
  await expect(review).toContainText('Nothing is enabled automatically');
  await expect(page.getByRole('timer')).toHaveCount(0);
  await review.getByRole('button',{name:'Go back'}).tap();
  const map=await village(page);await page.getByRole('button',{name:'Workshop',exact:true}).tap();
  await expect(map).toHaveAttribute('data-interaction','arrived');await expect(page.getByRole('button',{name:'Need 1 timber'})).toBeDisabled();
});
test('touch movement animates, respects boundaries, and approaches before enabling interaction',async({page})=>{
  await seed(page,3);const map=await village(page);
  await mapTap(page,168,120);await expect(map).toHaveAttribute('data-motion','walking');
  await expect(map).toHaveAttribute('data-animation-frame',/walk-a|walk-b/);
  await expect(map).toHaveAttribute('data-motion','idle');await expect(map).toHaveAttribute('data-player-y','120');
  await mapTap(page,312,255);await expect(map).toHaveAttribute('data-move-result','blocked');await expect(map).toHaveAttribute('data-player-y','120');
  await mapTap(page,250,100);await expect(map).toHaveAttribute('data-interaction','approaching');
  await expect(page.getByRole('button',{name:'Restore workshop · 1 timber'})).toBeDisabled();
  await expect(map).toHaveAttribute('data-interaction','arrived');await expect(map).toHaveAttribute('data-player-x','232');await expect(map).toHaveAttribute('data-player-y','168');
  await expect(page.getByRole('button',{name:'Restore workshop · 1 timber'})).toBeEnabled();
  await expect(map).toHaveAttribute('data-avatar-stage','adventurer');
  await page.getByRole('button',{name:'Close workshop'}).tap();
  await page.getByRole('button',{name:'Garden',exact:true}).tap();await expect(map).toHaveAttribute('data-interaction','arrived');await expect(map).toHaveAttribute('data-player-x','152');
});
test('full timed workout earns once, workshop spends it, construction and offline reload persist',async({page,context})=>{
  await page.clock.install();await page.goto('/');await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'7 MIN',exact:true}).tap();await startWorkout(page,7);
  await page.getByRole('button',{name:'Mute sound'}).tap();
  await page.clock.runFor(420_500);
  await expect(page.getByText('Session complete. 1 timber earned. Visit the workshop when ready.')).toBeVisible();
  const map=await village(page);await expect(map).toHaveAttribute('data-building-stage','original');
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();await page.clock.runFor(2200);
  await page.getByRole('button',{name:'Restore workshop · 1 timber'}).tap();
  await expect(page.getByText('Workshop restored. A warm roof', {exact:false})).toBeVisible();
  await page.clock.runFor(1000);await expect(map).toHaveAttribute('data-building-stage','restored');
  await expect(page.getByText('0 timber available',{exact:true})).toBeVisible();
  await context.setOffline(true);await page.reload();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  const reopened=await village(page);await expect(reopened).toHaveAttribute('data-building-stage','restored');
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();await page.clock.runFor(2200);
  await expect(page.getByRole('button',{name:'Restore workshop · 1 timber'})).toHaveCount(0);
  await page.getByRole('button',{name:'Today',exact:true}).tap();await expect(page.getByText('1 little strides',{exact:true})).toBeVisible();
});
test('failed restoration write neither spends timber nor changes the workshop',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(window.__failRestore&&value.world?.workshop?.stage===1)throw new DOMException('Full','QuotaExceededError');return put.call(this,value,...args);};});
  await seed(page);const map=await village(page);await page.getByRole('button',{name:'Workshop',exact:true}).tap();
  await page.evaluate(()=>{window.__failRestore=true;});await page.getByRole('button',{name:'Restore workshop · 1 timber'}).tap();
  await expect(page.getByRole('alert')).toContainText('Local saving failed');await expect(map).toHaveAttribute('data-building-stage','original');
  await expect(page.getByText('1 timber available',{exact:true})).toBeVisible();
  await page.evaluate(()=>{window.__failRestore=false;});await page.getByRole('button',{name:'Retry saving',exact:true}).tap();
  await page.getByRole('button',{name:'Restore workshop · 1 timber'}).tap();await expect(map).toHaveAttribute('data-building-stage','restored');
});
test('offline failure has an actionable error and retry reaches verified cache readiness',async({page})=>{
  await page.addInitScript(()=>{window.__failOffline=true;const register=navigator.serviceWorker.register.bind(navigator.serviceWorker);navigator.serviceWorker.register=(...args)=>window.__failOffline?Promise.reject(new Error('storage unavailable')):register(...args);});
  await page.goto('/');await expect(page.getByText('Offline unavailable',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry offline setup'})).toBeVisible();
  await page.evaluate(()=>{window.__failOffline=false;});await page.getByRole('button',{name:'Retry offline setup'}).tap();
  await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  const marker=await page.evaluate(async()=>{for(const key of await caches.keys()){const c=await caches.open(key),r=await c.match(new URL('./__offline-ready__',location.href).href);if(r)return r.json();}});
  expect(marker.assetCount).toBeGreaterThan(20);expect(marker.buildId).toMatch(/^[a-f0-9]{12}$/);
});
test('a stalled offline installation times out instead of preparing forever',async({page})=>{
  await page.addInitScript(()=>{navigator.serviceWorker.register=()=>new Promise(()=>{});});await page.clock.install();
  await page.goto('/');await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  await page.clock.runFor(21_000);await expect(page.getByText('Offline unavailable',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry offline setup'})).toBeVisible();
});
test('a failed asset precache never reports offline ready',async({page,context})=>{
  const worker=readFileSync('dist/sw.js','utf8').replace('await cache.addAll(ASSETS);',"await Promise.reject(new Error('simulated asset-cache failure'));");
  await context.route('**/sw.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:worker}));
  await page.goto('/');await expect(page.getByText('Offline unavailable',{exact:true})).toBeVisible({timeout:25000});
  await expect(page.getByText('Offline ready',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Retry offline setup'})).toBeVisible();
});
test('preview-only completion earns no timber and does not schedule recovery',async({page})=>{
  await page.clock.install();await seed(page,0);
  const state=freshState();state.settings={...state.settings,...TEST_SETTINGS};
  const at=Date.now()-500_000;state.active=createSession(7,[],at,{mode:'preview'});
  state.active={...state.active,status:'paused',runningSince:null,elapsedMs:419_000,checkpointAt:at+419_000,reason:'paused'};
  await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;});db.close();},state);
  await page.reload();await expect(page.getByText('PREVIEW · NO REWARDS',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Resume',exact:true}).tap();await page.clock.runFor(1500);
  await expect(page.getByText('Session saved. No restoration reward earned.')).toBeVisible();
  const map=await village(page);await expect(map).toHaveAttribute('data-building-stage','original');
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();await page.clock.runFor(2200);
  await expect(page.getByRole('button',{name:'Need 1 timber'})).toBeDisabled();
  await page.getByRole('button',{name:'Journal',exact:true}).tap();await expect(page.getByText('Preview',{exact:true})).toBeVisible();
  await expect(page.getByText('Your next session includes a gentle mix of moves.',{exact:true})).toBeVisible();
});
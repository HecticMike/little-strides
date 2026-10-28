import {test,expect} from '@playwright/test';
import {createPreviewSession} from '../../src/engine.mjs';
const ids=['abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge'];
const names=['Supine abdominal bracing','Supine pelvic tilts','Supine heel slides','Glute bridge'];
const read=page=>page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});const value=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});db.close();return value;});
async function review(page){await page.getByRole('button',{name:'Review or disable movements'}).tap();await page.getByLabel('Routine focus',{exact:true}).selectOption('core');}

test('individually opted-in core session has honest illustrative art, self pacing and durable history',async({page,context})=>{
  test.setTimeout(120000);await page.clock.install();await page.goto('/');await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();await review(page);
  for(const n of names){const box=page.getByRole('checkbox',{name:'Enable '+n,exact:true});await expect(box).not.toBeChecked();await box.check();}
  await expect(page.getByRole('checkbox',{name:'Enable Modified dead bug',exact:true})).toBeDisabled();
  const article=page.getByRole('checkbox',{name:'Enable Supine heel slides',exact:true}).locator('xpath=ancestor::article');await article.getByText('Purpose, loading and artwork',{exact:true}).tap();await expect(article.getByRole('link')).toHaveAttribute('href',/nhs/);
  await page.getByRole('button',{name:'Save choices',exact:true}).tap();await page.getByRole('button',{name:'7 MIN',exact:true}).tap();await page.getByRole('button',{name:'Start 7-minute session',exact:true}).tap();
  const original=(await read(page)).active,setup=original.segments[0].durationMs,activity=original.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0);await page.clock.runFor(setup+100);await expect(page.getByRole('heading',{name:'Supine abdominal bracing',exact:true})).toBeVisible();await expect(page.locator('.core-illustration[data-ready=true]')).toHaveAttribute('data-exercise-id','abdominal-bracing');await expect(page.getByText('SELF-PACED · NO REP TARGET',{exact:true})).toBeVisible();await expect(page.locator('.pose-note')).toContainText('not a validated demonstration');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const active=(await read(page)).active;expect(active.segments.filter(b=>b.kind==='work').every(b=>ids.includes(b.exerciseId))).toBe(true);
  await page.clock.runFor(420000-setup+500);await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();let state=await read(page);expect(state.history[0].completed).toBe(true);expect(state.history[0].groups).toEqual(['core']);expect(state.history[0].activeMs).toBe(activity);expect(state.history[0].movements.every(m=>m.repetitions===null)).toBe(true);
  await page.getByRole('button',{name:'Done',exact:true}).tap();await context.setOffline(true);await page.reload();state=await read(page);expect(state.history).toHaveLength(1);expect(state.settings.sessionFocus).toBe('core');
});

test('workflow preview needs no opt-ins and never persists exercise, recovery or rewards',async({page})=>{
  await page.clock.install();await page.goto('/');await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));await page.getByRole('button',{name:'7 MIN',exact:true}).tap();await page.getByRole('button',{name:/^Preview workflow/}).tap();await expect(page.getByText('PREVIEW · NO REWARDS',{exact:true})).toBeVisible();
  expect((await read(page)).active).toBe(null);expect((await read(page)).settings.enabledExercises).toEqual([]);await page.clock.runFor(30100);
  await expect(page.getByRole('heading',{name:'Sample timer card',exact:true})).toBeVisible();await page.getByRole('button',{name:'Replace',exact:true}).tap();await expect(page.getByRole('heading',{name:'Alternative timer card',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pause',exact:true}).tap();await page.getByRole('button',{name:'Resume',exact:true}).tap();
  for(let i=0;i<createPreviewSession(7).segments.length-1;i++){const skip=page.getByRole('button',{name:'Skip',exact:true});await expect(skip).toBeEnabled();await skip.tap();await page.clock.runFor(300);}
  await expect(page.getByText('Workflow preview finished. No exercise recorded or rewards granted.',{exact:false})).toBeVisible();let state=await read(page);expect(state.active).toBe(null);expect(state.history).toEqual([]);expect(state.world.workshop.spentRewardIds).toEqual([]);
  await page.getByRole('button',{name:/^Preview workflow/}).tap();await page.reload();await expect(page.getByRole('button',{name:'Start 7-minute session'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeVisible();state=await read(page);expect(state.active).toBe(null);expect(state.history).toEqual([]);
});

test('incomplete core pool and rolling caps offer shorter supported lengths without unlocking dead bug',async({page})=>{
  await page.goto('/');await review(page);await page.getByRole('checkbox',{name:'Enable Glute bridge',exact:true}).check();await page.getByRole('button',{name:'Save choices',exact:true}).tap();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeDisabled();
  await review(page);for(const n of names.slice(0,3))await page.getByRole('checkbox',{name:'Enable '+n,exact:true}).check();await page.getByRole('button',{name:'Save choices',exact:true}).tap();
  await page.getByRole('button',{name:'20 MIN',exact:true}).tap();await expect(page.getByRole('button',{name:'Start 20-minute session'})).toBeDisabled();await expect(page.getByRole('button',{name:'Use 10 minutes',exact:true})).toBeVisible();await page.getByRole('button',{name:'Use 10 minutes',exact:true}).tap();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  const state=await read(page);expect(state.settings.enabledExercises).not.toContain('modified-dead-bug');expect(state.settings.recovery).toBeUndefined();
});
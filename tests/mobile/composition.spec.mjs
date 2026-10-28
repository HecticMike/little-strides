import {test,expect} from '@playwright/test';
const names=['Easy march','Calf raise','Gentle reach','Supine abdominal bracing','Supine pelvic tilts','Supine heel slides','Glute bridge'];
const read=page=>page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});const value=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});db.close();return value;});
async function enable(page){await page.getByRole('button',{name:'Review or disable movements'}).tap();for(const name of names)await page.getByRole('checkbox',{name:'Enable '+name,exact:true}).check();await page.getByRole('button',{name:'Save choices',exact:true}).tap();}
test('balanced preview and real ten-minute variable flow persist exact activity, sounds and one reward offline',async({page,context},info)=>{
  test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-28T09:00:00Z')});await page.clock.pauseAt(new Date('2026-10-28T09:00:01Z'));await page.goto('/');await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Session focus',{exact:true})).toHaveValue('balanced');await enable(page);
  const start=page.getByRole('button',{name:'Start 10-minute session',exact:true});await expect(start).toBeInViewport();
  await page.screenshot({path:info.outputPath('today.png')});await page.getByText('View balanced session',{exact:false}).tap();await expect(page.locator('.session-preview')).toContainText('active preparation');await expect(page.locator('.session-preview')).toContainText('180s');
  await page.screenshot({path:info.outputPath('today-preview.png')});await start.tap();await expect(page.getByRole('heading',{name:'Preparation',exact:true})).toBeVisible();
  let stored=await read(page),plan=stored.active.segments;expect(stored.active.compositionVersion).toBe(1);expect(plan.reduce((n,b)=>n+b.durationMs,0)).toBe(600000);
  const expectedActivity=plan.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0);let elapsed=0,shot=false;
  for(const b of plan){
    if(b.kind==='work'){if(b.exerciseId==='march'){await expect(page.locator('.exercise-art .avatar')).toHaveCount(1);}else if(['abdominal-bracing','heel-slide','glute-bridge'].includes(b.exerciseId)){await expect(page.locator('.core-illustration[data-ready=true]')).toHaveAttribute('data-exercise-id',b.exerciseId);}}
    if(b.kind==='rest')await expect(page.locator('.reps')).toContainText(String(b.durationMs/1000));
    if(!shot&&b.kind==='work'){
      await page.getByRole('button',{name:'Mute sound',exact:true}).tap();await page.getByRole('button',{name:'Pause',exact:true}).tap();const before=(await read(page)).active.elapsedMs;
      await page.clock.runFor(60000);expect((await read(page)).active.elapsedMs).toBe(before);await page.getByRole('button',{name:'Resume',exact:true}).tap();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const name of ['Pause','Skip','Replace'])await expect(page.getByRole('button',{name,exact:true})).toBeInViewport();
      await page.screenshot({path:info.outputPath('active-workout.png')});shot=true;
    }
    await page.clock.runFor(b.durationMs);elapsed+=b.durationMs;
  }
  await page.clock.runFor(500);await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();stored=await read(page);expect(stored.history).toHaveLength(1);expect(stored.history[0].completed).toBe(true);expect(stored.history[0].activeMs).toBe(expectedActivity);expect(stored.history[0].movements.every(m=>m.repetitions===null)).toBe(true);expect(stored.settings.muted).toBe(true);
  await page.getByRole('button',{name:'Comfortable',exact:true}).tap();await page.getByRole('button',{name:'Done',exact:true}).tap();
  await context.setOffline(true);await page.reload();stored=await read(page);expect(stored.history).toHaveLength(1);expect(stored.history[0].feedback.comfort).toBe('comfortable');await page.getByRole('button',{name:'Village',exact:true}).tap();await expect(page.getByText('1 timber',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('focus limitations, alternative labels and interrupted variable sessions stay truthful',async({page})=>{
  await page.clock.install();await page.goto('/');await enable(page);await page.getByLabel('Session focus',{exact:true}).selectOption('core');await page.getByRole('button',{name:'20 MIN',exact:true}).tap();await expect(page.getByRole('button',{name:'Start 20-minute session'})).toBeDisabled();await expect(page.getByRole('button',{name:'Use 10 minutes',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Use 10 minutes',exact:true}).tap();await page.getByLabel('Session focus',{exact:true}).selectOption('recovery');await page.getByRole('button',{name:'Start 10-minute session'}).tap();let state=await read(page);expect(state.active.segments.filter(b=>b.kind==='work').every(b=>!['calf','glute-bridge','march'].includes(b.exerciseId))).toBe(true);
  await page.clock.runFor(state.active.segments[0].durationMs+10000);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();const before=(await read(page)).active.elapsedMs;await page.clock.fastForward(3600000);await page.reload();expect((await read(page)).active.elapsedMs).toBe(before);await page.getByRole('button',{name:'Resume',exact:true}).tap();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();state=await read(page);expect(state.history[0].completed).toBe(false);expect(state.history[0].activeMs).toBeLessThan(12000);expect(state.settings.enabledExercises).not.toContain('modified-dead-bug');
  await page.getByRole('button',{name:'Done',exact:true}).tap();await page.getByRole('button',{name:'Review or disable movements'}).tap();await page.getByRole('checkbox',{name:'Enable Easy march',exact:true}).uncheck();await page.getByRole('button',{name:'Save choices',exact:true}).tap();await page.getByLabel('Session focus',{exact:true}).selectOption('cardio');await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeDisabled();await expect(page.getByText(/No eligible aerobic movement remains/)).toBeVisible();await page.getByRole('button',{name:'Consider balanced focus',exact:true}).tap();await expect(page.getByLabel('Session focus',{exact:true})).toHaveValue('balanced');
});

test('cardio focus previews sustained blocks with honest pacing and recorded focus',async({page},info)=>{
  await page.clock.install();await page.goto('/');await enable(page);await page.getByLabel('Session focus',{exact:true}).selectOption('cardio');await page.getByText('View cardio-focused session',{exact:false}).tap();await expect(page.locator('.session-preview')).toContainText('180s');await page.getByRole('button',{name:'Start 10-minute session',exact:true}).tap();const s=(await read(page)).active;expect(s.focus).toBe('cardio');expect(s.segments.filter(b=>b.exerciseId==='march').reduce((n,b)=>n+b.durationMs,0)).toBeGreaterThanOrEqual(360000);await page.clock.runFor(s.segments[0].durationMs+3100);await expect(page.locator('.reps')).toContainText('PACE 2 / 20');await page.screenshot({path:info.outputPath('cardio-marching.png')});
});

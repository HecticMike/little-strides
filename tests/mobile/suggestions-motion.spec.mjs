import{test,expect}from'@playwright/test';
const base=process.env.PAGES_TEST_PATH||'/';
const read=page=>page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});const s=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});db.close();return s;});

test('first launch starts a preselected routine directly and supports a planned core swap',async({page},info)=>{
 await page.clock.install();await page.goto(base);await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Start 10-minute session',exact:true})).toBeEnabled();
 const state=await read(page);expect(state.settings.selectionMode).toBe('suggested');expect(state.settings.enabledExercises).toContain('abdominal-bracing');expect(state.settings.enabledExercises).not.toContain('squat');await page.screenshot({path:info.outputPath('today-preselected.png')});
 await page.locator('.session-preview summary').tap();await page.getByRole('button',{name:'Replace planned Supine abdominal bracing at block 1',exact:true}).tap();const picker=page.getByRole('dialog');await expect(picker).toContainText('Core activation');await picker.getByRole('button',{name:'Use Supine heel slides',exact:true}).tap();
 await page.screenshot({path:info.outputPath('suggested-routine.png')});await page.getByRole('button',{name:'Start 10-minute session',exact:true}).tap();await expect(page.locator('.workout')).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
 const session=(await read(page)).active;expect(session.plan[1].exerciseId).toBe('heel-slide');await page.clock.runFor(session.segments[0].durationMs+1000);await expect(page.locator('.core-illustration[data-ready=true]')).toHaveAttribute('data-exercise-id','heel-slide');await page.screenshot({path:info.outputPath('heel-slide-enhanced.png')});
});

test('live replacement pauses selection time and resumes an equivalent core movement without invented activity',async({page},info)=>{
 await page.clock.install();await page.goto(base);await page.getByRole('button',{name:/A smaller step/}).tap();await expect(page.locator('.workout')).toBeVisible();await page.clock.runFor(35000);
 await page.getByRole('button',{name:'Replace',exact:true}).tap();const picker=page.getByRole('dialog');await expect(picker).toBeVisible();const paused=(await read(page)).active.elapsedMs;await page.clock.fastForward(50000);expect((await read(page)).active.elapsedMs).toBe(paused);
 await page.screenshot({path:info.outputPath('equivalent-replacements.png')});await picker.getByRole('button',{name:'Use Supine heel slides',exact:true}).tap();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();await expect(page.locator('.core-illustration')).toHaveAttribute('data-exercise-id','heel-slide');
 await page.clock.runFor(181000-paused);await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();const h=(await read(page)).history[0];expect(h.completed).toBe(true);expect(h.elapsedMs).toBe(180000);expect(h.activeMs).toBe(105000);expect(h.movements.filter(m=>m.actualMs>0).every(m=>m.exerciseId!=='march')).toBe(true);
});

test('cardio has an honest no-alternative state and exclusions survive reload',async({page})=>{
 await page.clock.install();await page.goto(base);await page.getByRole('combobox',{name:'Session focus',exact:true}).selectOption('cardio');await page.getByRole('button',{name:'Start 10-minute session',exact:true}).tap();await expect(page.locator('.workout')).toBeVisible();const setup=(await read(page)).active.segments[0].durationMs;await page.clock.runFor(setup+1000);
 await page.getByRole('button',{name:'Replace',exact:true}).tap();await expect(page.getByRole('dialog')).toContainText('only aerobic candidate');await expect(page.getByRole('button',{name:/Use Gentle reach/})).toHaveCount(0);await page.getByRole('button',{name:'Cancel · stay paused',exact:true}).tap();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();await page.getByRole('button',{name:'Done',exact:true}).tap();await page.getByRole('button',{name:'Review or disable movements',exact:true}).tap();await page.getByRole('checkbox',{name:'Enable Supine heel slides',exact:true}).uncheck();await page.getByRole('button',{name:'Save choices',exact:true}).tap();await page.reload();expect((await read(page)).settings.enabledExercises).not.toContain('heel-slide');await page.getByRole('button',{name:'Settings',exact:true}).tap();await page.getByRole('button',{name:'Use suggested selection',exact:true}).tap();await expect.poll(async()=>(await read(page)).settings.selectionMode).toBe('suggested');expect((await read(page)).settings.enabledExercises).toContain('heel-slide');
});

test('walk is visible while moving, with registered face/torso, opposing hands and stable contact',async({page},info)=>{
 await page.clock.install();await page.goto(base);const report=await page.evaluate(async()=>{
  const i=new Image();i.src='./art/hero-body.png';await i.decode();const c=document.createElement('canvas');c.width=960;c.height=128;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const d=ctx.getImageData(0,0,960,128).data;const at=(col,x,y)=>(y*960+col*96+x)*4;let head=0,torso=0,hands=0,legs=0;
  for(const col of [7,8])for(let y=0;y<128;y++)for(let x=0;x<96;x++){const a=at(0,x,y),b=at(col,x,y),diff=d.slice(a,a+4).some((v,j)=>v!==d[b+j]);if(!diff)continue;if(y<42)head++;if(y>=44&&y<=70&&x>=45&&x<=60&&d[a+3])torso++;if(y>=55&&y<=84&&(x<42||x>64))hands++;if(y>=90)legs++;}
  const feet=[7,8].map(col=>{for(let y=127;y>=0;y--)for(let x=0;x<96;x++)if(d[at(col,x,y)+3])return y;});return{head,torso,hands,legs,feet};
 });expect(report.head).toBe(0);expect(report.torso).toBe(0);expect(report.hands).toBeGreaterThan(40);expect(report.legs).toBeGreaterThan(100);expect(report.feet).toEqual([119,119]);
 await page.getByRole('button',{name:'Village',exact:true}).tap();const map=page.locator('.village-canvas[data-ready=true]');await expect(map).toBeVisible();await page.clock.runFor(100);const b=await page.locator('.village-canvas canvas').boundingBox();await page.touchscreen.tap(b.x+b.width*168/320,b.y+b.height*120/288);
 await expect(map).toHaveAttribute('data-motion','walking');const frames=new Set();for(let i=0;i<5;i++){await page.clock.runFor(140);frames.add(await map.getAttribute('data-animation-frame'));await page.screenshot({path:info.outputPath('walk-'+i+'.png')});}expect(frames.has('walk-a')).toBe(true);expect(frames.has('walk-b')).toBe(true);await page.clock.runFor(1000);await expect(map).toHaveAttribute('data-motion','idle');
});


test('opening replacements freezes synchronously even when checkpoint acknowledgement is delayed',async({page})=>{
 await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(window.__delayPause&&value?.active?.status==='paused')this.transaction.__pauseWrite=true;return put.call(this,value,...args);};const descriptor=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...descriptor,set(handler){descriptor.set.call(this,function(e){if(this.__pauseWrite)setTimeout(()=>handler.call(this,e),5000);else handler.call(this,e);});}});});
 await page.clock.install();await page.goto(base);await page.getByRole('button',{name:/A smaller step/}).tap();await page.clock.runFor(35000);await page.evaluate(()=>window.__delayPause=true);
 await page.getByRole('button',{name:'Replace',exact:true}).tap();await page.clock.runFor(5500);await expect(page.getByRole('dialog')).toBeVisible();let s=await read(page);expect(s.active.status).toBe('paused');expect(s.active.elapsedMs).toBeLessThanOrEqual(35250);
 await page.evaluate(()=>window.__delayPause=false);await page.getByRole('button',{name:'Cancel · stay paused',exact:true}).tap();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();s=await read(page);expect(s.history[0].activeMs).toBeLessThanOrEqual(5250);expect(s.history[0].completed).toBe(false);
});

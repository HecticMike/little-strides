import {test,expect} from '@playwright/test';
import {freshState,createSession,finish} from '../../src/engine.mjs';
import {PROJECTS,chapterState} from '../../src/gameplay.mjs';
const base=process.env.PAGES_TEST_PATH||'/';
const read=page=>page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const s=await new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('current');r.onsuccess=()=>resolve(r.result);});db.close();return s;});
async function seed(page,count=12){await page.goto(base);await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeVisible();let s=freshState();s.settings.enabledExercises=['reach'];const t=Date.now()-count*86400000;for(let i=0;i<count;i++){s.active=createSession(3,s.history,t+i*86400000,{settings:s.settings});s=finish(s,true,t+i*86400000+180000);}await page.evaluate(async s=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(s,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();},s);await page.reload();return s;}

test('premium Today starts a genuine small step and awards one timber only after completion',async({page},info)=>{
 await page.clock.install();await page.goto(base);await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
 await expect(page.locator('.home-scene .world-window[data-ready=true]')).toBeVisible();
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/assets\/village-/.test(r.name)))).toBe(false);
 const start=page.getByRole('button',{name:'Start 10-minute session'}),small=page.getByRole('button',{name:/A smaller step/});
 for(const button of [start,small]){const b=await button.boundingBox(),nav=await page.locator('.bottom-nav').boundingBox();expect(b.y+b.height).toBeLessThanOrEqual(nav.y);expect(b.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:info.outputPath('today-premium.png')});await page.getByRole('button',{name:'Review or disable movements'}).tap();const review=page.getByRole('dialog');for(const input of await review.getByRole('checkbox').all()){await expect(page.getByRole('button',{name:'Save choices',exact:true})).toBeEnabled();if(!['Enable Wall push','Enable Shallow squat','Enable Modified dead bug'].includes(await input.getAttribute('aria-label')))await input.setChecked((await input.getAttribute('aria-label'))==='Enable Gentle reach');}await review.getByRole('button',{name:'Save choices'}).tap();await small.tap();
 await expect(page.locator('.workout')).toBeVisible();expect((await read(page)).active.minutes).toBe(3);
 await page.clock.runFor(35000);await page.screenshot({path:info.outputPath('workout-small-step.png')});await expect(page.getByRole('heading',{name:'Gentle reach',exact:true})).toBeVisible();
 expect((await read(page)).history).toHaveLength(0);await page.clock.runFor(146000);
 await expect(page.getByRole('region',{name:'Session completion'})).toBeVisible();const s=await read(page);expect(s.history).toHaveLength(1);expect(s.history[0].completed).toBe(true);expect(chapterState(s).balance).toBe(1);
 await page.getByText('Use timber or preview your next project',{exact:true}).tap();
 const project=page.getByRole('region',{name:'Session completion'}).getByRole('complementary',{name:'Current village project'});
 await project.getByRole('button',{name:'Restore the workshop · 1 timber',exact:true}).tap();await expect(project).toHaveAttribute('data-project','banner');expect(chapterState(await read(page)).balance).toBe(0);
 await page.getByRole('button',{name:'Done',exact:true}).tap();await page.reload();expect((await read(page)).history).toHaveLength(1);expect(chapterState(await read(page)).completed).toBe(1);
});

test('all six project artworks, choices and discoveries survive offline and JSON roundtrip',async({page,context},info)=>{
 await seed(page);await page.getByRole('button',{name:'Village',exact:true}).tap();const map=page.locator('.village-canvas[data-ready=true]');await expect(map).toBeVisible();await page.screenshot({path:info.outputPath('village-before.png')});
 for(const spec of PROJECTS){const card=page.getByRole('complementary',{name:'Current village project'});await expect(card).toHaveAttribute('data-project',spec.id);
  if(spec.id==='banner')await card.getByRole('button',{name:'Star crest',exact:true}).tap();
  if(spec.id==='garden')await card.getByRole('button',{name:'Woodland ferns',exact:true}).tap();
  await card.getByRole('button',{name:spec.name+' · '+spec.cost+' timber',exact:true}).tap();
  await expect.poll(async()=>chapterState(await read(page)).completed).toBe(PROJECTS.indexOf(spec)+1);
 }
 await expect(map).toHaveAttribute('data-chapter-projects','5');await expect(map).toHaveAttribute('data-banner','star');await expect(map).toHaveAttribute('data-garden-style','ferns');expect(chapterState(await read(page)).balance).toBe(0);
 await map.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('village-after.png')});
 await page.getByRole('button',{name:/Beyond the gate.*Open letter/}).tap();await page.getByRole('button',{name:'Old watchtower',exact:true}).tap();await expect(page.getByText('Keepsake: a brass watchtower token.',{exact:false})).toBeVisible();await page.screenshot({path:info.outputPath('discovery-watchtower.png')});await page.getByRole('button',{name:'Keep this memory',exact:true}).tap();
 await page.getByRole('button',{name:'Settings',exact:true}).tap();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).tap();const file=await download;page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles(await file.path());await expect(page.getByRole('status').filter({hasText:'Backup restored'})).toBeVisible();
 await context.setOffline(true);await page.reload();await expect(page.getByText('Offline',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Village',exact:true}).tap();await expect(page.locator('.village-canvas[data-ready=true]')).toHaveAttribute('data-chapter-projects','5');expect((await read(page)).world.discovery.destination).toBe('watchtower');
 await page.getByRole('button',{name:'Journal',exact:true}).tap();await expect(page.getByRole('region',{name:'Hearthwood memories'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('interrupted and early-ended small steps retain actual work, give no timber and keep the village available',async({page})=>{
 await page.clock.install();await seed(page,0);await page.getByRole('button',{name:/A smaller step/}).tap();await page.clock.runFor(35000);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(async()=>(await read(page)).active.status).toBe('paused');await page.clock.fastForward(600000);await page.reload();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();const s=await read(page);expect(s.history[0].activeMs).toBeLessThanOrEqual(5000);expect(chapterState(s).balance).toBe(0);await expect(page.getByText('Your village progress is unchanged.',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Done',exact:true}).tap();await page.getByRole('button',{name:'Village',exact:true}).tap();await expect(page.locator('.village-canvas[data-ready=true]')).toBeVisible();
});


test('both crest choices change the actual painted banner without altering the surrounding wall',async({page})=>{
 await page.goto(base);const differences=await page.evaluate(async()=>{
  const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  const [original,patch]=await Promise.all(['./art/buildings.png','./art/chapter-banner.png'].map(load));
  const c=document.createElement('canvas');c.width=60;c.height=64;const ctx=c.getContext('2d');ctx.drawImage(original,750,126,60,64,0,0,60,64);const before=ctx.getImageData(0,0,60,64).data;
  return [0,1].map(frame=>{ctx.clearRect(0,0,60,64);ctx.drawImage(patch,frame*60,0,60,64,0,0,60,64);const after=ctx.getImageData(0,0,60,64).data;let changed=0,outside=0;for(let y=0;y<64;y++)for(let x=0;x<60;x++){const at=(y*60+x)*4;if(before.slice(at,at+4).some((v,j)=>v!==after[at+j])){changed++;if(x<14||x>39||y<9||y>51)outside++;}}return {changed,outside};});
 });
 for(const d of differences){expect(d.changed).toBeGreaterThan(20);expect(d.outside).toBe(0);}
});

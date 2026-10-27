import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {startWorkout} from './helpers.mjs';
const directory='screenshots/refinement';
const shot=(page,info,name)=>{mkdirSync(directory,{recursive:true});return page.screenshot({path:`${directory}/${info.project.name}-${name}.png`});};

test('Today fits short portrait viewports and navigation resets the previous scroll position',async({page},info)=>{
  await page.goto('/');
  for(const [width,height] of [[375,568],[375,667],[393,727]]){
    await page.setViewportSize({width,height});
    const start=page.getByRole('button',{name:'Start 10-minute session'});
    await expect(start).toBeEnabled();
    await expect(page.getByRole('button',{name:'10 MIN',exact:true})).toHaveAttribute('aria-pressed','true');
    const button=await start.boundingBox(),nav=await page.getByRole('navigation').boundingBox();
    expect(button.y+button.height).toBeLessThanOrEqual(nav.y);
    expect(await page.locator('.page').evaluate(e=>e.scrollTop)).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.home-scene .avatar[data-ready=true]')).toBeVisible();
    await shot(page,info,'today-'+width+'x'+height);
  }
  await page.getByRole('button',{name:'15 MIN',exact:true}).tap();
  await page.getByRole('button',{name:'Village',exact:true}).tap();
  await expect(page.locator('.village-canvas[data-ready=true]')).toBeVisible();
  await page.locator('.page').evaluate(e=>{e.scrollTop=e.scrollHeight;});
  expect(await page.locator('.page').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Today',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'Your next stride'})).toBeVisible();
  expect(await page.locator('.page').evaluate(e=>e.scrollTop)).toBe(0);
  const header=await page.locator('.app-header').boundingBox(),heading=await page.getByRole('heading',{name:'Your next stride'}).boundingBox();
  expect(heading.y).toBeGreaterThanOrEqual(header.y+header.height);
  await expect(page.getByRole('button',{name:'15 MIN',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('separated workshop pixels reconstruct the approved scene without overlap, holes or changing its surroundings',async({page})=>{
  await page.goto('/');
  const baseline='data:image/png;base64,'+readFileSync('art/direction/village-ground-before-refinement.png').toString('base64');
  const report=await page.evaluate(async baseline=>{
    const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
    const [before,ground,context,buildings]=await Promise.all([baseline,'/art/village-ground.png','/art/workshop-context.png','/art/buildings.png'].map(load));
    const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
    const pixels=(image,x=0,y=0,w=image.width,h=image.height)=>{const c=canvas(w,h);c.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);return c.getContext('2d').getImageData(0,0,w,h).data;};
    const a=pixels(context),b=pixels(buildings,280,0,280,300),c=pixels(buildings,560,0,280,300),g=pixels(ground,360,24,280,300);
    let overlap=0,holes=0,baked=0,changed=0,outsideChange=0;
    for(let i=0;i<a.length;i+=4){
      if(a[i+3]&&b[i+3])overlap++;
      if(!a[i+3]&&!b[i+3])holes++;
      if(g[i+3])baked++;
      if(c[i+3]!==b[i+3])holes++;
      if(c.slice(i,i+4).some((v,j)=>v!==b[i+j])){changed++;if(!b[i+3])outsideChange++;}
    }
    const reconstructed=canvas(640,576),ctx=reconstructed.getContext('2d');
    ctx.drawImage(ground,0,0);ctx.drawImage(context,360,24);ctx.drawImage(buildings,280,0,280,300,360,24,280,300);
    const expected=pixels(before),actual=ctx.getImageData(0,0,640,576).data;
    let mismatched=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])mismatched++;
    return {overlap,holes,baked,changed,outsideChange,mismatched};
  },baseline);
  expect(report.overlap).toBe(0);expect(report.holes).toBe(0);expect(report.baked).toBe(0);
  expect(report.changed).toBeGreaterThan(5000);expect(report.outsideChange).toBe(0);expect(report.mismatched).toBe(0);
});

test('mobile workout composition and real workshop restoration retain the Beginner identity',async({page},info)=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:375,height:667});await page.clock.install();await page.goto('/');
  await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'7 MIN',exact:true}).tap();await startWorkout(page,7);
  await page.clock.runFor(3100);
  const avatar=page.locator('.exercise-art .avatar[data-ready=true]'),timer=page.getByRole('timer');
  await expect(avatar).toHaveAttribute('data-avatar-stage','beginner');await expect(avatar).toHaveAttribute('data-pose','march');
  const identity=await avatar.getAttribute('data-avatar-fingerprint');
  for(const name of ['Pause','Skip','Replace']){
    const b=await page.getByRole('button',{name,exact:true}).boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);expect(b.y+b.height).toBeLessThanOrEqual(667);
  }
  const illustration=await avatar.boundingBox(),countdown=await timer.boundingBox();
  expect(illustration.height).toBeGreaterThan(240);expect(illustration.x+illustration.width).toBeLessThanOrEqual(countdown.x+1);
  await shot(page,info,'workout-march');
  await page.clock.runFor(120000);await expect(avatar).toHaveAttribute('data-pose','reach');
  await shot(page,info,'workout-reach');
  await page.getByRole('button',{name:'Mute sound'}).tap();await page.clock.runFor(270000);
  await expect(page.getByText('Session complete. 1 timber earned. Visit the workshop when ready.')).toBeVisible();
  await page.getByRole('button',{name:'Village',exact:true}).tap();
  const map=page.locator('.village-canvas[data-ready=true]');await expect(map).toHaveAttribute('data-avatar-fingerprint',identity);
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();await page.clock.runFor(2500);
  await expect(map).toHaveAttribute('data-interaction','arrived');
  await page.getByRole('button',{name:'Close workshop'}).tap();await page.clock.runFor(100);
  await shot(page,info,'village-before');
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();
  await page.getByRole('button',{name:'Restore workshop · 1 timber'}).tap();await page.clock.runFor(1000);
  await expect(map).toHaveAttribute('data-building-stage','restored');
  await page.getByRole('button',{name:'Close workshop'}).tap();await page.clock.runFor(100);
  await shot(page,info,'village-after');
});

import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {freshState,finish} from '../../src/engine.mjs';
import {testSession,TEST_SETTINGS} from '../fixtures.mjs';
import {startWorkout} from './helpers.mjs';
const base=process.env.PAGES_TEST_PATH||'/';

test('contact keys keep head/torso registered while hands swing; training never changes the face',async({page})=>{
  await page.goto(base);
  const report=await page.evaluate(async base=>{
    const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
    const [body,training]=await Promise.all([base+'art/hero-body.png',base+'art/hero-training-outfit.png'].map(load));
    const canvas=Object.assign(document.createElement('canvas'),{width:960,height:384}),ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;ctx.drawImage(body,0,0);
    const data=ctx.getImageData(0,0,960,128).data;
    const offset=(col,x,y)=>(y*960+col*96+x)*4;
    let upper=0,hands=0,heads=0,bootChanges=0;
    for(const [col,start,end,dx,dy]of [[7,0,50,-5,0],[7,51,95,6,-4],[8,0,50,6,-4]])for(let y=103;y<=119;y++)for(let x=start;x<=end;x++){const a=offset(0,x,y),b=offset(col,x+dx,y+dy);if(data[a+3]===255&&data.slice(a,a+4).some((v,i)=>v!==data[b+i]))bootChanges++;}
    for(const col of [7,8])for(let y=0;y<84;y++)for(let x=0;x<96;x++){
      const a=offset(0,x,y),b=offset(col,x,y),different=data.slice(a,a+4).some((v,j)=>v!==data[b+j]);
      if(different&&y>=44&&y<=70&&x>=45&&x<=60&&data[a+3])upper++;
      if(different&&y>=74&&(x<36||x>69))hands++;
    }
    for(const col of [1,4,5,7,8])for(let y=9;y<=34;y++)for(let x=34;x<=67;x++){
      const a=offset(0,x,y),b=offset(col,x,y);if(data.slice(a,a+4).some((v,j)=>v!==data[b+j]))heads++;
    }
    const baselines=[0,7,8].map(col=>{for(let y=127;y>=0;y--)for(let x=0;x<96;x++)if(data[offset(col,x,y)+3])return y;});
    ctx.clearRect(0,0,960,384);ctx.drawImage(training,0,0);
    const gear=ctx.getImageData(0,0,960,384).data;let coveredFace=0;
    for(let row=0;row<3;row++)for(const col of [0,1,4,5,7,8])for(let y=9;y<=34;y++)for(let x=34;x<=67;x++)if(gear[((row*128+y)*960+col*96+x)*4+3])coveredFace++;
    return {upper,hands,heads,baselines,coveredFace,bootChanges};
  },base);
  expect(report.upper).toBe(0);expect(report.hands).toBeGreaterThan(20);expect(report.heads).toBe(0);expect(report.baselines).toEqual([119,119,119]);expect(report.coveredFace).toBe(0);expect(report.bootChanges).toBe(0);
});

test('all stages share the same rendered face with a distinct light workout outfit at phone size',async({page},info)=>{
  test.setTimeout(120000);mkdirSync('screenshots/character-pass',{recursive:true});
  await page.goto(base);await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  const faces=[],outfits=[];
  for(const [count,stage] of [[0,'beginner'],[3,'adventurer'],[6,'veteran']]){
    let state=freshState();state.settings={...state.settings,...TEST_SETTINGS};const base=Date.now()-10*86400000;
    for(let i=0;i<count;i++){state.active=testSession(7,[],base+i*600000);state=finish(state,true,base+i*600000+420000);}
    await page.evaluate(async state=>{
      const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});
      await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;});db.close();
    },state);await page.reload();
    const home=page.locator('.home-scene .avatar[data-ready=true]');await expect(home).toHaveAttribute('data-outfit','adventure');
    const face=await home.evaluate(c=>Array.from(c.getContext('2d').getImageData(34,9,34,26).data));faces.push(face);
    const canonical=await home.getAttribute('data-avatar-fingerprint');
    await page.getByRole('button',{name:'Village',exact:true}).tap();await expect(page.locator('.village-canvas[data-ready=true]')).toHaveAttribute('data-avatar-stage',stage);
    await page.screenshot({path:`screenshots/character-pass/${info.project.name}-${stage}-village.png`});
    await page.getByRole('button',{name:'Today',exact:true}).tap();await startWorkout(page,10);
    await page.getByRole('button',{name:'Pause',exact:true}).tap();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeEnabled();
    const avatar=page.locator('.exercise-art .avatar[data-ready=true]');await expect(avatar).toHaveAttribute('data-outfit','training');await expect(avatar).toHaveAttribute('data-avatar-stage',stage);
    await expect(avatar).toHaveAttribute('data-avatar-fingerprint',canonical);
    expect(await avatar.evaluate(c=>Array.from(c.getContext('2d').getImageData(34,9,34,26).data))).toEqual(face);
    const outfit=await avatar.getAttribute('data-outfit-fingerprint');expect(outfit).not.toBe(canonical);outfits.push(outfit);
    expect(await avatar.evaluate(c=>getComputedStyle(c).imageRendering)).toBe('pixelated');
    expect(await avatar.evaluate(c=>c.getContext('2d').imageSmoothingEnabled)).toBe(false);
    await page.screenshot({path:`screenshots/character-pass/${info.project.name}-${stage}-march.png`});
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();
  }
  expect(new Set(outfits).size).toBe(3);expect(faces[1]).toEqual(faces[0]);expect(faces[2]).toEqual(faces[0]);
});

test('ending during a delayed final save cannot resurrect a session through a late checkpoint',async({page})=>{
  await page.addInitScript(()=>{
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,...args){
      if(window.__delayEnd && value?.active===null && value.history?.length)this.transaction.__finalWorkoutWrite=true;
      return put.call(this,value,...args);
    };
    const descriptor=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');
    Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...descriptor,set(handler){
      descriptor.set.call(this,function(event){
        if(this.__finalWorkoutWrite)setTimeout(()=>handler.call(this,event),2500);
        else handler.call(this,event);
      });
    }});
  });
  await page.clock.install();await page.goto(base);await startWorkout(page,10);await page.clock.runFor(3100);
  await page.evaluate(()=>{window.__delayEnd=true;});
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();
  await expect(page.getByText('PAUSED',{exact:true})).toBeVisible();
  await page.clock.runFor(3100);await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  await page.reload();await expect(page.getByRole('button',{name:'Start 10-minute session'})).toBeEnabled();
  await page.getByRole('button',{name:'Journal',exact:true}).tap();await expect(page.getByText('Partial',{exact:true})).toBeVisible();
});

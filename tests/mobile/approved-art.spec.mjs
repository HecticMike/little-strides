import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {freshState,finish} from '../../src/engine.mjs';
import {testSession,TEST_SETTINGS} from '../fixtures.mjs';
import {startWorkout} from './helpers.mjs';

test('approved artwork remains painted, touch accessible and consistent across all stages offline',async({page,context},info)=>{
  test.setTimeout(120000);
  mkdirSync('screenshots/art-upgrade',{recursive:true});
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
  const capture=name=>page.screenshot({path:`screenshots/art-upgrade/${info.project.name}-${name}.png`});
  for(const [count,stage] of [[0,'beginner'],[3,'adventurer'],[6,'veteran']]){
    let state=freshState();state.settings={...state.settings,...TEST_SETTINGS};
    const base=Date.now()-10*86400000;
    for(let i=0;i<count;i++){state.active=testSession(7,[],base+i*600000);state=finish(state,true,base+i*600000+420000);}
    await page.evaluate(async state=>{
      const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});
      await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;tx.onerror=reject;});db.close();
    },state);
    await page.reload();
    const home=page.locator('.home-scene .avatar[data-ready=true]');
    await expect(home).toHaveAttribute('data-avatar-stage',stage);
    await expect(home).toHaveAttribute('width','96');await expect(home).toHaveAttribute('height','128');
    const identity=await home.getAttribute('data-avatar-fingerprint');
    await capture('today-'+stage);
    await page.getByRole('button',{name:'Village',exact:true}).tap();
    const map=page.locator('.village-canvas[data-ready=true]');
    await expect(map).toHaveAttribute('data-avatar-fingerprint',identity);
    await expect(page.getByRole('button',{name:'Workshop',exact:true})).toBeEnabled();
    await page.clock.runFor(120);
    // Verify real retained canvas pixels: a ready flag alone previously allowed black captures.
    await expect.poll(()=>page.locator('.village-canvas canvas').evaluate(c=>{
      const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data,colors=new Set();
      for(let i=0;i<data.length;i+=128)colors.add(data[i]+','+data[i+1]+','+data[i+2]);
      return colors.size;
    })).toBeGreaterThan(100);
    await capture('village-'+stage);
    await page.getByRole('button',{name:'Today',exact:true}).tap();await startWorkout(page,10);
    await page.getByRole('button',{name:'Pause',exact:true}).tap();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeEnabled();
    const avatar=page.locator('.exercise-art .avatar[data-ready=true]');
    await expect(avatar).toHaveAttribute('data-avatar-stage',stage);
    await expect(avatar).toHaveAttribute('data-avatar-fingerprint',identity);
    await capture('march-'+stage);
    if(count===0){
      for(const id of ['calf','reach']){
        const before=await avatar.evaluate(c=>c.toDataURL());
        await page.getByRole('button',{name:'Skip',exact:true}).tap();await page.getByRole('button',{name:'Skip',exact:true}).tap();
        await expect(avatar).toHaveAttribute('data-pose',id);
        await expect.poll(()=>avatar.evaluate(c=>c.toDataURL())).not.toBe(before);
        await capture(id+'-'+stage);
      }
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const name of ['Resume','Skip','Replace']){
      const box=await page.getByRole('button',{name,exact:true}).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height);
    }
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'End session',exact:true}).tap();
  }
  await context.setOffline(true);await page.reload();
  await expect(page.locator('.home-scene .avatar[data-ready=true]')).toHaveAttribute('data-avatar-stage','veteran');
  await page.getByRole('button',{name:'Village',exact:true}).tap();
  await expect(page.locator('.village-canvas[data-ready=true]')).toHaveAttribute('data-avatar-stage','veteran');
});

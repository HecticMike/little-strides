import{test,expect}from'@playwright/test';
import{readFileSync}from'node:fs';
import{freshState,createSession,finish,freeze}from'../../src/engine.mjs';
import{CHARACTER}from'../../src/art-spec.mjs';
const base=process.env.PAGES_TEST_PATH||'/',before='data:image/png;base64,'+readFileSync('art/review/calf-before-body.png').toString('base64');
const settings={enabledExercises:['march','calf','reach'],selectionMode:'personal',suggestionVersion:1,muted:true,volume:.3};
async function put(page,state){await page.evaluate(async state=>{const db=await new Promise(resolve=>{const r=indexedDB.open('little-strides',1);r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=resolve;});db.close();},state);await page.reload();}

test('raised calf key preserves identity and all other poses, with a visible heel gap and two toe contacts',async({page})=>{
 await page.goto(base);const report=await page.evaluate(async({base,before,offset})=>{
  const load=async url=>{const i=new Image();i.src=url;await i.decode();const c=Object.assign(document.createElement('canvas'),{width:i.width,height:i.height}),ctx=c.getContext('2d');ctx.drawImage(i,0,0);return ctx.getImageData(0,0,i.width,i.height).data;};
  const a=await load(before),b=await load(base+'art/hero-body.png'),at=(col,x,y)=>(y*960+col*96+x)*4;let other=0,upper=0,gap=0,left=0,right=0;
  for(let y=0;y<128;y++)for(let x=0;x<960;x++)if(Math.floor(x/96)!==4){const i=(y*960+x)*4;if(a.slice(i,i+4).some((v,j)=>v!==b[i+j]))other++;}
  for(let y=9;y<=85;y++)for(let x=0;x<96;x++){const i=at(0,x,y),j=at(4,x,y+offset);if(b.slice(i,i+4).some((v,k)=>v!==b[j+k]))upper++;}
  for(let y=115;y<=119;y++)for(let x=54;x<60;x++)if(b[at(4,x,y)+3])gap++;
  for(let x=0;x<96;x++)if(b[at(4,x,119)+3]){if(x<51)left++;else right++;}
  return{other,upper,gap,left,right};
 },{base,before,offset:CHARACTER.poseReferenceOffsets.calf.y});
 expect(report.other).toBe(0);expect(report.upper).toBe(0);expect(report.gap).toBe(0);expect(report.left).toBeGreaterThanOrEqual(4);expect(report.right).toBeGreaterThanOrEqual(4);
});

test('active calf artwork keeps the canonical face and light outfit at every stage with visible phone controls',async({page},info)=>{
 await page.clock.install();await page.goto(base);await expect(page.getByText('Offline ready',{exact:true})).toBeVisible();
 for(const stage of [0,1,2]){
  const now=Date.now();let state=freshState();state.settings={...state.settings,...settings};
  for(let i=0;i<stage*3;i++){const at=now-(30-i*3)*86400000;state.active=createSession(7,state.history,at,{settings});state=finish(state,true,at+420000);}
  await put(page,state);const home=page.locator('.home-scene .avatar[data-ready=true]');await expect(home).toBeVisible();const face=await home.evaluate(c=>Array.from(c.getContext('2d').getImageData(34,9,34,26).data));
  const plan=createSession(7,state.history,now,{settings}),index=plan.segments.findIndex(b=>b.kind==='work'&&b.exerciseId==='calf');expect(index).toBeGreaterThan(0);const offset=plan.segments.slice(0,index).reduce((n,b)=>n+b.durationMs,0)+1000;
  state.active=freeze(createSession(7,state.history,now-offset,{settings}),now);await put(page,state);await page.getByRole('button',{name:'Resume',exact:true}).tap();const avatar=page.locator('.exercise-art .avatar[data-ready=true]');await expect(avatar).toHaveAttribute('data-pose','calf');await expect(avatar).toHaveAttribute('data-avatar-stage',CHARACTER.stages[stage].id);await expect(avatar).toHaveAttribute('data-outfit','training');
  expect(await avatar.evaluate((c,y)=>Array.from(c.getContext('2d').getImageData(34,y,34,26).data),9+CHARACTER.poseReferenceOffsets.calf.y)).toEqual(face);await expect(page.locator('.pose-note')).toContainText('not a validated demonstration');
  for(const name of ['Pause','Skip','Replace']){const button=page.getByRole('button',{name,exact:true});await expect(button).toBeInViewport();const r=await button.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('calf-'+CHARACTER.stages[stage].id+'.png')});
 }
});

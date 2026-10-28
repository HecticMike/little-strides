import{test,expect}from'@playwright/test';
import{readFileSync}from'node:fs';
import{CORE_ILLUSTRATIONS}from'../../src/art-spec.mjs';
const base=process.env.PAGES_TEST_PATH||'/';
const before='data:image/png;base64,'+readFileSync('art/review/floor-before-support.png').toString('base64');
const palette=readFileSync('art/palette.gpl','utf8').split(/\r?\n/).filter(l=>/^\s*\d+\s+\d+\s+\d+/.test(l)).map(l=>l.trim().split(/\s+/).slice(0,3).join(','));
test('floor support refinement keeps leg positions, shared stage identity, palette and viewport bounds',async({page},info)=>{
 await page.clock.install();await page.goto(base);const report=await page.evaluate(async({before,palette,base,ids,widths})=>{
  const load=async src=>{const i=new Image();i.src=src;await i.decode();const c=Object.assign(document.createElement('canvas'),{width:i.width,height:i.height});const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return ctx.getImageData(0,0,i.width,i.height).data;};
  const old=await load(before),current=await load(base+'art/hero-core-poses.png'),colors=new Set(palette),at=(col,row,x,y)=>((row*128+y)*768+col*192+x)*4;let legs=0,headStage=0,clipped=0,foreignColors=0,headChanged=0;
  ids.forEach((id,col)=>{for(let row=0;row<3;row++)for(let y=0;y<128;y++)for(let x=0;x<192;x++){
   const p=at(col,row,x,y);if(current[p+3]&&(x>=widths[id]||y<56))clipped++;
   if(current[p+3]&&!colors.has(Array.from(current.slice(p,p+3)).join(',')))foreignColors++;
   const different=old.slice(p,p+4).some((v,i)=>v!==current[p+i]);
   if(old[p+3]===255&&((x>=104&&y<110)||(x>=60&&y<=98))&&different)legs++;
   if(x<46&&y>=70&&y<=109){if(row){const reference=at(col,0,x,y);if(current.slice(p,p+4).some((v,i)=>v!==current[reference+i]))headStage++;}else if(different)headChanged++;}
  }});return{legs,headStage,clipped,foreignColors,headChanged};
 },{before,palette,base,ids:CORE_ILLUSTRATIONS.poses,widths:CORE_ILLUSTRATIONS.viewport.widths});
 expect(report.legs).toBe(0);expect(report.headStage).toBe(0);expect(report.clipped).toBe(0);expect(report.foreignColors).toBe(0);expect(report.headChanged).toBeGreaterThan(0);
 await page.getByRole('button',{name:/A smaller step/}).tap();await page.clock.runFor(35000);
 await expect(page.locator('.core-illustration[data-ready=true]')).toHaveAttribute('data-exercise-id','abdominal-bracing');
 for(const name of ['Pause','Skip','Replace']){const button=page.getByRole('button',{name,exact:true});await expect(button).toBeInViewport();const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:info.outputPath('active-bracing.png')});await page.getByRole('button',{name:'Replace',exact:true}).tap();await page.getByRole('button',{name:'Use Supine heel slides',exact:true}).tap();
 await expect(page.locator('.core-illustration[data-ready=true]')).toHaveAttribute('data-exercise-id','heel-slide');await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();await page.screenshot({path:info.outputPath('active-heel-slide.png')});
});

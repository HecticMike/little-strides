import {expect} from '@playwright/test';import {readFileSync} from 'node:fs';
import {comebackStageFrame,comebackStagePose,COMEBACK_STAGE_ASSET} from '../../src/comeback-stages.mjs';
export async function expectStageArt(art,stage,pose){
 await expect(art).toHaveAttribute('data-ready','true');await expect(art).toHaveAttribute('data-avatar-appearance',stage);await expect(art).toHaveAttribute('data-art-source',COMEBACK_STAGE_ASSET);
 const f=comebackStageFrame(pose,stage);await expect(art).toHaveAttribute('data-art-frame',JSON.stringify(f));
 const root='art/prototypes/comeback/stage-study/five-stage/';const uri=p=>'data:image/png;base64,'+readFileSync(root+p+'.png').toString('base64');
 const result=await art.evaluate(async(el,{f,pose,source,golden,standing})=>{
  const load=s=>new Promise((r,j)=>{const i=new Image;i.onload=()=>r(i);i.onerror=j;i.src=s});const [atlas,reference,body]=await Promise.all([load(source),load(golden),load(standing)]);
  const c=Object.assign(document.createElement('canvas'),{width:f.w,height:f.h}),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const actual=ctx.getImageData(0,0,f.w,f.h).data;ctx.clearRect(0,0,f.w,f.h);ctx.drawImage(reference,0,0);const expected=ctx.getImageData(0,0,f.w,f.h).data;let difference=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])difference++;
  c.width=96;c.height=128;ctx.drawImage(body,0,0);let hash=2166136261;for(const n of ctx.getImageData(0,0,96,128).data)hash=Math.imul(hash^n,16777619);
  const floor=['heel-slide','abdominal-bracing','pelvic-tilt','glute-bridge'].includes(pose),exercise=pose==='march'||pose==='calf';
  const [dx,dy,dw,dh]=floor?[0,-207,864,576]:exercise?[246,pose==='calf'?-5.5:8,324,f.h*3.375]:[524.8,0,307.2,409.6];
  const rendered=el.getContext('2d').getImageData(0,0,el.width,el.height).data;let samples=0,renderDifferences=0,eligible=0;
  for(let y=1;y<f.h-1;y++)for(let x=1;x<f.w-1;x++){const i=(y*f.w+x)*4;if(expected[i+3]!==255||expected[i-4+3]!==255||expected[i+4+3]!==255||expected[i-f.w*4+3]!==255||expected[i+f.w*4+3]!==255)continue;if(++eligible%23)continue;const px=Math.floor(dx+(x+.5)*dw/f.w),py=Math.floor(dy+(y+.5)*dh/f.h);if(px<0||py<0||px>=el.width||py>=el.height)continue;const j=(py*el.width+px)*4;samples++;for(let k=0;k<4;k++)if(rendered[j+k]!==expected[i+k])renderDifferences++;}
  return {difference,fingerprint:(hash>>>0).toString(16),actualFingerprint:el.dataset.avatarFingerprint,samples,renderDifferences,smoothing:el.getContext('2d').imageSmoothingEnabled};
 },{f,pose,source:COMEBACK_STAGE_ASSET,golden:uri(stage+'-'+comebackStagePose(pose)),standing:uri(stage+'-stand')});
 expect(result.difference).toBe(0);expect(result.actualFingerprint).toBe(result.fingerprint);expect(result.smoothing).toBe(false);expect(result.samples).toBeGreaterThan(20);expect(result.renderDifferences).toBe(0);return result;
}

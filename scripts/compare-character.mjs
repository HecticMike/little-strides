import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {CHARACTER} from '../src/art-spec.mjs';
mkdirSync('art/review',{recursive:true});
const data=name=>'data:image/png;base64,'+readFileSync(name).toString('base64');
const inputs={body:data('public/art/hero-body.png'),gear:data('public/art/hero-equipment.png'),training:data('public/art/hero-training-outfit.png'),core:data('art/review/core-study.png')};
const columns=[['Idle','stand','adventure'],['Walk A','walk-a','adventure'],['Walk B','walk-b','adventure'],['March','march','training'],['Calf','calf','training'],['Reach','reach','training'],['Core study','core','study']];
const html=`<!doctype html><meta charset="utf-8"><title>Little Strides character comparison</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#112d26;color:#f6e8be;font:14px system-ui,sans-serif}.sheet{width:1680px;padding:20px}
h1{font:700 27px ui-monospace,monospace;margin:0 0 7px}p{margin:4px 0 15px;color:#c5c8ae}
.grid{display:grid;grid-template-columns:120px repeat(6,192px) 320px;gap:8px;align-items:center}
.label{font-size:16px;font-weight:700}.label small{display:block;font-size:11px;line-height:1.4;color:#c5c8ae;margin-top:8px;font-weight:400}
.heading{text-align:center;font-weight:700;font-size:15px;padding:12px 0}.heading small{display:block;font-size:11px;font-weight:400;color:#c5c8ae}
.cell{height:266px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;border:1px solid #677759;background:repeating-conic-gradient(#213e33 0% 25%,#254237 0% 50%) 0 0/24px 24px}
.cell.study{background:#403d2a;border-color:#c69a51}canvas{image-rendering:pixelated;display:block}
footer{border-top:1px solid #9e8954;margin-top:18px;padding-top:10px;display:flex;align-items:center;gap:20px}
footer p{font-size:12px;line-height:1.55;max-width:630px;margin:0}.samples{display:flex;gap:12px;align-items:center}.sample{text-align:center;font-size:11px;color:#c5c8ae}.sample canvas{margin:5px auto}
</style><div class="sheet"><h1>LITTLE STRIDES / CANONICAL CHARACTER</h1>
<p>One shared body, registered head and palette. Adventure equipment at left; light training outfit at right. Progression retains the existing shared physique.</p>
<div class="grid"><div></div>${columns.map(([name,,purpose])=>`<div class="heading">${name}<small>${purpose==='study'?'PROVISIONAL / NEVER SCHEDULED':purpose==='training'?'Light training outfit':'Adventure outfit'}</small></div>`).join('')}
${CHARACTER.stages.map((stage,row)=>`<div class="label">${stage.name}<small>Fictional progression<br>Same canonical identity</small></div>${columns.map(([,pose,purpose])=>`<div class="cell ${purpose==='study'?'study':''}"><canvas data-row="${row}" data-pose="${pose}" data-outfit="${purpose}" width="${purpose==='study'?320:192}" height="${purpose==='study'?192:256}"></canvas></div>`).join('')}`).join('')}
</div><footer><p>Review at 100% for pixel edges. Main sprites are shown at exact 2x scale.<br>
The core study is artwork only: support and limb separation improved; neck, hand and contact polish still need manual review. All exercise artwork remains clinically unvalidated; locks and opt-ins are unchanged.<br>
Walking alternates flat support and toe-off using the original boots. Upper-body registration is fixed; knee/cuff joins still need an artist's pass.</p>
<div class="samples">${CHARACTER.stages.map((s,row)=>`<div class="sample">${s.name}<canvas class="mini" data-row="${row}" width="48" height="64"></canvas>Village game-space 48x64</div>`).join('')}</div>
<div class="sample">Core study at mobile 160x96<canvas id="core-mini" width="160" height="96"></canvas>Not a demonstration</div></footer></div>
<script>
const sources=${JSON.stringify(inputs)}, poses=${JSON.stringify(CHARACTER.poses)};
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
Promise.all(Object.entries(sources).map(async([name,url])=>[name,await load(url)])).then(entries=>{
 const images=Object.fromEntries(entries);
 for(const c of document.querySelectorAll('canvas')){
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  const row=Number(c.dataset.row||0),pose=c.dataset.pose||'stand';
  if(pose==='core'||c.id==='core-mini'){ctx.drawImage(images.core,0,row*96,160,96,0,0,c.width,c.height);continue;}
  const col=poses.indexOf(pose);ctx.drawImage(images.body,col*96,0,96,128,0,0,c.width,c.height);
  const outfit=c.dataset.outfit||'adventure';
  if(outfit==='training')ctx.drawImage(images.training,col*96,row*128,96,128,0,0,c.width,c.height);
  else if(row)ctx.drawImage(images.gear,col*96,(row-1)*128,96,128,0,0,c.width,c.height);
 }
 document.body.dataset.ready='true';
}).catch(e=>{document.body.dataset.error=String(e)});
</script>`;
writeFileSync('art/review/character-comparison.html',html);
const browser=await chromium.launch();
try{const page=await browser.newPage({viewport:{width:1680,height:1200},deviceScaleFactor:1});await page.setContent(html);await page.locator('body[data-ready=true]').waitFor();await page.locator('.sheet').screenshot({path:'art/review/character-comparison.png'});console.log('Saved art/review/character-comparison.png and self-contained HTML.');}finally{await browser.close();}

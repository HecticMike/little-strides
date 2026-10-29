import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
export async function reviewHeelStudy(palette,{pose='heel-slide',prefix='heel',label='Heel slide'}={}){
 const root='art/prototypes/comeback/stage-study';
 const report=JSON.parse(readFileSync(root+'/'+prefix+'-report.json','utf8'));
 assert.equal(report.integrated,false);assert.equal(report.pose,pose);assert.equal(report.artStatus,'provisional-unreviewed');assert.deepEqual(report.thresholds,[0,24,96]);
 for(const stage of report.stages){
  assert.equal(stage.junctionDifference,0);assert.equal(stage.legsAndHandsDifference,0);assert.equal(stage.floorContactDifference,0);assert.equal(stage.partialAlphaPixels,0);assert.equal(stage.components.length,1);
  assert.deepEqual(stage.bounds,report.stages[0].bounds);
  for(const c of stage.palette)assert.ok(palette.has(c),'Off-palette heel pixel: '+c);
  if(stage.threshold>0){assert.ok(stage.changedPixels>0);assert.ok(stage.layers.some(l=>l.name.startsWith('Study /')&&l.pixels>0));}
 }
 const sections=report.stages.map(s=>s.armSectionSkinPixels);assert.ok(sections[0]<sections[1]&&sections[1]<sections[2]);
 const uri=n=>'data:image/png;base64,'+readFileSync(root+'/'+n+'.png').toString('base64');
 const stands=['starting','form-standing','developed-silhouette'].map(uri);
 const heels=['starting-'+pose,'form-'+pose,'developed-'+pose].map(uri);
 const names=['Starting / 0','Finding form / 24','Developed study / 96'];
 const cards=names.map((name,i)=>'<article><h2>'+name+'</h2><img class="standing" width="144" height="192" alt="'+name+' standing reference" src="'+stands[i]+'"><h3>'+label+' / pixel detail</h3><canvas data-stage="'+i+'" data-kind="detail" width="352" height="116" aria-label="Heel-slide pose detail"></canvas><h3>Phone workout crop / 343px</h3><canvas data-stage="'+i+'" data-kind="workout" class="workout" width="864" height="378" aria-label="Heel-slide artwork at phone display size"></canvas><p class="small">'+(i===0?'Unchanged source pose.':report.stages[i].changedPixels+' changed working pixels; pose anchors preserved.')+'</p></article>').join('');
 let html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Little Strides / heel-slide progression study</title><style>*{box-sizing:border-box}body{margin:0;background:#f5eddd;color:#243c42;font:15px/1.5 system-ui}.sheet{width:100%;max-width:1144px;padding:8px}h1{font-size:24px;margin:8px 0}h2{font-size:18px;margin:10px 0}h3{font-size:14px;margin:18px 0 8px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}article{padding:8px;box-shadow:inset 0 0 0 1px #cbbca3;text-align:center}img,canvas{display:block;margin:auto;max-width:100%;image-rendering:pixelated}.standing{width:144px;height:192px}.workout{width:343px;height:auto}.small,footer{font-size:13px;color:#52656c}footer{margin-top:12px;padding:10px 0}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style><main class="sheet"><h1>Little Strides / heel-slide studies</h1><p>Same pose and identity across the standing references and floor studies. Native-pixel changes only; not in the live app.</p><div class="grid">'+cards+'</div><footer>Existing complete head/neck/shoulder pixels, knee positions, hands and floor contacts remain unchanged. The phone crop follows the current workout renderer on a neutral background; these are artwork reviews, not app screenshots or validated demonstrations. Arm contour changes are modest at phone size. No upright body parts were copied into the floor pose.</footer></main><script>const sources='+JSON.stringify(heels)+';Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i);i.onerror=reject;i.src=src}))).then(images=>{for(const c of document.querySelectorAll("canvas")){const ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.fillStyle="#f5eddd";ctx.fillRect(0,0,c.width,c.height);const im=images[Number(c.dataset.stage)];if(c.dataset.kind==="detail")ctx.drawImage(im,8,70,176,58,0,0,352,116);else ctx.drawImage(im,0,0,192,128,0,-207,864,576)}document.body.dataset.ready="true"});</script></html>';
 if(pose!=='heel-slide'){
  const purpose=pose==='supine'?'Starting position only: bracing and pelvic tilt are not depicted.':'Raised position only: the lift/lower cycle is not depicted.';
  assert.equal(report.artPurpose,pose==='supine'?'starting-position-only':'raised-position-only');assert.equal(report.movementDepicted,false);
  html=html.replaceAll('heel-slide',pose).replaceAll('Heel-slide',label).replaceAll('height="116"','height="144"').replace('8,70,176,58,0,0,352,116','8,56,176,72,0,0,352,144').replace('Native-pixel changes only; not in the live app.',purpose+' Native-pixel changes only; not in the live app.');
 }
 writeFileSync(root+'/'+prefix+'-comparison.html',html);
 const browser=await chromium.launch();let mobile;
 try{const page=await browser.newPage({viewport:{width:1144,height:1000},deviceScaleFactor:1});await page.setContent(html);await page.locator('body[data-ready="true"]').waitFor();await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const detailHeight=pose==='heel-slide'?116:144;const cropTop=pose==='heel-slide'?70:56;assert.deepEqual(await page.locator('canvas[data-kind=detail]').evaluateAll(cs=>cs.map(c=>c.height)),[detailHeight,detailHeight,detailHeight]);for(const stage of report.stages){assert.ok(stage.bounds.x>=8&&stage.bounds.right<184&&stage.bounds.y>=cropTop&&stage.bounds.bottom<cropTop+detailHeight/2,'Review crop clips the source pose.');}
 await page.locator('.sheet').screenshot({path:root+'/'+prefix+'-comparison.png'});
 await page.setViewportSize({width:375,height:667});mobile=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,workoutWidths:[...document.querySelectorAll('.workout')].map(c=>c.getBoundingClientRect().width),nearestNeighbour:[...document.querySelectorAll('canvas')].every(c=>getComputedStyle(c).imageRendering==='pixelated')}));
 assert.ok(mobile.scrollWidth<=mobile.viewport);for(const w of mobile.workoutWidths)assert.equal(w,343);assert.equal(mobile.nearestNeighbour,true);await page.locator('.sheet').screenshot({path:root+'/'+prefix+'-mobile.png'});
 }finally{await browser.close();}
 const result={integrated:false,anatomyStatus:'provisional-unreviewed',armSectionSkinPixels:sections,changedPixels:report.stages.map(s=>s.changedPixels),protectedJunctionDifference:0,limbAnchorDifference:0,mobile};
 if(pose!=='heel-slide'){result.pose=pose;result.artPurpose=report.artPurpose;result.exerciseIds=report.exerciseIds;}
 writeFileSync(root+'/'+prefix+'-review.json',JSON.stringify(result,null,2)+'\n');return result;
}

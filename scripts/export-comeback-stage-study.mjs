import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {reviewHeelStudy} from './review-comeback-heel-study.mjs';
const root='art/prototypes/comeback/stage-study';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const baseline=JSON.parse(readFileSync('art/prototypes/comeback/user-art/bridge-developed-export-verification.json','utf8'));
const preserved=Object.assign({},baseline.unchangedMasters,baseline.byteIdenticalRuntimeOutputs);
const paths=Object.keys(preserved).map(p=>p.replaceAll('\\','/'));
const snapshots=Object.fromEntries([...paths,root+'/developed-silhouette.aseprite',root+'/form-standing.aseprite',root+'/form-heel-slide.aseprite',root+'/developed-heel-slide.aseprite',root+'/form-march.aseprite',root+'/developed-march.aseprite'].map(p=>[p,hash(p)]));
for(const [p,h] of Object.entries(preserved))assert.equal(hash(p.replaceAll('\\','/')),h,'Approved artwork drift: '+p);
const p=spawnSync(process.env.ASEPRITE_PATH||'C:/Program Files/Aseprite/Aseprite.exe',['-b','--script','scripts/export-comeback-stage-study.lua'],{encoding:'utf8',windowsHide:true});
assert.equal(p.status,0,p.stdout+p.stderr);console.log(p.stdout.trim());
const heelExport=spawnSync(process.env.ASEPRITE_PATH||'C:/Program Files/Aseprite/Aseprite.exe',['-b','--script','scripts/export-comeback-heel-study.lua'],{encoding:'utf8',windowsHide:true});assert.equal(heelExport.status,0,heelExport.stdout+heelExport.stderr);console.log(heelExport.stdout.trim());
const reports=['report.json','form-export.json','form-march-export.json','developed-march-export.json'].map(n=>JSON.parse(readFileSync(root+'/'+n,'utf8')));
const palette=new Set(readFileSync('art/prototypes/comeback/user-art/palette.gpl','utf8').split(/\r?\n/).filter(l=>/^\d+ \d+ \d+/.test(l)).map(l=>l.split(/\s+/).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join('')));
for(const report of reports){
 assert.equal(report.integrated,false);assert.equal(report.headDifference,0);assert.equal(report.lowerBodyDifference,0);
 assert.equal(report.brokenLogicalBlocks,0);assert.equal(report.partialAlphaPixels,0);assert.equal(report.components.length,1);assert.ok(report.changedLogicalPixels>0);
 for(const c of report.palette)assert.ok(palette.has(c),'Off-palette colour: '+c);
}
const report=reports[0];
const range=JSON.parse(readFileSync(root+'/range-report.json','utf8'));
assert.deepEqual(range.thresholds,[0,24,96]);assert.equal(range.integrated,false);
assert.ok(range.shoulderWidths[0]<range.shoulderWidths[1]&&range.shoulderWidths[1]<range.shoulderWidths[2],'Standing widths must show actual increasing silhouettes.');
for(const [path,h] of Object.entries(snapshots))assert.equal(hash(path),h,'Read-only export changed '+path);
const marchRange=JSON.parse(readFileSync(root+'/march-report.json','utf8'));
assert.equal(marchRange.integrated,false);assert.equal(marchRange.pose,'march');assert.equal(marchRange.animation,false);assert.deepEqual(marchRange.thresholds,[0,24,96]);
assert.ok(marchRange.shoulderWidths[0]<marchRange.shoulderWidths[1]&&marchRange.shoulderWidths[1]<marchRange.shoulderWidths[2]);
for(const r of reports.filter(r=>r.pose==='march')){assert.equal(r.animation,false);assert.equal(r.clinicalStatus,'provisional-unreviewed-illustration');}
const names=['Starting / 0','Finding form / 24','Developed study / 96'];
const images=['starting','form-standing','developed-silhouette'].map(n=>'data:image/png;base64,'+readFileSync(root+'/'+n+'.png').toString('base64'));
const figures=(width,silhouette=false)=>'<div class="row">'+images.map((im,i)=>'<figure><img alt="'+names[i]+' standing" style="width:'+width+'px;height:'+(width*4/3)+'px;'+(silhouette?'filter:brightness(0)':'')+'" src="'+im+'"></figure>').join('')+'</div>';
const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Little Strides / isolated standing stage study</title><style>*{box-sizing:border-box}body{margin:0;background:#f5eddd;color:#243c42;font:15px/1.5 system-ui}main{width:720px;padding:24px}h1{margin:0;font-size:23px}h2{font-size:16px;margin:22px 0 4px}p{margin:8px 0}.row{display:grid;grid-template-columns:repeat(3,1fr);align-items:end}.labels{text-align:center;font-size:14px;font-weight:700;border-bottom:1px solid #cbbca3;padding:10px 0}figure{margin:0;display:flex;justify-content:center;align-items:end}img{display:block;image-rendering:pixelated}.note{font-size:13px;color:#52656c}footer{border-top:1px solid #cbbca3;margin-top:18px;padding-top:10px;font-size:13px}</style><main><h1>Little Strides / standing-stage study</h1><p>A three-build standing range. Same identity and outfit; live artwork preserved.</p><div class="row labels">'+names.map(n=>'<div>'+n+'</div>').join('')+'</div><h2>Enlarged: same head, height and outfit</h2>'+figures(192)+'<h2>Phone workout figure width / 144 px</h2>'+figures(144)+'<p class="note">Size check only: this is standing idle, not an exercise demonstration.</p><h2>Native 48 x 64 / no labels beneath individual figures</h2>'+figures(48)+'<h2>Silhouette check / 96 px</h2>'+figures(96,true)+'<footer>Shoulder spans at logical row 23: '+range.shoulderWidths.join(' / ')+' pixels. Both studies preserve the exact canonical head, height, hands, legs and soles. Fictional physique progression; not measured fitness or an exercise demonstration. The 8/48 builds and complete production exercise-stage artwork remain unfinished. Sleeve/arm anatomy still needs artist review. Not integrated into the app.</footer></main></html>';
writeFileSync(root+'/comparison.html',html);
const marchingImages=['starting-march','form-march','developed-march'].map(n=>'data:image/png;base64,'+readFileSync(root+'/'+n+'.png').toString('base64'));
let marchHtml=html;
for(let i=0;i<3;i++)marchHtml=marchHtml.replaceAll(images[i],marchingImages[i]);
marchHtml=marchHtml.replace('Size check only: this is standing idle, not an exercise demonstration.','Artwork size check: one marching still, not a complete or validated movement cycle.').replaceAll('standing-stage study','marching-stage study').replaceAll(' standing"',' marching"').replace('A three-build standing range. Same identity and outfit; live artwork preserved.','Three marching build studies. Head, hands, knee and foot positions preserved; not in the app.').replace(/<footer>.*?<\/footer>/,'<footer>Shoulder spans at logical row 23: '+marchRange.shoulderWidths.join(' / ')+' pixels. Same canonical head and exact source pixels below the upper-body study region. One marching still; no walking system or complete movement cycle. Pose anatomy remains provisional and unreviewed. Live artwork and exercise eligibility unchanged.</footer>');
writeFileSync(root+'/march-comparison.html',marchHtml);
const mobileHtml='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Little Strides / mobile marching review</title><style>*{box-sizing:border-box}body{margin:0;background:#f5eddd;color:#243c42;font:15px/1.5 system-ui}main{width:100%;max-width:375px;padding:16px}h1{font-size:23px;margin:0 0 8px}h2{font-size:17px;margin:8px 0}article{border:1px solid #cbbca3;padding:8px;margin:12px 0;text-align:center}.pair{display:flex;gap:8px;justify-content:center}img{width:144px;height:192px;image-rendering:pixelated}p{margin:8px 0}.small{font-size:13px;color:#52656c}</style><main><h1>Marching / character review</h1><p>Standing and marching at144px figure width. Same identity and outfit; provisional art.</p>'+names.map((n,i)=>'<article><h2>'+n+'</h2><div class="pair"><img alt="'+n+' standing" src="'+images[i]+'"><img alt="'+n+' marching" src="'+marchingImages[i]+'"></div><p class="small">Standing / marching</p></article>').join('')+'<p class="small">Artwork review only. Each is one supplied pose with native physique edits; movement is not animated or clinically validated. Live app unchanged.</p></main></html>';
writeFileSync(root+'/march-mobile.html',mobileHtml);
const browser=await chromium.launch();let marchMobile;
try{
 const page=await browser.newPage({viewport:{width:720,height:1200},deviceScaleFactor:1});
 const ready=()=>page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.setContent(html);await ready();await page.locator('main').screenshot({path:root+'/comparison.png'});
 await page.setContent(marchHtml);await ready();await page.locator('main').screenshot({path:root+'/march-comparison.png'});
 await page.setViewportSize({width:375,height:667});await page.setContent(mobileHtml);await ready();
 marchMobile=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,imageWidths:[...document.images].map(im=>im.getBoundingClientRect().width),nearestNeighbour:[...document.images].every(im=>getComputedStyle(im).imageRendering==='pixelated')}));
 assert.equal(marchMobile.scrollWidth,375);assert.equal(marchMobile.nearestNeighbour,true);for(const w of marchMobile.imageWidths)assert.equal(w,144);
 await page.locator('main').screenshot({path:root+'/march-mobile.png'});
}finally{await browser.close();}
const heelReview=await reviewHeelStudy(palette);
for(const [path,h] of Object.entries(snapshots))assert.equal(hash(path),h,'Review changed '+path);
writeFileSync(root+'/verification.json',JSON.stringify({schemaVersion:1,integrated:false,source:'Starting standing and heel-slide bodies with separately editable native-pixel study overlays; authoritative upright head and intact source floor junction',preservedApprovedMasters:Object.keys(baseline.unchangedMasters).length,preservedRuntimeFiles:Object.keys(baseline.byteIdenticalRuntimeOutputs).length,unchangedHashes:snapshots,exportHashes:Object.fromEntries(['starting.png','developed-silhouette.png','form-standing.png','developed.png','report.json','form-export.json','range-report.json','comparison.html','comparison.png','starting-heel-slide.png','form-heel-slide.png','developed-heel-slide.png','heel-report.json','heel-comparison.html','heel-comparison.png','heel-mobile.png','heel-review.json','starting-march.png','form-march.png','developed-march.png','form-march-export.json','developed-march-export.json','march-report.json','march-comparison.html','march-comparison.png','march-mobile.html','march-mobile.png'].map(n=>[n,hash(root+'/'+n)])),checks:{headDifference:report.headDifference,lowerBodyDifference:report.lowerBodyDifference,brokenLogicalBlocks:report.brokenLogicalBlocks,partialAlphaPixels:report.partialAlphaPixels,components:report.components.length,sharedPalette:true,standingThresholds:range.thresholds,shoulderWidths:range.shoulderWidths,allStudiesValidated:true,heelStudy:heelReview,marchStudy:{shoulderWidths:marchRange.shoulderWidths,mobile:marchMobile,headDifference:0,protectedLowerBodyDifference:0}}},null,2)+'\n');
console.log('Study contracts and preservation checks pass; comparison.png ready.');

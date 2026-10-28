import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='art/prototypes/progression',master=dir+'/hero-progression.aseprite';
assert.ok(existsSync(master),'Create the separate prototype once with scripts/prototype-progression.lua.');
const executable=process.env.ASEPRITE_PATH||'C:/Program Files/Aseprite/Aseprite.exe';
const exported=spawnSync(executable,['-b','--script','scripts/export-progression.lua'],{stdio:'inherit',windowsHide:true});
assert.equal(exported.status,0,'Aseprite prototype export failed.');
const data=name=>'data:image/png;base64,'+readFileSync(name).toString('base64');
const images=Object.fromEntries(['body','adventure','workout','control'].map(n=>[n,data(`${dir}/${n}.png`)]));
images.original=data('public/art/hero-body.png');images.originalTraining=data('public/art/hero-training-outfit.png');images.backdrop=data('public/art/training.png');
const palette=readFileSync('art/palette.gpl','utf8').split(/\r?\n/).filter(l=>/^\s*\d+\s+\d+\s+\d+/.test(l)).map(l=>l.trim().split(/\s+/).slice(0,3).join(','));
const browser=await chromium.launch();
try{
 if(process.argv.includes('--measure')){
  const {startWorkout}=await import('../tests/mobile/helpers.mjs');
  const context=await browser.newContext({viewport:{width:375,height:667},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4197/');
  await startWorkout(page,10);await page.getByRole('button',{name:'Pause',exact:true}).tap();
  await page.locator('.exercise-art .avatar[data-ready=true]').waitFor();
  const reference=await page.locator('.exercise-art').evaluate(el=>{
   const c=el.querySelector('canvas'),r=el.getBoundingClientRect(),cr=c.getBoundingClientRect(),css=getComputedStyle(c);
   return {viewport:{width:innerWidth,height:innerHeight},art:{width:r.width,height:r.height},canvas:{left:cr.left-r.left,top:cr.top-r.top,width:cr.width,height:cr.height,paddingTop:parseFloat(css.paddingTop),paddingBottom:parseFloat(css.paddingBottom)},imageRendering:css.imageRendering};
  });
  reference.cssSha256=createHash('sha256').update(readFileSync('src/style.css')).digest('hex');
  writeFileSync(dir+'/mobile-reference.json',JSON.stringify(reference,null,2)+'\n');await context.close();
 }
 const reference=JSON.parse(readFileSync(dir+'/mobile-reference.json','utf8'));
 assert.equal(reference.cssSha256,createHash('sha256').update(readFileSync('src/style.css')).digest('hex'),'Workout CSS changed: repeat with --measure against the local preview.');
 const page=await browser.newPage({viewport:{width:1744,height:1600},deviceScaleFactor:1});
 const measurements=await page.evaluate(async({images,palette})=>{
  const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  const imgs=Object.fromEntries(await Promise.all(Object.entries(images).map(async([k,v])=>[k,await load(v)])));
  const pixels=(im,x,y,w,h,scale=1)=>{const c=Object.assign(document.createElement('canvas'),{width:w*scale,height:h*scale});const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x,y,w,h,0,0,c.width,c.height);return ctx.getImageData(0,0,c.width,c.height).data;};
  const difference=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(a.slice(i,i+4).some((v,j)=>v!==b[i+j]))n++;return n;};
  const allowed=new Set(palette);let invalid=0;
  const b=pixels(imgs.body,0,0,192,256);for(let i=0;i<b.length;i+=4)if(b[i+3]&&!allowed.has(Array.from(b.slice(i,i+3)).join(',')))invalid++;
  const poses=[];
  for(let pose=0;pose<2;pose++){
   const beginner=pixels(imgs.body,pose*96,0,96,128),veteran=pixels(imgs.body,pose*96,128,96,128);
   const old=pixels(imgs.original,pose*96,0,96,128);
   let headChanges=0,legChanges=0;for(let y=0;y<128;y++)for(let x=0;x<96;x++){
    const i=(y*96+x)*4;if(beginner.slice(i,i+4).some((v,j)=>v!==veteran[i+j])){if(y<38)headChanges++;if(y>=84)legChanges++;}
   }
   const miniature=[0,128].map(y=>pixels(imgs.body,pose*96,y,96,128,.5));
   const span=d=>{let total=0;for(let y=22;y<=26;y++){let min=48,max=-1;for(let x=0;x<48;x++)if(d[(y*48+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x);}total+=max-min+1;}return total/5;};
   const baselines=[beginner,veteran].map(d=>{for(let y=127;y>=0;y--)for(let x=0;x<96;x++)if(d[(y*96+x)*4+3])return y;});
   poses.push({pose:['stand','march'][pose],beginnerChanges:difference(beginner,old),headChanges,legChanges,baselines,villageShoulderSpan:miniature.map(span),nativeChangedPixels:difference(...miniature)});
  }
  const originalTraining=document.createElement('canvas');originalTraining.width=96;originalTraining.height=128;const tc=originalTraining.getContext('2d');
  let beginnerOutfitChanges=0;
  for(let pose=0;pose<2;pose++){
   tc.clearRect(0,0,96,128);tc.drawImage(imgs.original,pose*96,0,96,128,0,0,96,128);tc.drawImage(imgs.originalTraining,pose*96,0,96,128,0,0,96,128);
   beginnerOutfitChanges+=difference(tc.getImageData(0,0,96,128).data,pixels(imgs.workout,pose*96,0,96,128));
  }
  return {poses,invalidPalettePixels:invalid,beginnerOutfitChanges};
 },{images,palette});
 assert.equal(measurements.invalidPalettePixels,0);assert.equal(measurements.beginnerOutfitChanges,0);
 for(const p of measurements.poses){assert.equal(p.beginnerChanges,0);assert.equal(p.headChanges,0);assert.equal(p.legChanges,0);assert.deepEqual(p.baselines,[119,119]);assert.ok(p.villageShoulderSpan[1]-p.villageShoulderSpan[0]>=3,'Physique difference too small at 48x64; refine before delivery.');}
 const categories=[['Idle · adventure','adventure',0],['March · adventure','adventure',1],['Idle · workout','workout',0],['March · workout','workout',1]];
 const pair=(outfit,pose,cls,w,h)=>`<div class="pair ${cls}">${[0,1].map(row=>`<div><canvas data-outfit="${outfit}" data-pose="${pose}" data-row="${row}" width="96" height="128" style="width:${w}px;height:${h}px"></canvas></div>`).join('')}</div>`;
 const mobile=reference.art,c=reference.canvas;
 const html=`<!doctype html><meta charset="utf-8"><title>Little Strides physique prototype</title><style>
 *{box-sizing:border-box}body{margin:0;background:#112d26;color:#f6e8be;font:14px system-ui,sans-serif}.sheet{width:1744px;padding:24px}h1{font:700 26px ui-monospace,monospace;margin:0 0 9px}h2{font-size:17px;margin:0 0 10px}p{color:#c5c8ae;margin:5px 0 16px;line-height:1.5}small{color:#c5c8ae}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.block{background:#213e33;border:1px solid #677759;padding:10px;text-align:center}.names,.pair{display:flex;justify-content:space-around;gap:8px}.names{font-size:12px;margin:8px 0}.pair>div{display:flex;justify-content:center;align-items:flex-end;flex:1}.pair canvas{display:block;image-rendering:pixelated}.enlarged{background:repeating-conic-gradient(#213e33 0% 25%,#254237 0% 50%) 0 0/16px 16px}.native{margin-top:12px;border-top:1px solid #536b50;padding-top:12px}.native canvas{background:#304b3c}.controls{margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:12px;border:1px solid #677759}.controls p{max-width:650px;margin:0}.control-pair{display:flex;align-items:center;gap:18px}.section{margin-top:20px}.mobile-grid{display:flex;gap:16px;justify-content:center}.mobile-wrap{text-align:center}.mobile-art{position:relative;width:${mobile.width}px;height:${mobile.height}px;overflow:hidden;border:2px solid #bda264;background:linear-gradient(#f5e6bed9,#e3ca94c9),url('${images.backdrop}') center/cover;image-rendering:pixelated}.mobile-art canvas{position:absolute;left:${c.left-2}px;top:${c.top-2}px;width:${c.width}px;height:${c.height}px;padding:${c.paddingTop}px 0 ${c.paddingBottom}px;image-rendering:pixelated}.timer{position:absolute;right:10px;top:10px;width:86px;height:86px;border:3px solid #edbd66;border-radius:50%;background:#15382f;color:#fff0c2;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 2px #15382f;font-weight:800;font-size:52px;line-height:.95;letter-spacing:-2px}.timer small{font-size:10px;letter-spacing:1px;color:#fff0c2}.note{position:absolute;bottom:3px;left:0;width:100%;font-size:8px;line-height:12px;background:#f1e4bc;color:#203a30}.footer{border-top:1px solid #677759;padding-top:12px;margin-top:18px;font-size:12px}
 </style><div class="sheet"><h1>LITTLE STRIDES / PHYSIQUE PROTOTYPE</h1><p>Review only · Beginner unchanged · Veteran body study · Two poses, one body beneath separate adventure/workout equipment.<br>Same face, hair, palette, height and legs. Fictional character development, unrelated to measured changes in the player.</p><div class="grid">${categories.map(([name,outfit,pose])=>`<div class="block"><h2>${name}</h2><div class="names"><span>Beginner</span><span>Veteran study</span></div>${pair(outfit,pose,'enlarged',192,256)}<div class="names native"><span>48 × 64 · actual village scale</span></div>${pair(outfit,pose,'',48,64)}</div>`).join('')}</div>
 <div class="controls"><p><b>Body-only silhouette check · no stage equipment or colour cues</b><br>Unlabelled pairs use identical neutral fill; the shoulder/arm difference must survive at native 48 × 64. Idle at left, march at right. Order matches above.</p><div class="control-pair">${[0,1].map(p=>pair('silhouette',p,'',48,64)).join('')}</div><p><b>Same workout trim on both bodies</b><br>This control removes even the small stage seam differences. Same order, native village scale.</p><div class="control-pair">${[0,1].map(p=>pair('control',p,'',48,64)).join('')}</div></div>
 <div class="section"><h2>Actual workout artwork size · 375 × 667 portrait reference</h2><p>Measured from the existing app, with unchanged framing and countdown. Each crop is ${mobile.width} × ${Number(mobile.height.toFixed(2))} CSS px; avatar box ${c.width} × ${Number(c.height.toFixed(2))} px including existing padding. View at 100% for scale.</p><div class="mobile-grid">${[0,1].flatMap(p=>[0,1].map(row=>`<div class="mobile-wrap"><div class="names">${p?'March':'Idle'} · ${row?'Veteran study':'Beginner'}</div><div class="mobile-art"><canvas data-outfit="workout" data-pose="${p}" data-row="${row}" width="96" height="128"></canvas><div class="timer">45<small>SEC</small></div><span class="note">Art comparison only · no exercise approval or gameplay change</span></div></div>`)).join('')}</div></div>
 <p class="footer">Prototype is not loaded by the app. Shoulders/chest widen and taper to the original waist; arm mass increases without changing head, limb lengths or foot anchor.<br>Manual elbow/sleeve and scarf/cloak fitting still need review before a full pose rollout. No changes to the core study or live progression.</p></div>
 <script>const sources=${JSON.stringify(images)};const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});Promise.all(Object.entries(sources).map(async([k,v])=>[k,await load(v)])).then(entries=>{const images=Object.fromEntries(entries);for(const c of document.querySelectorAll('canvas')){const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const kind=c.dataset.outfit;ctx.drawImage(images[kind==='silhouette'?'body':kind],Number(c.dataset.pose)*96,Number(c.dataset.row)*128,96,128,0,0,96,128);if(kind==='silhouette'){ctx.globalCompositeOperation='source-in';ctx.fillStyle='#f6e8be';ctx.fillRect(0,0,96,128);}}document.body.dataset.ready='true'});</script>`;
 writeFileSync(dir+'/comparison.html',html);await page.setContent(html);await page.locator('body[data-ready=true]').waitFor();await page.locator('.sheet').screenshot({path:dir+'/comparison.png'});
 writeFileSync(dir+'/prototype.json',JSON.stringify({integrated:false,characterId:'hearthwood-wayfarer',source:master,frame:{width:96,height:128,feetY:120},poses:['stand','march'],rows:['beginner-unchanged','veteran-study'],palette:'../../palette.gpl',mobileReference:reference,measurements},null,2)+'\n');
 console.log(JSON.stringify(measurements));console.log('Saved review-only comparison, atlases and metadata. Live progression unchanged.');
}finally{await browser.close();}
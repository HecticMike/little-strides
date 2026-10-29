import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
process.env.LS_BUILD_PROFILE='comeback';
const p=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--mode','comeback'],{stdio:'inherit',windowsHide:true,env:process.env});
if(p.status!==0)process.exit(p.status||1);
// Install/launch identity belongs to this profile; legacy source assets stay intact.
const description='Short, core-led workouts and a personal comeback, at your own pace.';
const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));
Object.assign(manifest,{description,background_color:'#f5eddd',theme_color:'#f5eddd'});
writeFileSync('dist/manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
const html=readFileSync('dist/index.html','utf8').replace('content="#112d26"','content="#f5eddd"').replace('background:#112d26;color:#fff0c2','background:#f5eddd;color:#243c42').replace(/(<meta name="description" content=")[^"]*/,(_,prefix)=>prefix+description).replace('Preparing your village','Preparing your session');
writeFileSync('dist/index.html',html);
await import('./cache-manifest.mjs');
// Shared, Phaser-independent scene composition. Coordinates are logical world pixels.
export const PROP_FRAME=96;
export const sceneryTime=(date=new Date())=>date.getHours()>=18||date.getHours()<7?'evening':'morning';
const cache=new Map();
export function loadArt(path){if(!cache.has(path))cache.set(path,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>{cache.delete(path);reject(new Error('Artwork unavailable'));};i.src=path;}));return cache.get(path);}
export function worldProps(world){
 const has=id=>world.projects?.find(p=>p.id===id),props=[];
 if(has('banner'))props.push({id:'banner',frame:has('banner').choice==='star'?1:0,x:275,y:75,texture:'chapter-banner'});
 if(has('garden'))props.push({id:'garden',frame:has('garden').choice==='ferns'?3:2,x:84,y:202});
 if(has('lanterns'))props.push({id:'lantern-left',frame:4,x:103,y:90},{id:'lantern-right',frame:4,x:254,y:168});
 if(has('board'))props.push({id:'board',frame:5,x:99,y:83});
 if(world.workshop.stage)props.push({id:'rowan',frame:6,x:230,y:78,size:64});
 if(has('gathering'))props.push({id:'table',frame:8,x:229,y:118},{id:'mira',frame:7,x:253,y:105,size:64});
 return props;
}
export function drawProp(ctx,atlas,frame,x,y,size=48){ctx.drawImage(atlas,frame%4*96,Math.floor(frame/4)*96,96,96,x,y,size,size);}
export function drawLighting(ctx,world,time){
 if(time!=='evening')return;
 // Restrained, translucent local light pools; no blanket colour grading.
 for(const [x,y] of [[231,104],...(world.projects?.some(p=>p.id==='lanterns')?[[125,125],[272,192]]:[])]){
  ctx.fillStyle='rgba(255,207,109,.10)';ctx.fillRect(x-9,y-4,18,13);ctx.fillStyle='rgba(255,225,155,.17)';ctx.fillRect(x-4,y-1,8,7);
 }
}
export async function sceneImage(world,count=0,time=sceneryTime()){
 const [ground,context,buildings,foreground,props,banner]=await Promise.all(['village-ground','workshop-context','buildings','village-foreground','chapter-props','chapter-banner'].map(name=>loadArt('./art/'+name+'.png')));
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=288;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 ctx.drawImage(ground,0,0,320,288);ctx.drawImage(context,180,12,140,150);ctx.drawImage(buildings,(world.workshop.stage?2:1)*280,0,280,300,180,12,140,150);
 for(const prop of worldProps(world)){if(prop.texture==='chapter-banner')ctx.drawImage(banner,prop.frame*60,0,60,64,prop.x,prop.y,30,32);else drawProp(ctx,props,prop.frame,prop.x,prop.y,prop.size||48);}
 ctx.drawImage(foreground,0,0,320,288);drawLighting(ctx,world,time);return canvas;
}

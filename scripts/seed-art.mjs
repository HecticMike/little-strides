import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
// Deterministic, original pixel artwork. This seeds editable Aseprite masters;
// normal export/build never regenerates or overwrites those masters.
import { PALETTE as PAL } from '../src/art-spec.mjs';
const rgba = color => color ? [...color.replace('#','').match(/../g).map(v=>parseInt(v,16)),255] : [0,0,0,0];
export class Pixels {
  constructor(w,h){this.w=w;this.h=h;this.data=new Uint8Array(w*h*4);}
  p(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<this.w&&y<this.h)this.data.set(rgba(c),(y*this.w+x)*4);}
  rect(x,y,w,h,c){for(let j=Math.floor(y);j<y+h;j++)for(let i=Math.floor(x);i<x+w;i++)this.p(i,j,c);}
  line(x,y,a,b,c,width=1){const n=Math.max(Math.abs(a-x),Math.abs(b-y),1);for(let i=0;i<=n;i++)this.rect(Math.round(x+(a-x)*i/n),Math.round(y+(b-y)*i/n),width,width,c);}
  poly(points,c){let min=Math.min(...points.map(p=>p[1])),max=Math.max(...points.map(p=>p[1]));for(let y=min;y<=max;y++){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)this.rect(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,c);}}
  ellipse(x,y,rx,ry,c){for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx)+j*j/(ry*ry)<=1)this.p(x+i,y+j,c);}
  blit(other,x,y){for(let j=0;j<other.h;j++)for(let i=0;i<other.w;i++){const n=(j*other.w+i)*4;if(other.data[n+3])this.data.set(other.data.slice(n,n+4),((y+j)*this.w+x+i)*4);}}
  save(file){const crc=b=>{let n=-1;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^-1)>>>0;};const chunk=(n,d)=>{const name=Buffer.from(n),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(d.length);sum.writeUInt32BE(crc(Buffer.concat([name,d])));return Buffer.concat([len,name,d,sum]);};const raw=Buffer.alloc((this.w*4+1)*this.h);for(let y=0;y<this.h;y++)raw.set(this.data.slice(y*this.w*4,(y+1)*this.w*4),y*(this.w*4+1)+1);const header=Buffer.alloc(13);header.writeUInt32BE(this.w);header.writeUInt32BE(this.h,4);header[8]=8;header[9]=6;writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
}
const P=PAL;
const poses=['stand','march','squat','push','calf','reach','lying'];
const body=new Pixels(48*poses.length,64), details=new Pixels(48*poses.length,64);
function character(pose){
 const s=new Pixels(48,64);const dy=pose==='squat'?10:pose==='calf'?-3:0;
 const rect=(x,y,w,h,c)=>s.rect(x,y+dy,w,h,c),line=(x,y,a,b,c,w)=>s.line(x,y+dy,a,b+dy,c,w),poly=(pts,c)=>s.poly(pts.map(([x,y])=>[x,y+dy]),c);
 // Outlined segmented limbs, sharing the same lengths and palette.
 const limb=(a,b,c,color,light,width=5)=>{line(...a,...b,P.ink,width+2);line(a[0]+1,a[1],b[0]+1,b[1],color,width);line(a[0]+1,a[1],b[0]+1,b[1],light,1);if(c){line(...b,...c,P.ink,width+2);line(b[0]+1,b[1],c[0]+1,c[1],color,width);line(b[0]+1,b[1],c[0]+1,c[1],light,1);}};
 if(pose==='lying'){
  // Non-instructional identity study; no workout is mapped to this frame.
  s.ellipse(24,57,22,2,P.deep);s.rect(5,38,13,13,P.ink);s.rect(7,39,10,10,P.skin);s.rect(4,36,11,6,P.hair);s.line(8,37,14,37,P.hairLight);s.rect(13,42,2,2,P.ink);s.rect(17,42,15,9,P.ink);s.rect(18,43,12,6,P.teal);s.line(19,43,29,43,P.tealLight);s.rect(30,45,13,6,P.wood);s.rect(39,46,8,5,P.ink);s.line(19,47,28,52,P.skin,3);s.line(21,40,30,38,P.skin,3);const standing=character('stand');for(let yy=0;yy<24;yy++)for(let xx=0;xx<20;xx++){const n=((yy+1)*standing.w+xx+12)*4;if(standing.data[n+3])s.data.set(standing.data.slice(n,n+4),((31+xx)*s.w+23-yy)*4);}return s;
 }
 // Legs bend in the squat and alternate in the march. No pose borrows a body identity.
 if(pose==='squat'){
  limb([17,39],[8,42],[13,49],P.wood,P.woodLight,5);limb([27,39],[36,42],[31,49],P.wood,P.woodLight,5);
  s.rect(12,59,9,4,P.ink);s.rect(30,59,10,4,P.ink);s.rect(13,59,6,1,P.amber);s.rect(31,59,6,1,P.amber);
 }else{
  limb([18,39],[16,46],[pose==='march'?10:16,pose==='march'?51:54],P.wood,P.woodLight,5);
  limb([26,39],[pose==='march'?31:26,46],[pose==='march'?33:26,54],P.wood,P.woodLight,5);
  rect(pose==='march'?9:14,53,10,6,P.ink);rect(pose==='march'?32:25,53,10,6,P.ink);
  rect(pose==='march'?10:15,53,6,2,P.woodLight);rect(pose==='march'?33:26,53,6,2,P.woodLight);
  rect(pose==='march'?9:14,59,11,1,P.sand);rect(pose==='march'?32:25,59,11,1,P.sand);
 }
 // Rear arm before torso.
 if(pose==='reach')limb([15,26],[8,18],[12,7],P.skin,P.skinLight,4);
 else if(pose==='push')limb([15,26],[23,27],[35,24],P.skin,P.skinLight,4);
 else if(pose==='squat')limb([15,26],[10,29],[13,35],P.skin,P.skinLight,4);
 else limb([15,26],[10,33],[10,40],P.skin,P.skinLight,4);
 poly([[16,23],[26,22],[31,27],[30,40],[26,44],[14,42],[13,28]],P.ink);
 poly([[17,24],[26,24],[29,28],[28,40],[25,42],[15,40],[15,28]],P.teal);
 poly([[17,26],[20,26],[19,37],[16,38]],P.tealLight);
 rect(22,29,5,10,'#31575c');line(16,35,18,36,P.tealLight);line(25,38,27,36,P.deep);
 // Leather belt, buckle and pouch.
 rect(14,39,16,3,P.wood);rect(14,39,14,1,P.amber);rect(22,39,3,3,P.gold);rect(23,40,1,1,P.ink);rect(14,41,5,5,P.wood);rect(15,42,4,1,P.woodLight);
 // Neck, face and recognisable auburn fringe.
 rect(20,18,7,6,P.skinShadow);rect(21,19,5,4,P.skin);
 poly([[15,7],[25,5],[31,10],[31,19],[27,24],[19,24],[14,19],[13,12]],P.ink);
 poly([[17,9],[25,8],[29,11],[29,18],[26,22],[20,22],[16,18]],P.skin);
 rect(17,11,3,7,P.skinLight);rect(20,9,7,3,P.skinLight);rect(27,16,4,3,P.skin);rect(26,20,2,1,P.skinShadow);
 rect(22,14,2,3,P.ink);rect(23,14,1,1,P.white);rect(28,14,1,2,P.ink);rect(22,12,3,1,P.hair);rect(27,12,2,1,P.hair);
 rect(24,19,3,1,P.hair);rect(18,18,2,1,P.skinShadow);
 poly([[13,10],[14,5],[18,2],[26,2],[30,6],[30,11],[25,9],[23,11],[21,8],[18,12],[16,11],[16,18],[13,16]],P.hair);
 line(16,5,23,4,P.hairLight,2);line(16,8,18,6,P.amber);line(23,5,27,7,P.hairLight);rect(13,12,2,4,P.hairLight);
 // Ochre scarf is a permanent identity cue in every pose/stage.
 poly([[17,22],[23,23],[28,21],[29,24],[23,27],[17,25]],P.amber);
 line(18,23,23,25,P.gold);line(24,24,28,23,P.sand);rect(16,25,3,8,P.amber);rect(16,26,1,6,P.gold);
 if(pose==='reach')limb([29,26],[35,17],[30,7],P.skin,P.skinLight,4);
 else if(pose==='push')limb([29,26],[34,27],[40,22],P.skin,P.skinLight,4);
 else if(pose==='march')limb([29,26],[34,30],[32,21],P.skin,P.skinLight,4);
 else if(pose==='squat')limb([29,26],[36,29],[35,35],P.skin,P.skinLight,4);
 else limb([29,26],[32,33],[30,40],P.skin,P.skinLight,4);
 // Short sleeves overlap the shoulder joints.
 if(pose!=='reach'){rect(28,25,5,5,P.teal);line(28,25,31,26,P.tealLight);}else{rect(29,23,4,4,P.teal);rect(30,23,2,1,P.tealLight);}
 rect(14,25,4,5,P.teal);rect(14,25,2,3,P.tealLight);
 if(pose==='push'){s.rect(46,12,2,51,P.wood);s.line(47,12,47,62,P.woodLight);}
 return s;
}
poses.forEach((p,i)=>body.blit(character(p),i*48,0));
mkdirSync('art/source',{recursive:true});mkdirSync('public/art',{recursive:true});mkdirSync('art/seed',{recursive:true});
body.save('art/seed/hero-body.png');
// Stage decoration is separate and never alters hair, skin or body proportions.
const equipment=new Pixels(48*poses.length,64*2);
poses.forEach((pose,i)=>{
 if(pose==='lying')return;
 const x=i*48,dy=pose==='squat'?10:pose==='calf'?-3:0;
 for(let stage=0;stage<2;stage++){
  const y=stage*64+dy;
  equipment.rect(x+15,y+27,3,11,P.wood);equipment.line(x+16,y+27,x+16,y+36,P.amber);
  equipment.rect(x+26,y+37,5,4,P.ink);equipment.rect(x+27,y+38,3,2,P.gold);
  if(stage===1){equipment.poly([[x+14,y+25],[x+18,y+24],[x+20,y+27],[x+17,y+30],[x+13,y+29]],P.ink);equipment.rect(x+15,y+25,3,3,P.blueLight);equipment.rect(x+15,y+25,2,1,P.white);equipment.rect(x+25,y+25,5,3,P.gold);equipment.rect(x+26,y+25,2,1,P.white);}
 }
});equipment.save('art/seed/hero-equipment.png');
// Tile atlas: clustered grass, path, cobbles, water and training sand.
const tiles=new Pixels(16*8,16);
for(let k=0;k<8;k++){
 const base=k<3?P.grass:k===3?P.sand:k===4?P.light:k===5?P.blue:k===6?P.wood:P.deep;
 tiles.rect(k*16,0,16,16,base);
 for(let i=0;i<14;i++){
  const x=(i*7+k*3)%16,y=(i*11+k*5)%16;
  const col=k<3?(i%3?P.leaf:P.light):k===3?(i%2?P.cream:P.amber):k===5?(i%2?P.blueLight:P.teal):P.moss;
  tiles.rect(k*16+x,y,i%5===0?3:1,1,col);
  if(k<3&&i%6===0)tiles.p(k*16+x,y-1,P.light);
 }
 if(k===4)for(let y=0;y<16;y+=5)for(let x=0;x<16;x+=7){tiles.line(k*16+x,y,k*16+x+5,y,P.moss);tiles.p(k*16+x,y+1,P.pine);}
}
tiles.save('art/seed/tiles.png');
// Static scenery is authored at a 16px tile grid; foreground uses alpha layers.
const scene=new Pixels(320,288),front=new Pixels(320,288);
function tile(target,k,x,y){for(let a=0;a<16;a++)for(let b=0;b<16;b++){const n=(b*tiles.w+k*16+a)*4;target.data.set(tiles.data.slice(n,n+4),((y+b)*target.w+x+a)*4);}}
for(let y=0;y<288;y+=16)for(let x=0;x<320;x+=16)tile(scene,(x/16+y/16*3)%3,x,y);
// A winding lane with softened pixel shoulders, stone plaza and side entrances.
for(let y=0;y<18;y++)for(let x=0;x<20;x++){
 const path=(x>=8&&x<=11)||(y>=10&&y<=12&&x>=3&&x<=16)||(y>=12&&y<=15&&x>=3&&x<=6);
 if(path)tile(scene,3,x*16,y*16);
 if(x>=7&&x<=12&&y>=8&&y<=12)tile(scene,4,x*16,y*16);
}
for(let i=0;i<75;i++){const x=(i*37)%320,y=(i*71)%288;if((x<119||x>193)&&y>40&&y<260){scene.line(x,y,x+2,y,P.light);if(i%5===0){scene.p(x+1,y-2,P.cream);scene.p(x+1,y-1,P.amber);}}}
function tree(target,x,y,seed=0){
 target.ellipse(x+23,y+56,25,8,P.leaf);target.rect(x+18,y+30,9,28,P.ink);target.rect(x+19,y+31,6,25,P.wood);target.line(x+20,y+36,x+20,y+53,P.woodLight);target.line(x+22,y+46,x+30,y+35,P.wood,3);
 target.poly([[x+4,y+35],[x,y+24],[x+4,y+14],[x+12,y+11],[x+15,y+2],[x+31,y],[x+41,y+10],[x+45,y+23],[x+40,y+38],[x+27,y+44],[x+12,y+41]],P.ink);
 target.ellipse(x+23,y+23,21,19,P.pine);target.ellipse(x+19,y+18,16,16,P.leaf);target.ellipse(x+17,y+12,12,9,P.grass);
 for(let i=0;i<90;i++){const xx=(i*11+seed)%39,yy=(i*17+seed*3)%33;if((xx-20)**2/390+(yy-18)**2/250<1){target.rect(x+xx+2,y+yy+2,i%4===0?3:2,1,i%3?P.leaf:P.light);if(i%8===0)target.p(x+xx+1,y+yy+3,P.pine);}}
}
[[0,-8],[41,-17],[82,-18],[191,-22],[235,-14],[277,-5],[-24,86],[283,79],[-27,173],[283,174]].forEach(([x,y],i)=>tree(scene,x,y,i));
function fence(target,x,y,w){for(let i=0;i<w;i+=12){target.rect(x+i,y-7,4,17,P.ink);target.rect(x+i+1,y-7,2,15,P.woodLight);target.p(x+i+1,y-8,P.cream);}target.rect(x,y-3,w,3,P.wood);target.rect(x,y+4,w,3,P.wood);target.line(x,y-3,x+w-1,y-3,P.sand);}
fence(scene,16,222,92);fence(scene,215,231,77);
// Small garden with individual furrows, seedlings, stone border and flowers.
scene.rect(31,231,73,37,P.ink);scene.rect(33,233,69,33,P.wood);
for(let row=0;row<3;row++){scene.rect(35,235+row*10,65,2,P.woodLight);for(let col=0;col<7;col++){const x=38+col*9,y=240+row*9;scene.line(x,y,x-2,y-3,P.leaf);scene.line(x,y,x+3,y-4,P.light);}}
// Training patch, crates, barrels, stepping stones, lanterns.
scene.ellipse(251,198,27,14,P.sand);scene.ellipse(251,196,23,11,P.cream);scene.line(233,195,269,195,P.sand);scene.line(251,187,251,206,P.sand);
function barrel(t,x,y){t.ellipse(x+6,y+13,8,3,P.deep);t.rect(x,y,12,14,P.ink);t.rect(x+1,y,10,13,P.woodLight);for(let i=3;i<11;i+=3)t.line(x+i,y+2,x+i,y+11,P.wood);t.rect(x,y+3,12,2,P.blue);t.rect(x,y+10,12,2,P.blue);t.line(x+2,y,x+9,y,P.sand);}
barrel(scene,22,168);barrel(scene,298,153);
for(let i=0;i<4;i++){scene.ellipse(152+i%2*15,240+i*11,7,3,P.pine);scene.ellipse(151+i%2*15,239+i*11,7,3,P.light);scene.line(148+i%2*15,238+i*11,153+i%2*15,238+i*11,P.moss);}
function lamp(t,x,y){t.rect(x+3,y+9,2,24,P.ink);t.rect(x,y,8,13,P.ink);t.rect(x+1,y+2,6,8,P.amber);t.rect(x+2,y+3,4,6,P.gold);t.rect(x+3,y+3,2,4,P.white);t.rect(x-1,y+11,10,2,P.wood);}
lamp(scene,116,146);lamp(scene,196,146);
// Flowering shrubs and foreground canopy establish depth without hiding the lane.
for(const [x,y] of [[14,192],[272,211],[98,206],[210,264]]){scene.ellipse(x,y,10,6,P.pine);scene.ellipse(x-2,y-2,7,4,P.leaf);for(let i=0;i<4;i++){scene.p(x-5+i*3,y-3+i%2,P.gold);scene.p(x-5+i*3,y-4+i%2,P.cream);}}
tree(front,-26,244,8);tree(front,277,244,10);
scene.save('art/seed/village-ground.png');front.save('art/seed/village-foreground.png');
// Houses use a shared roof/wall language, with tile seams, framing and cast shade.
const buildings=new Pixels(96*3,112);
function house(offset,workshop=false,restored=false){
 const t=buildings,x=offset;
 t.ellipse(x+49,104,43,6,P.deep);t.rect(x+14,54,68,47,P.ink);t.rect(x+17,56,62,41,P.cream);t.rect(x+17,89,62,9,P.sand);
 // Stone foundations and timber construction.
 for(let y=90;y<99;y+=4)for(let xx=17;xx<79;xx+=9){t.line(x+xx+(y%8?3:0),y,x+xx+6+(y%8?3:0),y,P.woodLight);}
 [18,44,76].forEach(a=>{t.rect(x+a,56,3,37,P.wood);t.line(x+a,57,x+a,88,P.amber);});t.rect(x+17,70,62,3,P.wood);t.line(x+20,58,x+40,69,P.wood,2);t.line(x+48,69,x+75,57,P.wood,2);
 // Shingled roof built in staggered rows over an outlined silhouette.
 t.poly([[x+3,54],[x+15,42],[x+23,26],[x+73,26],[x+81,42],[x+93,54],[x+89,60],[x+7,60]],P.ink);
 t.poly([[x+8,53],[x+19,41],[x+26,28],[x+70,28],[x+78,42],[x+88,53]],workshop&&!restored?P.blue:P.roof);
 for(let row=0;row<5;row++){
  const yy=30+row*5,left=25-row*3,right=71+row*3;
  for(let xx=left;xx<right;xx+=9){t.line(x+xx,yy,x+Math.min(right,xx+7),yy,workshop&&!restored?P.blueLight:P.roofLight);t.line(x+xx,yy+1,x+xx-2,yy+4,workshop&&!restored?P.teal:P.brick);t.p(x+xx+3,yy+3,workshop&&!restored?P.blueLight:P.amber);}
 }
 t.line(x+8,54,x+88,54,P.woodLight);t.line(x+10,57,x+86,57,P.wood);t.line(x+26,27,x+70,27,P.sand);
 t.rect(x+62,13,12,22,P.ink);t.rect(x+64,14,8,18,P.brick);for(let y=17;y<31;y+=4)t.line(x+64,y,x+71,y,P.roofLight);t.rect(x+60,12,16,4,P.wood);t.line(x+61,12,x+74,12,P.cream);
 // Recessed arch door and windows with shutters.
 t.poly([[x+38,98],[x+38,81],[x+41,77],[x+48,75],[x+55,78],[x+58,82],[x+58,98]],P.ink);t.rect(x+41,82,14,16,P.wood);t.poly([[x+41,82],[x+44,78],[x+50,78],[x+54,82]],P.woodLight);t.line(x+44,82,x+44,96,P.amber);t.line(x+49,82,x+49,96,P.deep);t.rect(x+51,88,2,2,P.gold);t.rect(x+36,98,25,4,P.light);t.line(x+37,98,x+59,98,P.cream);
 for(const wx of [24,61]){t.rect(x+wx,76,11,11,P.ink);t.rect(x+wx+1,77,9,8,restored?P.gold:P.blue);t.rect(x+wx+2,78,3,3,restored?P.white:P.blueLight);t.line(x+wx+5,77,x+wx+5,84,P.wood);t.line(x+wx+1,81,x+wx+9,81,P.wood);t.rect(x+wx-3,76,3,11,P.woodLight);t.rect(x+wx+11,76,3,11,P.wood);t.rect(x+wx-2,87,15,2,P.wood);}
 if(!workshop||restored){for(let i=0;i<9;i++){t.p(x+18+i*2,88,P.leaf);if(i%2===0)t.rect(x+18+i*2,86,2,2,P.gold);}}
 if(workshop){t.rect(x+79,66,13,12,P.ink);t.rect(x+80,67,11,9,P.woodLight);t.rect(x+84,65,2,3,P.wood);t.rect(x+84,69,2,5,P.cream);t.rect(x+82,70,6,2,P.cream);}
 if(restored){t.line(x+12,32,x+12,57,P.woodLight,2);t.poly([[x+14,32],[x+27,34],[x+22,42],[x+14,40]],P.teal);t.line(x+15,33,x+24,35,P.tealLight);t.rect(x+78,93,11,6,P.wood);t.rect(x+80,90,2,4,P.leaf);t.rect(x+84,89,2,5,P.leaf);t.p(x+84,88,P.gold);}
}
house(0);house(96,true);house(192,true,true);buildings.save('art/seed/buildings.png');
// Quiet workout scene and Today vista; both use the same world palette and tiles.
const training=new Pixels(160,112);training.rect(0,0,160,112,P.deep);for(let y=0;y<112;y+=16)for(let x=0;x<160;x+=16)tile(training,y<48?2:3,x,y);training.rect(0,0,160,43,P.pine);for(let i=0;i<40;i++){training.rect(i*29%160,i*13%42,3,1,i%2?P.leaf:P.grass);}training.rect(0,43,160,2,P.leaf);training.ellipse(80,96,42,8,P.amber);training.ellipse(80,94,41,7,P.sand);training.save('art/seed/training.png');
const vista=new Pixels(320,144);vista.rect(0,0,320,144,P.blue);vista.rect(0,26,320,118,P.tealLight);vista.ellipse(245,27,14,14,P.cream);
vista.poly([[0,65],[45,25],[82,56],[124,17],[168,61],[215,29],[265,64],[290,39],[319,54],[319,144],[0,144]],P.teal);vista.poly([[29,65],[79,40],[113,71],[172,41],[229,77],[280,58],[319,79],[319,144],[0,144]],P.pine);
vista.poly([[0,108],[66,88],[129,104],[201,79],[263,93],[319,84],[319,144],[0,144]],P.leaf);
for(let i=0;i<90;i++){const x=i*43%320,y=105+i*19%39;vista.line(x,y,x+2,y,i%3?P.grass:P.light);}
vista.poly([[127,144],[141,123],[153,111],[163,112],[160,129],[174,144]],P.sand);tree(vista,-10,55,3);tree(vista,268,63,8);fence(vista,0,130,92);fence(vista,235,135,85);vista.save('art/seed/vista.png');
// UI glyph atlas replaces emoji with a consistent 16px inventory icon language.
const icons=new Pixels(16*6,16);const icon=(i,fn)=>{const t=new Pixels(16,16);fn(t);icons.blit(t,i*16,0);};
icon(0,t=>{t.poly([[8,1],[14,8],[8,15],[1,8]],P.ink);t.poly([[8,2],[13,8],[8,13],[3,8]],P.gold);t.line(8,4,6,9,P.cream,2);t.line(8,4,10,9,P.amber,2);});
icon(1,t=>{t.rect(3,7,10,8,P.wood);t.rect(4,8,8,6,P.cream);t.poly([[1,7],[8,1],[15,7]],P.roofLight);t.rect(7,10,3,5,P.ink);t.rect(4,10,2,2,P.gold);});
icon(2,t=>{t.rect(2,2,12,13,P.ink);t.rect(4,2,9,11,P.cream);t.rect(3,2,2,11,P.woodLight);t.line(7,5,11,5,P.amber);t.line(7,8,11,8,P.amber);t.line(7,11,10,11,P.amber);});
icon(3,t=>{t.poly([[4,1],[11,1],[14,4],[14,11],[11,14],[4,14],[1,11],[1,4]],P.woodLight);t.rect(4,4,8,8,P.gold);t.rect(6,6,4,4,P.ink);t.rect(6,0,3,3,P.gold);t.rect(6,13,3,3,P.gold);t.rect(0,6,3,3,P.gold);t.rect(13,6,3,3,P.gold);});
icon(4,t=>{t.rect(7,7,2,8,P.leaf);for(const [x,y] of [[4,3],[9,3],[2,6],[11,6],[4,10],[9,10]])t.rect(x,y,3,3,P.gold);t.rect(6,6,4,4,P.cream);});
icon(5,t=>{t.poly([[4,1],[12,1],[13,8],[8,15],[2,8]],P.ink);t.poly([[5,2],[11,2],[12,8],[8,12],[4,8]],P.gold);t.rect(7,4,2,6,P.cream);t.rect(5,6,6,2,P.cream);});icons.save('art/seed/icons.png');
writeFileSync('art/palette.gpl','GIMP Palette\nName: Little Strides · Hearthwood\nColumns: 8\n'+Object.entries(P).map(([name,color])=>rgba(color).slice(0,3).join(' ')+' '+name).join('\n')+'\n');
console.log('Original pixel-art seed PNGs generated. Import once into Aseprite; art:export preserves manual edits.');
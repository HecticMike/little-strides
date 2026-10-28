import {writeFileSync} from 'node:fs';
const rate=22050;
const cues={selection:[[0,880,.07,.18]],preparation:[[0,440,.16,.23],[.20,660,.22,.2]],completion:[[0,523.25,.24,.22],[.18,659.25,.24,.2],[.36,783.99,.45,.2]],restoration:[[0,180,.075,.24],[.12,220,.075,.21],[.29,880,.38,.2]],ambience:[]};
for(const [name,notes]of Object.entries(cues)){
 const seconds=name==='ambience'?8:Math.max(...notes.map(n=>n[0]+n[2])),samples=Math.ceil(rate*seconds),b=Buffer.alloc(44+samples*2);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++){const t=i/rate;let v=0;
  for(const [at,hz,length,volume]of notes){const dt=t-at;if(dt>=0&&dt<length)v+=Math.sin(2*Math.PI*hz*dt)*Math.min(1,dt/.006)*Math.pow(1-dt/length,2)*volume;}
  if(name==='ambience')v=(Math.sin(2*Math.PI*220*t)*.014+Math.sin(2*Math.PI*330*t)*.008)*(1-Math.cos(2*Math.PI*t/seconds))*.5;
  b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*30000),44+i*2);
 }writeFileSync('public/audio/'+name+'.wav',b);
}

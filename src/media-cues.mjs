// iPhone media playback, using the same local WAVs. PCM gain avoids iOS's
// system-only HTMLAudio volume property; no microphone or background keepalive.
export const isIPhoneAudio=()=>{const n=window.navigator||{};return /iPhone|iPad|iPod/.test(n.userAgent||'')||(n.platform==='MacIntel'&&n.maxTouchPoints>1);};
export function audioDeadline(promise,ms=4000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Audio timed out')),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
export function wavGain(bytes,gain){
 const result=bytes.slice(0),view=new DataView(result);const text=(at,n)=>String.fromCharCode(...new Uint8Array(result,at,n));
 if(view.byteLength<44||text(0,4)!=='RIFF'||text(8,4)!=='WAVE')throw new Error('Unsupported cue');let pcm=false,found=false;
 for(let offset=12;offset+8<=view.byteLength;){const size=view.getUint32(offset+4,true),start=offset+8;if(start+size>view.byteLength)throw new Error('Invalid cue');const type=text(offset,4);
  if(type==='fmt ')pcm=size>=16&&view.getUint16(start,true)===1&&view.getUint16(start+14,true)===16;
  if(type==='data'){if(!pcm||size%2)throw new Error('Unsupported cue');for(let p=start;p<start+size;p+=2)view.setInt16(p,Math.round(view.getInt16(p,true)*Math.max(0,Math.min(1,gain))),true);found=true;}
  offset=start+size+(size%2);
 }if(!found)throw new Error('Cue has no audio');return result;
}
function primeSource(){const bytes=new ArrayBuffer(44+2205*2),v=new DataView(bytes);for(const [at,s]of [[0,'RIFF'],[8,'WAVEfmt '],[36,'data']])for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));v.setUint32(4,bytes.byteLength-8,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,22050,true);v.setUint32(28,44100,true);v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,bytes.byteLength-44,true);return 'data:audio/wav;base64,'+btoa(String.fromCharCode(...new Uint8Array(bytes)));}
export class MediaCues {
 constructor({status=()=>{},interrupt=()=>{},timeout=4000}={}){this.status=status;this.interrupt=interrupt;this.timeout=timeout;this.urls={};this.generation=0;this.preparing=0;this.ready=false;this.unlocked=false;}
 configure(settings){this.settings=settings;if(settings.muted||settings.volume<=0){this.stop();return;}if(this.audio&&this.volume!==settings.volume){this.halt();this.ready=false;const generation=this.generation;void this.prepare(settings.volume).then(ok=>{if(ok&&generation===this.generation&&this.unlocked&&!document.hidden&&!this.settings.muted)this.ready=true;}).catch(()=>{if(generation===this.generation)this.fail();});}}
 halt(){this.expectedPlaying=false;if(this.audio){this.audio.pause();this.audio.loop=false;try{this.audio.currentTime=0;}catch{}}}
 stop(){this.generation++;this.ready=false;this.ambientRequested=false;this.halt();}
 fail(){const interrupted=this.expectedPlaying;this.stop();this.status('Sound unavailable; tap Test sound or Resume to retry');if(interrupted)this.interrupt();}
 async prepare(volume){
  if(this.volume===volume&&this.urls.transition)return true;const request=++this.preparing;
  this.data??=Promise.all(['transition','pace','preparation','completion','selection','restoration'].map(async name=>{try{const r=await fetch('./audio/'+name+'.wav');if(!r.ok)throw new Error('Cue unavailable');return [name,await r.arrayBuffer()];}catch(error){if(['transition','pace'].includes(name)){this.data=null;throw error;}return [name,null];}}));
  const entries=await this.data;if(request!==this.preparing)return false;
  for(const url of Object.values(this.urls))URL.revokeObjectURL(url);this.urls={};
  for(const [name,bytes]of entries)if(bytes)this.urls[name]=URL.createObjectURL(new Blob([wavGain(bytes,volume*(name==='ambience'?.35:1))],{type:'audio/wav'}));this.volume=volume;return true;
 }
 async enable(settings){
  this.settings=settings;this.stop();if(settings.muted||settings.volume<=0){this.status('Sound is off');return false;}const generation=this.generation;
  try{
   if(!this.audio){try{const session=window.navigator?.audioSession;if(session){session.type='playback';session.addEventListener?.('statechange',()=>{if(session.state==='interrupted'){this.stop();this.interrupt();}});}}catch{}this.audio=new window.Audio();this.audio.preload='auto';this.audio.setAttribute?.('playsinline','');this.audio.onended=()=>{this.expectedPlaying=false;};this.audio.onpause=()=>{if(this.expectedPlaying&&!this.audio.ended&&this.audio.paused){this.expectedPlaying=false;this.ready=false;this.interrupt();}};this.audio.onerror=()=>{if(this.audio.error)this.fail();};}
   // Invoke play during the original tap, before fetch/decode/IndexedDB awaits.
   this.audio.src=primeSource();this.audio.muted=false;this.audio.volume=1;
   const priming=this.audio.play();this.status('Preparing sound');
   await audioDeadline(Promise.all([priming,this.prepare(settings.volume)]),this.timeout);
   if(generation!==this.generation||document.hidden)return false;
   this.halt();this.unlocked=true;this.ready=true;this.status('Sound ready');return true;
  }catch{if(generation===this.generation)this.fail();return false;}
 }
 play(name,settings,loop=false){
  if(!this.ready||settings.muted||settings.volume<=0||(name==='pace'&&settings.paceMuted)||document.hidden)return false;
  if(settings.volume!==this.volume){this.configure(settings);return false;}const url=this.urls[name]||(['selection','preparation','completion','restoration'].includes(name)?this.urls.transition:null);if(!url)return false;
  this.halt();const generation=++this.generation;this.audio.src=url;this.audio.loop=loop;this.expectedPlaying=true;this.kind=name;
  try{this.lastPromise=audioDeadline(this.audio.play(),this.timeout).then(()=>generation===this.generation,error=>{if(generation===this.generation)this.fail();return false;});return true;}catch{this.fail();return false;}
 }
 async startAmbience(settings){
  this.ambientRequested=true;const generation=this.generation;
  try{this.ambientData??=fetch('./audio/ambience.wav').then(r=>{if(!r.ok)throw new Error('Ambience unavailable');return r.arrayBuffer();});const [bytes]=await audioDeadline(Promise.all([this.ambientData,this.prepare(settings.volume)]),this.timeout);
   if(!this.ambientRequested||generation!==this.generation||!this.unlocked||document.hidden||settings.muted||!settings.ambience)return;
   if(this.urls.ambience)URL.revokeObjectURL(this.urls.ambience);this.urls.ambience=URL.createObjectURL(new Blob([wavGain(bytes,settings.volume*.35)],{type:'audio/wav'}));this.ready=true;this.play('ambience',settings,true);
  }catch{this.ambientData=null;}
 }
 stopAmbience(){this.ambientRequested=false;if(this.kind==='ambience')this.halt();}
}

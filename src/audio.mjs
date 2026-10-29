import {MediaCues,isIPhoneAudio,audioDeadline} from './media-cues.mjs';
export class Cues {
  context = null;
  buffers = {};
  _settings = { muted: false, volume: 0.45 };
  sources = new Set();
  get settings(){return this._settings;}
  set settings(value){const previous=this._settings;this._settings=value;if(this.media&&(previous.muted!==value.muted||previous.volume!==value.volume))this.media.configure(value);if(value.muted||value.volume<=0)this.stop();}
  status = 'Tap Start to enable sound';
  async enable() {
    if(isIPhoneAudio()&&typeof window.Audio==='function'){this.media??=new MediaCues({status:value=>{this.status=value;},interrupt:()=>this.onInterruption?.()});await this.media.enable(this.settings);return;}
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('unavailable');
      // Web Audio defaults to ambient on iOS and can be silenced by the ringer
      // switch. Request media playback when supported; other browsers ignore it.
      try { if (window.navigator?.audioSession) window.navigator.audioSession.type = 'playback'; } catch {}
      if (!this.context || this.context.state === 'closed') {
        this.context = new Audio();
        this.context.onstatechange = () => {
          if (['suspended', 'interrupted'].includes(this.context.state)) this.onInterruption?.();
        };
      }
      await audioDeadline(this.context.resume());
      await audioDeadline(Promise.all(['transition', 'pace'].map(async name => {
        if (!this.buffers[name]) {
          const r = await fetch(`./audio/${name}.wav`);
          if (!r.ok) throw new Error('Sound unavailable');
          this.buffers[name] = await this.context.decodeAudioData(await r.arrayBuffer());
        }
      })));
      if(!this.extraLoading&&typeof this.context.decodeAudioData==='function')this.extraLoading=Promise.all(['selection','preparation','completion','restoration','ambience'].map(async name=>{const r=await fetch('./audio/'+name+'.wav');if(r.ok)this.buffers[name]=await this.context.decodeAudioData(await r.arrayBuffer());})).catch(()=>{});
      this.status = this.context.state === 'running' ? 'Sound ready' : 'Tap Test sound to retry';
    } catch { this.status = 'Sound unavailable; visual cues stay on'; }
  }
  play(name) {
    if(this.media){const queued=this.media.play(name,this.settings);if(queued)this.lastPlayed=name;return queued;}
    const buffer=this.buffers[name]||(['selection','preparation','completion','restoration'].includes(name)?this.buffers.transition:null);
    if (this.settings.muted || this.settings.volume <= 0 || (name === 'pace' && this.settings.paceMuted) || !this.context || this.context.state !== 'running' || !buffer) return false;
    try {
      const node = this.context.createBufferSource(), gain = this.context.createGain();
      node.buffer = buffer; gain.gain.value = this.settings.volume;
      node.connect(gain); gain.connect(this.context.destination);this.sources.add(node);node.onended=()=>{this.sources.delete(node);node.disconnect?.();gain.disconnect?.();};node.start();
      this.lastPlayed = name;
      return true;
    } catch { this.status = 'Sound unavailable; visual cues stay on'; return false; }
  }
  stop(){if(this.status==='Preparing sound')this.status='Sound paused; tap Test sound or Resume to retry';this.media?.stop();for(const source of this.sources){try{source.stop?.();}catch{}source.disconnect?.();}this.sources.clear();this.stopAmbience();}
  stopAmbience(){this.media?.stopAmbience();if(this.ambientSource){try{this.ambientSource.stop();}catch{}this.ambientSource.disconnect();this.ambientGain.disconnect();this.ambientSource=null;}}
  startAmbience(){
    this.stopAmbience();
    if(this.media){if(this.settings.ambience)void this.media.startAmbience(this.settings);return;}
    if(!this.context||this.context.state!=='running'||this.settings.muted||this.settings.volume<=0||!this.settings.ambience||!this.buffers.ambience)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffers.ambience;source.loop=true;gain.gain.value=this.settings.volume*.35;source.connect(gain);gain.connect(this.context.destination);source.start();this.ambientSource=source;this.ambientGain=gain;
  }
  async test() {
    if (this.settings.muted) return 'Sound is off. Turn Sound on before testing.';
    if (this.settings.volume <= 0) return 'Cue volume is zero. Raise Volume before testing.';
    await this.enable();
    if(this.status!=='Sound ready')return this.status;
    if(!this.play('transition'))return this.status==='Sound ready'?'Sound test did not start. Check Sound on and Volume, then retry.':this.status;
    if(this.media&&!(await this.media.lastPromise))return this.status==='Sound ready'?'Sound test interrupted. Tap Test sound to retry.':this.status;
    // Playback APIs cannot confirm that the phone speaker was audible.
    return 'Test tone sent'+(this.media?' through iPhone media playback':'')+'. If silent, check your phone’s media volume, Silent Mode and Bluetooth output.';
  }
}

export class Cues {
  context = null;
  buffers = {};
  settings = { muted: false, volume: 0.45 };
  status = 'Tap Start to enable sound';
  async enable() {
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
      await this.context.resume();
      await Promise.all(['transition', 'pace'].map(async name => {
        if (!this.buffers[name]) {
          const r = await fetch(`./audio/${name}.wav`);
          if (!r.ok) throw new Error('Sound unavailable');
          this.buffers[name] = await this.context.decodeAudioData(await r.arrayBuffer());
        }
      }));
      if(!this.extraLoading&&typeof this.context.decodeAudioData==='function')this.extraLoading=Promise.all(['selection','preparation','completion','restoration','ambience'].map(async name=>{const r=await fetch('./audio/'+name+'.wav');if(r.ok)this.buffers[name]=await this.context.decodeAudioData(await r.arrayBuffer());})).catch(()=>{});
      this.status = this.context.state === 'running' ? 'Sound ready' : 'Tap Test sound to retry';
    } catch { this.status = 'Sound unavailable; visual cues stay on'; }
  }
  play(name) {
    const buffer=this.buffers[name]||(['selection','preparation','completion','restoration'].includes(name)?this.buffers.transition:null);
    if (this.settings.muted || this.settings.volume <= 0 || (name === 'pace' && this.settings.paceMuted) || !this.context || this.context.state !== 'running' || !buffer) return false;
    try {
      const node = this.context.createBufferSource(), gain = this.context.createGain();
      node.buffer = buffer; gain.gain.value = this.settings.volume;
      node.connect(gain); gain.connect(this.context.destination); node.start();
      this.lastPlayed = name;
      return true;
    } catch { this.status = 'Sound unavailable; visual cues stay on'; return false; }
  }
  stopAmbience(){if(this.ambientSource){try{this.ambientSource.stop();}catch{}this.ambientSource.disconnect();this.ambientGain.disconnect();this.ambientSource=null;}}
  startAmbience(){
    this.stopAmbience();
    if(!this.context||this.context.state!=='running'||this.settings.muted||this.settings.volume<=0||!this.settings.ambience||!this.buffers.ambience)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffers.ambience;source.loop=true;gain.gain.value=this.settings.volume*.35;source.connect(gain);gain.connect(this.context.destination);source.start();this.ambientSource=source;this.ambientGain=gain;
  }
  async test() {
    if (this.settings.muted) return 'Sound is off. Turn Sound on before testing.';
    if (this.settings.volume <= 0) return 'Cue volume is zero. Raise Volume before testing.';
    await this.enable();
    if (this.status !== 'Sound ready' || !this.play('transition')) return this.status;
    // Playback APIs cannot confirm that the phone speaker was audible.
    return 'Test tone sent. If silent, check your phone’s media volume, Silent Mode and Bluetooth output.';
  }
}

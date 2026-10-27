export class Cues {
  context = null;
  buffers = {};
  settings = { muted: false, volume: 0.45 };
  status = 'Tap Start to enable sound';
  async enable() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('unavailable');
      if (!this.context) {
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
      this.status = this.context.state === 'running' ? 'Sound ready' : 'Tap Test sound to retry';
    } catch { this.status = 'Sound unavailable; visual cues stay on'; }
  }
  play(name) {
    if (this.settings.muted || (name === 'pace' && this.settings.paceMuted) || !this.context || this.context.state !== 'running' || !this.buffers[name]) return;
    const node = this.context.createBufferSource(), gain = this.context.createGain();
    node.buffer = this.buffers[name]; gain.gain.value = this.settings.volume;
    node.connect(gain); gain.connect(this.context.destination); node.start();
    this.lastPlayed = name;
  }
}

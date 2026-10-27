export class ScreenLock {
  lock = null;
  wanted = false;
  status = 'Keep your screen awake manually if needed';
  async acquire() {
    this.wanted = true;
    if (!navigator.wakeLock || document.hidden) { this.status = 'Screen lock unavailable; adjust auto-lock if needed'; return; }
    if (this.lock && !this.lock.released) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!this.wanted || document.hidden) { await lock.release(); return; }
      this.lock = lock; this.status = 'Screen stays awake';
      lock.addEventListener('release', () => {
        this.lock = null;
        this.status = 'Screen lock released';
        if (this.wanted && !document.hidden) setTimeout(() => this.acquire(), 1000);
      }, { once: true });
    } catch { this.status = 'Screen lock unavailable; adjust auto-lock if needed'; }
  }
  release() { this.wanted = false; this.lock?.release().catch(() => {}); this.lock = null; }
}

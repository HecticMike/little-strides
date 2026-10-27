export const OFFLINE_SETUP_TIMEOUT = 20_000;
export function watchOffline(onChange, buildId) {
  let disposed = false, registration, installing, checkTimer, timeout;
  const emit = (status, message = '') => { if (!disposed) onChange({ status, message }); };
  const fail = () => emit('error', 'Offline setup failed or timed out. Reconnect, check free storage, then retry. Workouts already saved on this device are retained.');
  const check = async () => {
    try {
      if (registration?.waiting) { clearTimeout(timeout); emit('update', 'Update cached. Close all Little Strides windows and reopen after your workout.'); return; }
      const name = 'little-strides-' + buildId;
      if (!await caches.has(name)) return;
      const cache = await caches.open(name), marker = await cache.match(new URL('./__offline-ready__', location.href).href);
      if (marker && (await marker.json()).buildId === buildId && navigator.serviceWorker.controller) {
        clearTimeout(timeout); emit('ready');
      }
    } catch { fail(); }
  };
  const stateChange = () => { if (installing?.state === 'redundant') fail(); else void check(); };
  const updateFound = () => { installing?.removeEventListener('statechange', stateChange); installing = registration.installing; installing?.addEventListener('statechange', stateChange); stateChange(); };
  if (!('serviceWorker' in navigator) || !('caches' in window) || !window.isSecureContext) {
    emit('error', 'Offline installation requires a browser with service workers and HTTPS (or localhost).');
    return () => { disposed = true; };
  }
  emit('checking'); timeout = setTimeout(fail, OFFLINE_SETUP_TIMEOUT);
  navigator.serviceWorker.addEventListener('controllerchange', check);
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (disposed) return;
    registration = reg; registration.addEventListener('updatefound', updateFound); updateFound();
    checkTimer = setInterval(check, 1000); void check();
    // A failed install leaves no ready worker; never wait indefinitely on .ready.
    if (!reg.active && !reg.installing && !reg.waiting) void reg.update().catch(fail);
  }).catch(fail);
  return () => {
    disposed = true; clearTimeout(timeout); clearInterval(checkTimer);
    installing?.removeEventListener('statechange', stateChange);
    registration?.removeEventListener('updatefound', updateFound);
    navigator.serviceWorker.removeEventListener('controllerchange', check);
  };
}
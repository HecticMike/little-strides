# Little Strides

Mobile-first React/Phaser workout PWA.

```powershell
cd little-strides
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4197` locally. Use HTTPS hosting on a phone; localhost on a phone refers to that phone. Wait for **Offline ready** before disconnecting. iPhone: Safari → Share → Add to Home Screen; Android: Chrome → Install app. The manifest supplies standalone launch colours, regular/maskable icons and an Apple touch icon. The initial HTML supplies a matching loading presentation.

- React owns the workout, countdown, audio controls, journal and backup UI. Portrait baseline is 375 × 667; safe-area padding and a separate landscape workout layout keep controls visible. Today defaults to 10 minutes; navigation has its own reserved row below the scrollable page. Touch targets are at least 44 pixels.
- Plans last exactly 7/10/15/20 minutes, using 45 seconds of movement and 15 seconds of rest. Repetition indicators give a three-second pace; they do not count actual body movements. Pause, skip and replacement are available in place.
- Timers derive from timestamps, never decrement counters. Visibility loss, audio interruption and a timer gap over 2.5 seconds pause the session. Reload always restores a paused checkpoint. Background time earns no activity or rewards. A forced kill can lose approximately the last second since the durable checkpoint.
- IndexedDB atomically stores a versioned local state containing immutable session records with IDs, device origin, performed groups, plan and events. History is independent of any future sync transport. A Web Lock prevents two supported tabs from writing concurrently. Browser implementations without Web Locks should use one tab.
- A simple 24-hour scheduler suggests mobility while recently exercised upper-body/leg groups rest. This is a variety rule, not a physical-readiness assessment. Skipped work gives no growth; completion rewards are derived from saved history, avoiding duplicate grants.
- Sound is local WAV data, unlocked by Start/Resume/Test sound, with persisted mute and volume. Unsupported or denied audio retains visual cues. Wake lock is requested during active exercise, reacquired after a visible release, and released on pause/end; rejection gives manual auto-lock guidance.
- Phaser is loaded only for the small touch-controlled village, capped at 30 fps with pixel rounding and nearest-neighbour rendering. One shared 48 × 64 character body sheet plus stage-equipment sheet supplies the same avatar to React and Phaser; editable Aseprite masters and export commands are documented in [art/README.md](art/README.md). No external fonts, images, CDN scripts or audio are required at runtime.
- Production builds enumerate every asset, including lazy Phaser code and sounds, into a versioned precache. Installation completes only after all assets are cached. Worker updates wait for old clients to close rather than replacing code during a workout.
- Settings exposes validated JSON export/import. Import confirms replacement and restores any session paused. Data is labelled local; exporting requests a file download, never claims a cloud backup. Browser/OS data clearing can remove local progress.

## Checks

```powershell
npm test
npx playwright install chromium webkit
npm run preview   # leave running in a separate terminal
npm run test:mobile
```

Engine tests exhaust all plan boundaries, pause timestamps, restore, skip/replacement, recovery, idempotent history and malformed backups. Mobile tests run touch-enabled WebKit at 375 × 667 and Chromium at 393 × 727. Session tests exercise live pacing and restore near-end checkpoints for each duration; they do not wait through real-time 20-minute workouts. Rotation and artificial safe-area insets, offline reload/village/audio assets, JSON restore, mute/volume, suspension, wake-lock lifecycle and failed local writes are covered.

Windows Playwright WebKit does not expose Web Audio in this environment: tests verify its visual fallback and cached WAV retrieval. Chromium verifies actual Web Audio initialisation, gain and muted playback suppression.

## Physical-device acceptance still required

- iPhone Safari and installed Home Screen app: installation/splash, Dynamic Island/notch and bottom safe area, Safari toolbar resizing, rotation, screen off/on and OS process termination.
- Android Chrome and installed PWA: install presentation, navigation safe area, rotation, wake-lock retention and battery-saver rejection.
- Both: sound audibility and pacing at floor/table distance, mute switch/silent mode/Bluetooth, incoming call and audio interruption, background/foreground and forced termination, explicit resume with no background progress.
- Both: first-install cache completion, airplane-mode relaunch after closing the app, restored history/active session, JSON sharing/import and storage-pressure failure.
- Both: complete real-time 7/10/15/20-minute sessions; comfort and legibility at a distance; low-end-device frame pacing, memory, thermal and battery behaviour. Emulation cannot establish these results.

Next: perform the physical-device checklist before claiming mobile release readiness.

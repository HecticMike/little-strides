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
- All candidates remain clinically unreviewed. Every real movement requires individual persisted opt-in; the old blanket acknowledgement enables nothing. Wall-push and squat stay locked pending exercise/art review. The phone review groups Core & Strength, Cardio & Movement, and Mobility & Recovery, with instructions, joint considerations, individual disable/flag controls and explicit reassessment. Four core candidates with stylised, clinically unvalidated illustrations are individually selectable but disabled by default; modified dead bug remains locked pending physiotherapist-guided variation review. Choose Core-focused on Today or in the exercise-review dialog. See [the NHS research and assessment notes](docs/core_catalogue_review.md).
- Plans last exactly 7/10/15/20 minutes (fresh default 10): 30 seconds of preparation, minutes-minus-one blocks of 45 seconds movement / 15 seconds rest, and 30 seconds wind-down. Existing standing movements use a three-second pace; core candidates are self-paced with no repetition target. Neither counts actual body movements. Pause, skip and replacement are available in place.
- Timers derive from timestamps, never decrement counters. Visibility loss, audio interruption and a timer gap over 2.5 seconds pause the session. Reload always restores a paused checkpoint. Background time earns no activity or rewards. A forced kill can lose approximately the last second since the durable checkpoint.
- IndexedDB atomically stores a versioned local state containing immutable session records with IDs, device origin, performed groups, plan and events. History is independent of any future sync transport. A Web Lock prevents two supported tabs from writing concurrently. Browser implementations without Web Locks should use one tab.
- Rolling scheduling uses actual performed movement, including partial work before skipping/replacement. Default strength recovery is 48 hours from actual loading; repeatable gentle aerobic/mobility work has a 600-second per-exercise rolling 24-hour cap, strengthening a 90-second per-group cap, and combined timed joint exposure a configurable 600-second rolling cap per joint. Shared muscle recovery also applies across movement patterns. These are conservative configurable software heuristics, not validated safety limits or a readiness assessment. Multiple daily sessions are allowed while eligible time remains; otherwise the app offers a supported shorter length or rest, with no recovering-strength filler. Skipped work gives no growth; new rewards require unique completed workout IDs with all scheduled movement time accounted for using selectable movements. Resolving the timeline by skipping work does not count as completion. Existing historical rewards/restorations are preserved. Preview/partial/early-ended sessions grant no timber; preview history also leaves recovery unchanged. These timers do not verify actual body movements.
- Sound is local WAV data, unlocked by Start/Resume/Test sound, with persisted mute and volume and a separate optional pacing-sound preference. Preparation, rest, movement and wind-down transitions remain audible when only pacing is disabled. Unsupported or denied audio retains visual cues. Wake lock is requested during active exercise, reacquired after a visible release, and released on pause/end; rejection gives manual auto-lock guidance.
- Phaser is loaded only for the small touch-controlled village, capped at 30 fps with pixel rounding and nearest-neighbour rendering. One shared 96 x 128 character body sheet plus stage-equipment sheet supplies the same avatar to React and Phaser; editable Aseprite masters and export commands are documented in [art/README.md](art/README.md). No external fonts, images, CDN scripts or audio are required at runtime.
- The village uses touch pathfinding, blocked building/tree/fence cells, approach-before-interaction, and shared stage-aware walk/blink keys. Large building buttons offer the same interaction without precise map taps. One timber buys the existing workshop restoration, stored atomically in IndexedDB before the brief construction effect. Failed saves preserve the timber. Legacy Phase 2 automatic restorations migrate without losing the building.
- Production builds enumerate every asset, including lazy Phaser code and sounds, into a versioned precache. Installation writes a readiness marker only after every asset is cached. The interface verifies that marker and a controlling worker; installation rejection, a failed precache or a 20-second stall shows Offline unavailable with Retry. A waiting update has a separate status. Worker updates wait for old clients to close rather than replacing code during a workout. Hosted sign-in/sign-out/callback routes always reach the network; a cache read failure falls back to network without deleting local history.
- Completion is an optional inline summary: one-tap comfort feedback, optional joint/area selection, and planned-versus-actual movement details. All supplied feedback is saved automatically; Done returns directly to Today. Discomfort reports hold affected movements until explicit reassessment, with a minimum configured joint-discomfort recovery interval. Changing feedback to Comfortable does not silently remove a previous discomfort hold. Reassessment clears the review hold but does not approve or re-enable a movement. No physical repetitions are inferred; records store null for measured repetitions. Legacy records remain readable without invented per-movement precision.
- Journal shows completed sessions today/this week, actual movement minutes by aerobic/strengthening/mobility purpose, recent movements, current restrictions and reported discomfort. Preview time is excluded; old records without movement-level data remain unclassified. Timed aerobic movement does not establish cardiovascular training or clinical improvement.
- Workflow preview uses inert timer cards, not exercise prescriptions. It records no exercise/history/recovery/reward and is not restored or exported as an active session. Existing historical preview records remain intact.
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

## Phase 4 review and physical checks

- Input required: decide which unreviewed march, calf-raise and reach candidates are suitable to enable and whether the configurable load limits fit your circumstances. Wall-push and squat cannot be enabled until their exercise/art review is completed in a later change. This limited catalogue does not provide a full-body strengthening programme.
- Physical iPhone/Android: complete a real 10-minute session at floor/table viewing distance; verify preparation/rest/pacing audibility, separate pacing mute and volume, silent mode/Bluetooth, calls/app switching, wake lock and paused recovery, comfort/joint touch targets and airplane-mode reload. Browser tests use accelerated time and do not verify body movement.
- General context: [Mayo Clinic strength-training overview](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670) discusses recovery between muscle-group sessions; [CDC activity overview](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html) distinguishes aerobic and strengthening work. Neither validates this catalogue, artwork or these numeric app limits.
- Phase 4 screenshots: screenshots/phase4, captured through an entire 10-minute WebKit/Chromium flow; repeat with the workout-quality Playwright spec.

Timber: finish one whole real 7/10/15/20-minute session and let the timer finish
automatically. Completing one exercise, using preview, skipping movement or ending
early earns no timber; activity is still saved. Pause/resume and suitable replacements
are allowed. Then choose Village → Workshop → Restore workshop (1 timber).
The completion screen and Journal explain the outcome for each recorded session.


## Alpha 0.1 on your phone

Use the existing private URL in Safari (iPhone) or Chrome (Android), sign in with
the same ChatGPT account, and install it to the Home Screen. Open its icon online
until Offline ready appears. See [the real-phone alpha guide](docs/alpha_mobile.md)
for installation, first checks, offline use, updates and JSON data transfer.
Icons are now exported from layered Aseprite masters with `npm run art:export`.

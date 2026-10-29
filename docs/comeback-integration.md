# Comeback alpha - published personal test

`npm run build:comeback` runs the approved character and full Sunlit apartment with the real React workout engine. `npm run build` retains the legacy compatibility profile. The comeback alpha is published at https://hecticmike.github.io/little-strides/. Data remains local in IndexedDB; JSON backups include the new records. Both profiles have distinct offline cache IDs. Cache IDs also cover build/launch configuration and the deployment path. The Pages workflow now builds this comeback profile and gates publication on mobile installation/update checks; release 6eff73c passed those gates and is deployed.

## Run and check

```powershell
npm run build:comeback
npm run preview
```

Open the printed local address (normally http://127.0.0.1:4197/). This computer's localhost address is not a phone deployment.

```powershell
npm test
$env:LS_COMEBACK='1'
npx playwright test comeback-live.spec.mjs training.spec.mjs comeback-ledger.spec.mjs comeback-march.spec.mjs comeback-supine.spec.mjs comeback-bridge.spec.mjs comeback-calf.spec.mjs
```

For existing-release regression checks, build normally and run `npx playwright test functional-mvp.spec.mjs`. Browser tests use isolated fictional data, not the owner's saved history.

## Current experience

- Today: approved full-detail room and canonical standing character. Fresh ten-minute default, 7/10/15/20 options and separate three-minute step. Start, small step and Adjust today fit 375x667 above navigation.
- Journey: static apartment, current character and milestones. Walking, floor navigation, decorative room stops and the Phaser scene have been removed from the comeback experience at the owner's request. No Phaser is loaded by this build; the existing release's village remains unchanged.
- Workout: existing timestamp timers, audio preferences, automatic transitions and pause/replace/skip/end. The approved source-matched heel slide is preserved. Separate supplied Easy march stills are now available for both existing physiques, with the canonical upright head, matching logical grid and dedicated workout framing. The supplied supine pose is shared by starting-stage abdominal bracing and pelvic tilts as an explicitly labelled starting position. Each retains its own written instructions and no rep target; the pelvic-tilt caption states that the tilt itself is not depicted. Separate supplied bridge artwork now shows the raised position for both existing stages with a lift/lower caption; it is unreviewed and does not depict a complete motion cycle or prescribe a hold. Calf raises now have a provisional raised-heels still derived from the existing standing layers for both approved physique endpoints, with the canonical head/body unchanged, fixed toe-ground registration and the existing written support/lift/lower cue. It is not a complete motion cycle. The supplied Resting Pixel Hero Sprite now provides a separate Developed bracing/pelvic-tilt setup with the complete source head/neck junction preserved; Starting retains its original. Unsupported movement artwork remains text-only; no unrelated pose is used as a demonstration. All clinical locks remain.
- Profile: versioned user-reported psoriatic arthritis, light knee/shoulder loading and generally comfortable floor access. Overhead reach is excluded separately; fast/high-impact and demanding shoulder constraints are retained. Floor access can be changed in Settings. Recorded professional advice is reference text, not automatically interpreted clearance.
- Planning: existing actual-load recovery, discomfort holds, exact times and same-purpose replacements remain authoritative. A soft core preference uses existing candidates; position changes are limited to one for this profile. Activation, mobility, glute/hip strengthening and aerobic time retain their classifications. The limited pool cannot supply every length/repeat session; shorter choices or rest are offered without lifting caps.
- Adjust today: optional affected areas, worse-than-usual symptoms and fatigue. Unreported remains unknown. Affected areas, including documented shoulder support/contact in supine work, are excluded for up to 24 hours; reported worsening establishes persistent movement holds until explicit reassessment. Higher fatigue and recent hard effort narrow suggestions to activation/mobility, without promising suitability. Positive feedback never clears holds automatically. No diagnosis of a flare or automatic intensity increase.
- Feedback: original comfort controls remain one tap. Optional effort, later symptoms and manual Fitbit average/maximum heart rate/active-zone minutes are available at completion and per session in Journal. Device/source attribution is retained; readings never override symptoms, measure strength or determine recovery.
- Records: `settings.exerciseProfile` and `settings.todayAdjustment` are version 1. Separate optional `training` version-1 check-ins and session-ID observations preserve existing history records. Strict import validation, preview exclusion, offline persistence and JSON restoration cover these additions. The previous world/timber record is retained read-only.
- Game credit: version-1 permanent ledger stores one evidence-backed award per real session ID in the same save as activity. Full sessions earn one unit at all lengths; partial sessions earn their actual movement fraction. Previews, preparation, rest and suspended time earn none. No decay or daily cap. Today, Journey, completion and Journal read this ledger, not current catalogue eligibility.

## Art and remaining work

The calf atlas is a native derivation of existing editable standing parts; no new source image was needed. The supplied marching, Starting/Developed supine setup and bridge images are now prepared in their own editable Aseprite masters; no new image generation was used. Existing approved character/room/heel-slide masters are unchanged. Approved character/source anatomy and apartment pixels are unchanged. Existing motion experiments remain in the art folder for provenance; they are not part of the current experience. `npm run art:export` remains available.

Only the starting and developed physique endpoints exist; 8/24/48 are text milestones using starting art until developed at 96. Three intermediate physiques and short illustrated moments remain unfinished. Further image requests should be made one at a time with exact source/pose/canvas/background requirements. Additional movement demonstrations need personal/anatomical review; a drawing is not clinical validation.

Before claiming the planned full experience: finish intermediate milestone/story art and physical-phone acceptance. The limited alpha explicitly discloses the two existing appearances in Settings. The versioned progress ledger and legacy migration are implemented. Existing eligibility gaps remain: one aerobic candidate, no selectable upper-body strengthening, and no comprehensive full-body programme. Current exercise timing/recovery limits remain conservative software heuristics.

Physical iPhone 15 acceptance still includes real sound/silent/Bluetooth routes, calls/app suspension, Home Screen safe areas, wake lock, cached updates and floor-distance legibility.

## Permanent progress and migration

`state.comeback` is optional for old releases/backups and version 1 for the comeback build:

- `migratedAt`: first migration timestamp; boot/import migration is idempotent.
- `entries`: one per processed non-preview session, including zero-credit records. Stores session ID, rule version, migration/session origin, recorded/earned timestamps, evidence basis, actual/planned movement milliseconds, eligible IDs and fractional units. Known entries are never recomputed after feedback or catalogue changes.
- `milestones`: first crossing of each threshold (0/8/24/48/96), with date and causal session ID. Journal/Journey show these persistent dates. Existing two visual endpoints remain unchanged; intermediate art is not invented.
- `legacy`: separate version-1 read-only world snapshot, source history IDs, earned timber IDs and unspent timber IDs. Original `world` remains present for old-release compatibility. Choices/discoveries and the frozen balance are visible from Journal; later workouts do not alter the snapshot.

Migration leaves history, exclusions, discomfort holds, training observations/preferences and interrupted checkpoints intact. Precise modern records receive actual full/partial credit; older reliably completed sessions retain one unit. Older partial estimates without reliable movement detail receive zero, without inventing repetitions or time. Preview records are never awarded. An active checkpoint is not awarded until it becomes saved activity.

The fixed V1 earning whitelist is independent of current exercise availability. Keep it immutable; new earning policies or milestone-threshold changes need explicit versioned migration. Disabling or reclassifying a movement cannot erase already-awarded progress or invalidate migrated past completion evidence. Future/remaining activity still uses current eligibility and recovery. In particular, a reclassified strengthening movement cannot resume inside a three-minute gentle plan. Stable exercise IDs/catalogue entries must be retained for historical records.

Malformed/unsupported ledgers, orphaned/duplicate awards, changed activity evidence or invented milestone dates reject import without replacing data. Ordinary JSON key order is immaterial. Old backups without this extension remain readable and migrate when explicitly imported into the comeback build. Restoring a backup remains a user-confirmed replacement, not a cloud merge.

Activity, ledger and milestone updates are stored in the same existing IndexedDB transaction before completion UI appears. Duplicate finish calls keep the first history record. Completion after an imported interrupted session now opens Today even when import began in Settings.


## Exercise-art coverage audit (2026-10-29)

Run `node scripts/review-comeback-art.mjs` to regenerate `art/prototypes/comeback/user-art/coverage-review.json` and its self-contained HTML comparison. `coverage-review.png` is a Playwright capture of that HTML, using existing exported pixels only. This is a development review artifact, not an app screen, asset regeneration or a new exercise-approval process.

For the isolated current-profile scenario, six movements are eligible: march, calf, abdominal bracing, pelvic tilt, heel slide and bridge. Starting has art for6/6; Developed now has6/6 following integration of the supplied marching, supine and bridge sources. The shared supine starting setup counts for bracing and pelvic tilt without claiming to depict either contraction or tilt. All artwork remains unreviewed. Reach is profile-excluded; squat, push and modified dead bug remain locked. The two research-only Pilates records are not live exercises.

| Fictional request | Planner result | Starting artwork gaps |
| --- | --- | --- |
| Fresh3/7/10 minutes | Exact selected duration available | None |
| Fresh15/20 minutes | Unavailable;7/10 offered | Not an artwork restriction |
| Ten minutes five hours after completed ten-minute session | Unavailable under rolling limits | Not an artwork restriction |
| Separate three-minute step five hours later | Available, bracing/pelvic tilt | None |
| Ten minutes25 hours after the first session | Available; strengthening still excluded | None |

The audit itself changes no real settings, history, recovery limits, art masters or runtime exports. This snapshot is not a personal prescription or a guarantee of future eligibility. The shared Developed supine setup is complete as an unreviewed still. Developed marching and bridge are now integrated. The existing source/clinical restrictions remain authoritative; each stage uses its own matching artwork.


## Alpha release checks

`comeback-alpha.spec.mjs` uses isolated local HTTP servers and fictional records.
It checks the real Pages path, corrected manifest/splash identity, build/cache marker,
sound-control spacing/mute and an old-profile-to-comeback service-worker update.
The waiting update must leave the old client unchanged; closing/reopening must retain
history, holds, preferences, restored village, paused activity and one-time migration.
A subsequent partial finish, JSON round trip and offline reload must not duplicate progress.

The Pages workflow builds the legacy fixture into ignored `.alpha-check/legacy`,
then builds the comeback alpha with the Pages base path, installs the existing
Playwright WebKit/Chromium browsers and runs this file before uploading only `dist`.
No Aseprite installation is needed in CI; the prepared exports/masters are versioned.

Local Windows check (first create `.alpha-check/legacy`):

```powershell
$env:BASE_PATH='/little-strides/'
npm run build
New-Item -ItemType Directory -Force .alpha-check/legacy
Copy-Item dist/* .alpha-check/legacy -Recurse -Force
npm run build:comeback
$env:LS_COMEBACK='1'
$env:LS_APP_PATH='/little-strides/'
npx playwright test comeback-alpha.spec.mjs settings-sound.spec.mjs iphone-audio.spec.mjs
```

The alpha guide contains the remaining physical-iPhone checklist. A successful
browser check does not certify real audio, calls, installation storage or wake lock.


## Verified publication - 2026-10-29

Release commit `6eff73c` deployed successfully through
https://github.com/HecticMike/little-strides/actions/runs/40903942299.
The live app reports `Build 35c3a24590eb`. Fresh WebKit375x667 and Chromium393x727
sessions at the public URL verified Comeback alpha, corrected install identity,
Start visibility, no horizontal overflow, loaded character art and offline Journey
reload. Screenshots are in `screenshots/comeback-alpha`.

Local verification:135 unit/art tests and28 mobile scenarios passed. CI repeated
its unit/build/prefix/update gates successfully. Live browser checks created no
exercise records. Real-phone sound/calls/storage/wake-lock checks remain pending.


## iPhone Home Screen sound compatibility update

The owner reported silent Test sound and workout cues on iPhone15 in the installed
Home Screen app. Web Audio can report a running context without audible iOS output;
see the primary WebKit report https://bugs.webkit.org/show_bug.cgi?id=252746.
The iPhone/iPad route now reuses a native audio element, primed synchronously inside
Start/Resume/Test/Unmute taps before asynchronous work. It plays the same offline WAVs;
16-bit PCM sample gain preserves saved app volume because iOS media-element volume
is system-controlled. No background silent loop, microphone access or dependency added.

Media preparation/play promises time out; pause, mute, end, visibility/audio interruption
stop output. Superseded starts/cues cannot abort replacements or report a sent test.
A pending interrupted audio unlock cannot later start/resume an exercise session.
Non-iOS keeps Web Audio, with bounded setup and active-node stopping.

The release gate now runs sound controls/native-media tests as well as prefix/update
checks, with a CI-managed preview server. Real WAV playback, PCM gain, automatic cues,
offline reload and interrupted startup are tested independently of Web Audio in
Chromium. Windows WebKit's unsupported WAV renderer has an explicit failure assertion;
one actual-decoding case is intentionally skipped there. None of this establishes
physical speaker audibility: the owner must retry the Home Screen app after deployment.


Sound update publication: commits460eb79/8d59966 and reporting follow-upc22896d;
https://github.com/HecticMike/little-strides/actions/runs/40960743661 SUCCESS.
The live app is now Build ed7ce29124ca. A fresh Chromium session with iPhone UA
and Web Audio disabled verified actual native WAV play, nonzero samples scaled to
saved0.45 gain and offline reinitialisation/replay. No exercise was recorded.
One earlier hosted gate failed without public assertion details; adding GitHub
reporter made future failures publicly diagnosable, and the subsequent complete
gate passed. No unverified cause is claimed for that earlier CI failure. The
owner still needs to confirm audible output in the real iPhone Home Screen app.

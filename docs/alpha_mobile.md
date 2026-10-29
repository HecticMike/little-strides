# Little Strides - comeback alpha on your phone

App address: https://hecticmike.github.io/little-strides/
Source: https://github.com/HecticMike/little-strides

The comeback alpha is published. Settings must show **Comeback alpha** and
**Build ed7ce29124ca** for this release (later releases may have a new identifier).
The address stays the same; no sign-in is needed. Deployment and fresh WebKit/Chromium
offline checks passed. Physical-phone checks below are still pending.

## Update an existing installation

1. Export JSON in the installation containing your history. Keep the downloaded file.
2. Open Little Strides online. If Update ready appears, finish or pause the workout,
   close all Little Strides windows (including Safari tabs), then reopen it.
3. Check Settings for Comeback alpha, the build identifier and Offline ready.
4. Check Journal history, movement exclusions, sound preferences and any paused session.
   Earlier workshop/timber progress is available read-only in Journal.
5. If you need to transfer history, use Settings > Import JSON and verify the records.
   Import replaces local data; it does not merge histories. Keep the original until checked.

Do not clear browser data or uninstall to force an update. Same-origin update tests
preserve data, but phone storage/OS behaviour still needs the checks below.

## Install on iPhone 15

Open the app address in Safari. Use Share > Add to Home Screen; keep Open as Web App
on if offered. Open the new icon while online and wait for Offline ready. If the
Home Screen app does not contain your Safari history, import your exported JSON.
Do not assume a desktop or another installation synchronises automatically.

Android: open in Chrome and choose Install app or Add to Home screen, then open the
installed icon online until Offline ready appears.

## Retest the iPhone sound update

Wait for Update ready while online, then fully close Little Strides from the App
Switcher and close any Little Strides Safari tabs. Reopen the Home Screen icon and
check Settings says Build ed7ce29124ca. Do not uninstall or clear stored data.

Turn Sound on, set app Volume above zero, raise the phone's media volume and tap
Test sound. The confirmation should mention **iPhone media playback**. If it is
still inaudible, report the exact confirmation/error, build ID and whether the phone
is using its speaker or Bluetooth. A sent-tone message cannot verify the speaker.
The cue route now uses native media files on iPhone, retaining app volume/mute and
offline use. No recording permission or background silent loop is involved.

## What this alpha contains

- A static Sunlit apartment/Journey and Starting/Developed character artwork.
  The visual physique change is at 96 comeback steps. Milestones at 8/24/48 are
  recorded, but intermediate physiques and illustrated scenes are unfinished.
- Core-led recommendations using existing candidates and your recorded constraints.
  Suggestions and artwork are unreviewed, not professional approval. Review or
  disable unsuitable movements; existing locks and discomfort holds remain.
- Ten minutes is the fresh default. The initial profile/pool currently supports
  3/7/10 minutes; 15/20 can be unavailable under the unchanged exposure limits.
  A later ten-minute request may be unavailable while a three-minute step still fits.
  This limited catalogue is not a comprehensive full-body strengthening programme.
- A full real session earns one permanent comeback step at every length. Partial
  sessions earn their actual movement fraction. Rest, preparation, preview and
  suspended time earn none. Stopping never removes existing progress.
- All six currently profile-eligible movements have matching artwork at both
  existing stages. Setup/raised-position stills are labelled; no full movement
  cycle, clinically validated demonstration or measured repetitions are implied.
- Optional effort, later symptoms and manually entered Fitbit readings remain local
  and are included in JSON backups. Device data never overrides symptom restrictions.

## Physical-phone checks - all still pending

| Check | Expected result |
| --- | --- |
| Install and reopen | Correct app name; safe areas clear; Settings says Comeback alpha and shows a build ID. |
| Settings > Test sound | With Sound on and nonzero volume, an audible tone. Check speaker, media volume, Silent Mode and Bluetooth separately. Tone sent does not prove audibility. |
| Muted sound | No cue; preference survives closing/reopening. Pacing mute leaves transition cues available. |
| One appropriate available session | Readable figure/timer/cues from floor/table distance; accessible Pause/Skip/Replace/End; automatic transitions and saved completion. |
| Brief app switch, call, lock and forced termination | Interrupted activity stays paused, time away is not counted, explicit resume is required. Check audio resumes from a tap. |
| Wake lock | Screen stays awake while foreground exercise is running, or clear fallback guidance appears. |
| Airplane-mode relaunch | After Offline ready, close/reopen; artwork, sounds, history and paused session remain available. |
| Export/import | Use the phone's file/share flow; restore a fictional/test backup and check history, preferences and comeback progress without duplicates. |
| Rotation and safe areas | Controls remain usable with Safari bars, Home Screen mode, Dynamic Island and bottom inset. |
| Cached update | Close all old app windows; reopen the new build with saved activity and no repeated award. |

Repeat install, sound, interruption and offline checks on Android when available.
Browser emulation does not certify real sound routes, iOS lifecycle/storage or wake lock.
For an issue, record the device, OS/browser version, Settings build ID and steps.

## Data transfer and backups

Data stays on this device/browser installation, not in GitHub or a cloud account.
Export after important testing and before changing installations. If using the old
private preview, export there and import at the app address above; the domains have
separate storage. The app does not upload your exercise records or JSON backup.

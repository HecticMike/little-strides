# Phase 5 verification - 2026-10-28

- 39 unit/art tests and production build PASS.
- 78 mobile scenarios verified in iPhone WebKit and Android Chromium: initial
  full run 74/78, then 12/12 focused reruns after correcting startup/End-save
  fixture timing and the old Journal-copy assertion. No remaining failures.
- Full ten-minute journeys advance through preparation, every work/rest block
  and wind-down using the browser clock. Separate near-end fixtures target save
  races. Browser time and recorded movement do not verify physical exercise.
- All 66 artwork/source/prototype files remain byte-identical. Original workout
  styling and prototype export assumptions remain unchanged. No dependencies added.
- Review/Journal captures at 375x667 are in screenshots/phase5; no horizontal
  overflow. Existing regression screenshots refreshed by tests are retained.

| Required scenario | Verification |
| --- | --- |
| Nothing enabled on first launch | Review opens; individual opt-ins start unchecked. |
| Enable a fictional suitable subset | Grouped phone review; pending candidates remain locked. |
| Complete ten minutes | Full functional-MVP and workout-quality walkthroughs in both engines. |
| Afternoon request | Another session is available when rolling capacity permits. |
| Avoid repeated strengthening | Afternoon plans exclude recovering calf work. |
| Next-day recovery | Mobile next-day plan plus 25/49-hour unit boundaries. |
| Discomfort exclusion | Persistent holds, explicit reassessment and JSON/offline roundtrip. |
| Insufficient eligible time | Supported shorter lengths or rest, without strength filler. |
| Skip/replace actual loads | Partial durations, replacements, per-group/joint cap checks. |
| Interrupted sessions | Last-observed freezes, late visibility and automatic/manual save races. |
| Reload/offline/backups | Restored paused state/history, export/import and corrupted-input rejection. |
| Genuine nonduplicate rewards | Full eligible movement accounting; preview/partial/skipped rejection and unique IDs. |

Temporary fictional floor/core candidates exist only inside a unit test to check
position grouping and shared-muscle recovery. They are not added to the app.
Historical rewards remain intact; resumed older sessions label estimated timing.

Remaining suitability decisions: all five candidates remain professionally
unreviewed. Choose appropriate existing movements and configurable limits before
personal use. Wall push/squat remain locked; the core study is unavailable, so
there is no selectable core or full-body strength routine. Software limits do
not establish suitability or guarantee injury prevention.

Physical iPhone/Android checks remain: a real ten-minute workout at floor/table
distance; sound, silent mode/Bluetooth, calls/app switching, forced termination,
wake lock/low-power mode, standalone installation/safe areas, airplane-mode
relaunch, storage pressure and JSON file sharing/import. See the README checklist.
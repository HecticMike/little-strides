# Phase 6 composition verification

Fictional opt-ins only; 28–29 October 2026, GMT. Independent fresh durations; the daily chain uses actual completed movement records from 09:00 and 15:00. All seven selectable candidates enabled in memory; no clinical locks changed.

Times are m:ss. Comparison triples are **core-strength-labelled / gentle activation / aerobic-labelled** time. These categories describe catalogue purpose, not verified effort, prescribed dose or clinical effectiveness.

| Session | Audit baseline triple | New triple | New mobility | New calf strength | New activity / passive time | Scheduled / requested |
|---|---|---|---|---|---|---|
| Fresh 7 | 0:45 / 2:15 / 0:45 | 1:30 / 1:15 / 0:45 | 0:00 | 0:45 | 4:15 / 2:45 | 7:00 / 7:00 |
| Fresh 10 / 09:00 | 1:30 / 3:00 / 0:45 | 1:30 / 1:30 / 3:00 | 0:00 | 0:45 | 6:45 / 3:15 | 10:00 / 10:00 |
| Fresh 15 | 1:30 / 5:15 / 0:45 | 1:30 / 1:00 / 6:00 | 0:45 | 1:30 | 10:45 / 4:15 | 15:00 / 15:00 |
| Fresh 20 | 0:45 / 3:00 / 3:00 | 1:30 / 1:00 / 6:00 | 5:15 | 1:30 | 15:15 / 4:45 | 20:00 / 20:00 |
| Second 10 / 15:00 | 0:00 / 0:00 / 1:30 | 0:00 / 0:00 / 3:15 | 5:00 | 0:00 | 8:15 / 1:45 | 10:00 / 10:00 |
| Third 10 / next day 10:00 | 0:00 / 0:00 / 3:45 | 0:00 / 0:00 / 6:45 | 1:45 | 0:00 | 8:30 / 1:30 | 10:00 / 10:00 |

## New sequences

- **Fresh 7 — Strength with brief movement:** Easy march 45s → Calf raise 45s → Glute bridge 45s → Supine abdominal bracing 30s → Glute bridge 45s → Supine heel slides 45s. Only brief marching fits. This is primarily a strength/activation session, not sustained aerobic work.
- **Fresh 10 / 09:00 — Balanced:** Supine abdominal bracing 45s → Glute bridge 45s → Supine heel slides 45s → Glute bridge 45s → Calf raise 45s → Easy march 180s.
- **Fresh 15 — Balanced:** Supine abdominal bracing 30s → Glute bridge 45s → Supine heel slides 30s → Glute bridge 45s → Calf raise 45s → Easy march 180s → Calf raise 45s → Easy march 180s → Gentle reach 45s.
- **Fresh 20 — Balanced:** Supine abdominal bracing 30s → Glute bridge 45s → Supine heel slides 30s → Glute bridge 45s → Calf raise 45s → Easy march 180s → Gentle reach 90s → Calf raise 45s → Gentle reach 120s → Easy march 180s → Gentle reach 105s.
- **Second 10 / 15:00 — Movement & mobility:** Easy march 45s → Gentle reach 60s → Easy march 120s → Gentle reach 120s → Easy march 30s → Gentle reach 120s. Core strengthening and calf strengthening are recovering from the previous session. A balanced strength/aerobic mix is unavailable; this is an alternative composition.
- **Third 10 / next day 10:00 — Movement & mobility:** Easy march 60s → Gentle reach 45s → Easy march 180s → Gentle reach 60s → Easy march 165s. Core strengthening and calf strengthening are recovering from the previous session. A balanced strength/aerobic mix is unavailable; this is an alternative composition.

Rest: 30s after strengthening, 15s after other activity; 45s when changing between standing/floor positions. Initial floor setup is 45s, standing setup 15s; final passive settling is 15s. No equipment. Pause remains available if a transition needs longer. Final long continuous movement is displayed as an activity period followed by 30s active wind-down, with no intervening rest or added load. The preview coalesces this into one continuous period. Active preparation/wind-down use eligible existing movements and are recorded; passive setup/rest are not.

## Model and limitations

- Hard constraints reuse eligibility, symptoms, actual-load recovery and capacity checks. Existing 48h strength recovery, rolling 24h windows, 90s/group strength and 600s movement/joint caps remain unchanged. A prior 45s calf set still triggers the full strength-recovery hold; the afternoon cannot top it up.
- Soft scoring rewards relevant strengthening, sustained aerobic-labelled work and variety, with diminishing returns on gentle activity. Duplicate blocks, position changes and passive time are penalised. A deterministic bounded search retains four candidates per initial/current position profile per 15s time slot; it does not guarantee a global optimum. A final within-position ordering pass removes avoidable adjacent duplicates without changing blocks, rests or exposure.
- Product composition criteria require at least 60% active time. Cardio focus requires at least 120s and 40% of activity labelled aerobic. These are transparent labelling/composition heuristics, not clinical intensity thresholds. Balanced alternatives are named by their actual content; short seven-minute plans still contain only brief marching.
- Metadata: aerobic 30–180s, preferred 120s; strength 30–45s, preferred 45s with 30s rest; activation 30–60s; mobility 30–120s. Set counts are bounded, not increased indefinitely to fill time. Current repetitions remain unknown; core blocks stay self-paced. These unreviewed software defaults need individual review. Per-exercise settings can shorten blocks or increase rest, never expand these defaults or bypass caps.
- Loading-model version 1 separates strengthening, activation, mobility and aerobic purpose from unweighted joint-tag exposure. Biomechanical force/intensity estimates are explicitly absent. A future clinically reviewed model can interpret existing movement-duration records without changing history schema.
- All current candidates remain clinically unreviewed. Modified dead bug, squat and wall push stay locked. Bridge is the only selectable core-strength pattern; marching is the only aerobic candidate. Longer recovery/core-only requests can be unavailable rather than filled with gentle repetitions.
- Existing saved fixed-block sessions retain their exact plans and timers. New composition metadata is additive; database/history schema stays at version 1. Journal separates activation, mobility, strengthening and aerobic-labelled time.

## Verification

57 unit/art checks and 56 distinct targeted WebKit/Chromium mobile checks passed across primary runs and affected reruns; production build passed. Screenshots cover Today at 375x568/667 and 393x727, active core/text and marching views, and existing Beginner/workshop integration. Old fixed-timing assertions now follow actual plan boundaries. The preview-only completion test waits for enabled controls and skips its exact remaining segment count. Physical-device checks remain: individual dose/range and floor-transfer suitability; real-time iPhone/Android audio, silent/Bluetooth routes, incoming calls, wake lock and installed offline operation.

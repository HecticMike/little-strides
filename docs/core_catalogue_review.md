# Core catalogue review - 2026-10-28

## Audit

The previous catalogue contained no supine/core entry. Calf raise was its only
selectable strengthening candidate; squat/wall push were deliberately locked.
The provisional lying study is not a usable demonstration. The scheduler had
trunk/floor support tested only with fictional entries, lacked a real core focus
and accepted only older group names in backups. Its greedy ordering could also
reject a feasible mixed 20-minute plan after adding core opt-ins. Core focus,
core-group validation and constraint-preserving search now address those gaps.

## Candidate review

Full local descriptions, steps, loading notes, pacing, assessment reasons,
source context and clinical status are in [core-candidates.mjs](../src/core-candidates.mjs)
and the existing phone exercise-review dialog. All are equipment-free; mat optional.

| Candidate | Purpose and movement outline | Loading / assessment considerations | Source |
| --- | --- | --- | --- |
| Supine abdominal bracing | Gentle lower-abdominal engagement during an out-breath, then relaxation. App classification: activation. | Bent hips/knees; supported back; no overhead task. Review difficult recruitment, uncomfortable lying and relevant pelvic-health/pregnancy/surgical circumstances. | [East Lancashire NHS abdominal-muscle guidance](https://elht.nhs.uk/services/physiotherapy-pelvic-obstetric-and-gynaecological/physiotherapy-pelvic-obstetric-and-gynaecological-6) |
| Pelvic tilts | Comfortable pelvic rocking with bent knees; return slowly. App classification: mobility/control. | Hip/knee position and lumbar movement; comfortable head/shoulder support. Pain or unsuitable floor access needs individual review. | [Royal Berkshire NHS core programme, May 2025, p1](https://www.royalberkshire.nhs.uk/media/qfljlxzd/physio-core-exercise-programme-matplusgynae.pdf) |
| Supine heel slides | Maintain gentle abdominal control while sliding one heel out/back; alternate. App classification: activation. | Moving knee/hip with trunk control, no overhead arm task. Review back flares and poor control rather than increasing lever length automatically. | [NHS Bexley MSK heel slides](https://msk-bexley.nhs.uk/conditions/back-pain/acute-low-back-pain) |
| Modified dead bug | Research entry only: suspended-leg control and opposite-limb progression. App classification: strengthening candidate. | Higher trunk/hip demand and shoulder elevation in the full version. RUH requires physiotherapist guidance; pain, leakage or pelvic heaviness need clinician review. | [RUH NHS level 3, section 5](https://ruh.nhs.uk/patients/patient_information/PHY079_Functional_pelvic_floor_exercise_level_3.pdf) |
| Glute bridge | Controlled bilateral hip lift/lower with bent knees and planted feet. App classification: strengthening with trunk stabilisation. | Knee/hip/back loading and upper-back/shoulder contact. Review symptoms, transfers and postoperative restrictions. No single-leg/banded progression. | [Royal Devon NHS bridging, p3](https://www.royaldevon.nhs.uk/media/v0xigkbj/strengthening-exercises-1001-v1.pdf) |

These are review considerations, not exhaustive contraindications or personal
clearance. The Bexley source includes urgent back-pain warning signs: new
bladder/bowel control changes, saddle/genital numbness or worsening weakness in
both legs should follow its urgent-care advice, not an app exercise routine.
Condition-specific leaflets must not be assumed to apply universally.

### Shoulder-sparing dead-bug alternatives

RUH separates a leg-only extension stage from overhead-arm progressions. It does
not establish a universally suitable arms-down modification. The basic opposite-limb
pattern is also described in [Royal Berkshire NHS strength and conditioning](https://www.royalberkshire.nhs.uk/media/ljrncq23/strength-and-conditioning-exercise-class_jul25.pdf). The dead-bug entry
therefore remains locked pending selection by a physiotherapist. Bracing and heel
slides may be reviewed separately as lower-arm-demand alternatives; they are not
strength-equivalent substitutions or automatically suitable for shoulder pain.

### Status, pacing and recovery

- Four lower-level entries remain **clinically unreviewed**. Following the user's
  later request, available candidates are preselected for first-use suggestions;
  explicit exclusions and discomfort holds persist. Suggestions are not clinical
  approval. Modified dead bug remains pending-review/locked. Existing
  wall push/squat locks remain. NHS publication is not app or personal approval.
- Update 2026-10-28: four selectable candidates now have their own canonical-character
  illustrations. These are explicitly unvalidated artwork, not clinical demonstrations.
  The original provisional core study remains unchanged and unused; dead bug stays locked.
- Self-paced breathing/movement; no imposed hold count, repetition target or
  pacing beep. The configurable app planning window is not an NHS treatment dose. Stop or
  pause as needed; individual dose/range decisions remain outside the app.
- Bracing/heel slides are conservatively logged as activation, tilts as mobility,
  and bridge/dead bug as strengthening. Activation can still be demanding for an
  individual; the labels are not personal intensity measurements. None is aerobic.
- Existing software defaults remain: 48-hour strength recovery, shared 90-second
  core strengthening cap, 600 seconds per repeatable movement and combined timed
  joint exposure per joint in a rolling 24h. These are configurable app heuristics,
  **not NHS-validated recovery prescriptions**. Muscle overlap/discomfort holds
  still apply; gentle activation does not erase a strength recovery restriction.
- Core-only default pools support 7/10 minutes when appropriate entries are
  enabled; 15/20 may be unavailable because shared joint exposure is insufficient.
  All four lengths work only with enough eligible capacity. Limits are never
  increased automatically. Mixed plans can now find feasible alternatives instead
  of getting stuck on greedy floor ordering. Floor movements remain grouped.

Source check notes: Royal Devon's printed February 2025 review date is past;
its bilateral bridge technique was cross-checked against Royal Berkshire's May
2025 leaflet. East Lancashire's indexed NHS guidance was readable, while direct
automated retrieval returned 403. No source's publication/review date is recorded
as clinical approval of these app entries.

## Workflow preview and verification

The preview uses inert timer cards, no exercise IDs or exercise prescriptions.
It requires no opt-ins, adds no history/recovery/reward and does not persist an
active session or export one. Leaving/reloading ends it. Existing historical
preview records are preserved and remain excluded from activity/rewards.

Tests cover opt-ins/locks, source and illustrative/missing-art metadata, exact durations,
core/mixed coverage, rolling same-day/next-day recovery, incomplete pools,
self-paced blocks, preview records/backups/rewards and phone UI flows. See the
handoff log for final counts. Physical floor transfers, written-cue clarity,
comfortable execution and personal suitability still require individual review.

Final checks: 46 unit/art tests, 16 focused WebKit/Chromium mobile scenarios and
production build PASS. New phone captures are in screenshots/core-catalogue.
All 66 existing art/prototype files are byte-identical; no new dependency or RPG
change. Planning with the full mixed pool averaged about 2.3 ms in a local
desktop benchmark; real-device clinical suitability/performance is unverified.

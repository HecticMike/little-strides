# Session quality and coverage - In Good Time

Fictional default profile only, 1 November 2026. No real exercise settings/history are changed. The fixed audit uses the reported floor access and knee/shoulder constraints, existing preselection and unchanged conservative software limits. Catalogue purpose does not establish clinical approval, measured intensity or a treatment dose.

Reproduce with `npm run audit:sessions`; regenerate the committed JSON with `npm run audit:sessions -- --write`. Full sequences, preparation/rest, purpose totals and per-movement restrictions are in [session-coverage-audit.json](session-coverage-audit.json).

## What was fixed

- Reproduced a real failure in Chromium before the fix: replace planned bracing with heel slide, flag heel slide as uncomfortable, save choices. A valid ten-minute routine existed, but the stale swap kept Start disabled. Successful movement-flag/reassessment saves now discard pending swaps; shorter-duration selection also discards stale swaps. Active workout records and the discomfort hold are preserved.
- A longer request could report no seven-minute option without explaining that an exact three-minute gentle option still fitted. Planner fallback metadata now identifies the longest supported shorter ordinary session, or an eligible three-minute activation/mobility alternative. The existing session screen offers shorter choices immediately after its explanation. Its different purpose is stated; strength/aerobic targets are not claimed to be met by it. No plan is silently shortened.
- Recent movement selection costs were identical when the same movements appeared in successive sessions, leaving the same first movement preferred. Added a small deterministic opening preference based on actual performed activity from the latest three distinct sessions within seven days. Skips with zero activity, preview/future records and duplicate history do not affect it. The preference does not exclude a sole suitable movement or change eligibility, block/dose limits, exercise difficulty or recovery. Existing same-purpose replacements remain authoritative.

## Current composition

Times are minutes:seconds. Strength includes calf and hip/glute strengthening, not a claim that this is a complete abdominal or full-body strength programme. Activation, mobility and aerobic-labelled work remain separate.

| Fictional request | Strength | Activation | Mobility | Aerobic-labelled | Setup/rest/transitions | Scheduled/result |
| --- | --- | --- | --- | --- | --- | --- |
| Fresh3 | 0:00 | 0:45 | 1:00 | 0:00 | 1:15 | 3:00 |
| Fresh7 | 1:30 | 1:15 | 1:45 | 0:00 | 2:30 | 7:00; strength/activation alternative |
| Fresh10 | 2:15 | 1:00 | 0:30 | 2:45 | 3:30 | 10:00 |
| Fresh15/20 | - | - | - | - | - | Unavailable;7/10 offered |
| Second10, five hours later | - | - | - | - | - | Unavailable;3-minute gentle alternative offered |
| That three-minute alternative | 0:00 | 0:45 | 1:00 | 0:00 | 1:15 | 3:00 |
| Next10,25 hours after the first, including afternoon activity | 0:00 | 2:00 | 2:30 | 3:00 | 2:30 | 10:00; strengthening still recovering |
| Ten minutes after50 hours, same history | 2:15 | 1:00 | 0:00 | 3:30 | 3:15 | 10:00 |

All generated durations are exact, position changes remain at most one, and activity/exposure checks use actual completed movements. Unavailable requests earn no record or reward. Stopping/skipping/replacing retains the existing actual-activity accounting. No daily-session cap is introduced.

A wider bounded-search comparison found no missed plans in80 targeted default/rest-override scenarios. A further220 fictional selection/rest variants retained exact durations across7/10/15/20 requests. These are diagnostic samples, not proof of global search completeness or clinical suitability. Longer plans are not enabled by increasing caps or adding repeated filler.

## Remaining coverage decisions

| Area | Current limitation | Decision needed before expanding live coverage |
| --- | --- | --- |
| Aerobic variety | Marching is the only eligible aerobic pattern. | Individually review an additional appropriate low-impact pattern and its timing/loading metadata; mobility cannot substitute as cardio. |
| Core | Bracing/heel slides are activation; pelvic tilt is mobility; bridge principally trains hips/glutes with trunk stabilisation. | Review whether another core pattern is personally suitable, its purpose and dose; do not relabel activation as strengthening. |
| Existing Pilates research | Bent-knee fall-out and single knee fold remain research records, outside the live catalogue. | Individual suitability, exact variation, classification and conservative timing remain unresolved. Neither is automatically enabled by this work. |
| Squat / wall push / modified dead bug | Existing suitability/artwork locks remain. | Review personal knee/shoulder/back suitability and the exact movement/dose. Reported squat tolerance does not resolve every restriction. |
| Upper-body strengthening | No selectable upper-body strength pattern. | Individual shoulder-loading review; the app must not promise comprehensive full-body strengthening. |

The existing source-linked research and decisions are in [comeback-exercise-review.json](comeback-exercise-review.json) and [core_catalogue_review.md](core_catalogue_review.md). All current live candidates remain unreviewed; user selection and automated tests are not professional approval. No catalogue movement, illustration, eligibility or clinical status was added or unlocked in this iteration.

## Release boundary

This is a session-quality correction within the current limited programme. The normal ten-minute journey works;15/20 and unrestricted repeated ten-minute sessions remain conditional on an adequate individually suitable pool and recovery allowance. Physical iPhone sound routes, real calls/background suspension, wake lock and comfort/legibility still require owner verification. Future illustrated milestone moments remain separate work using existing art.

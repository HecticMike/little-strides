# Loading and minimal catalogue source review

Reviewed1 November2026. Review records only; no app settings, numerical limits, clinical locks, history or artwork changed. No professional numerical limits have been supplied. That leaves individual dose unknown rather than establishing unrestricted activity.

## Findings and decisions

- [NHS psoriatic arthritis guidance](https://www.nhs.uk/conditions/psoriatic-arthritis/) supports regular low-impact activity and physiotherapy. The [2018 ACR/NPF guideline, table8](https://pmc.ncbi.nlm.nih.gov/articles/PMC8218333/) conditionally supports exercise/low-impact choices, with exceptions including injury or multiple inflamed symptomatic joints worsening with exercise. These broad sources do not validate this app's600s joint-time allowance,90s strength allowance or universal48h recovery interval. They do not provide an individual replacement dose either.
- Current knee tagging counts elapsed time equally across marching, supported floor positions and other movements. This is explicitly an unweighted software proxy, not measured joint force. All six eligible movements share knees;600s cannot cover the720s minimum activity required by the current20-minute composition rule. Adding more similarly tagged movements cannot repair that mathematical bound.
- Retain existing limits/holds for this release. A future versioned loading model should separate movement, weight-bearing/support and static-position descriptors while retaining all relevant contacts for symptom exclusions. No force weights, removed knee tags or larger allowances are approved by this review. Preserve raw actual-duration history so a reviewed policy can be added without rewriting records.

## Smallest useful candidate set

| Candidate | Review outcome | Unresolved before live scheduling |
| --- | --- | --- |
| Bent-knee fall-out, level1 | Existing Pilates research candidate; supported bent-knee starting position with one knee opening while the pelvis stays controlled. | Personal hip/knee/back tolerance, purpose classification, dose and correct demonstration. Do not infer strengthening equivalence. |
| Single knee fold, level1 | Existing candidate; one leg lifts and returns before alternating. The overlapping-leg/toe-dipping progression is level2 and excluded. | Individual trunk control, hip/knee/back and supported shoulder comfort; classification/dose remain unknown. |
| Comfortable indoor walking | New review record only; NHS lists walking among low-impact options. Could add locomotor variety, with text fallback until matching art exists. | Pace, space, balance, turns and lower-limb tolerance. It does not solve the shared knee allowance. No automatic swap for a discomfort-held march. |

The two Pilates descriptions were checked against the actual heading/image layout on printed page10 of the [Calderdale and Huddersfield NHS booklet](https://plr.cht.nhs.uk/download/1314/Pilates%20Exercises%20A4). PDF text extraction interleaves the level1/2 bullets; source layout confirms the distinction above. Printed review date is June2026; accessibility of the file is not current personal clearance. No treatment dose is transferred.

[NHS sideways walking](https://www.nhs.uk/live-well/exercise/balance-exercises/) is presented as balance work. It is not sufficient evidence to label slow side steps as an aerobic-equivalent march replacement. No extra candidate is added from that page.

## Release implications

The three candidates remain research-only in comeback-exercise-review.json, outside EXERCISES and the live planner. Squat, wall push and modified dead bug remain locked. No clinical approval or automatic difficulty progression is created. Missing demonstrations must retain the existing neutral/text fallback if a candidate is later appropriately enabled.

The current limited3/7/10-minute programme can continue while its remaining software features are finished. Broader catalogue/loading-policy implementation requires the unresolved variation/dose/model decisions above; deleting a guard merely to make15/20 appear available would not resolve them. Optional milestone moments and physical-iPhone acceptance can proceed independently using existing assets.

## In-app research review

The existing movement-review dialog now includes a collapsed Research candidates section. Its three read-only cards include purpose, unresolved suitability questions, exact source section and online NHS link. They work offline after caching, contain no enabling controls or demonstration artwork, and remain outside the live catalogue. Numerical limits and current recommendations are unchanged. A separate opt-in advisory-policy product decision is pending; no mode or default has been changed.

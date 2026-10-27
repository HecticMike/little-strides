# Character art pass - review and manual handoff

[Final comparison](character-comparison.png) / [self-contained HTML](character-comparison.html)

## Findings and corrections

- Idle/walking hair tops differed by two source pixels; marching was two pixels
  left and had different eye/mouth shading. Upright poses now reuse the exact
  canonical head region. Walk upper bodies are pixel-identical to idle.
- The old mirrored contact keys have been replaced with edits of the original
  standing legs/boots. Walk A supports the far foot while the near heel lifts;
  Walk B reverses that contact. Existing boot lighting and proportions are kept.
  Head, torso and hands remain registered; soles stay at y=119, anchor y=120.
  The existing two-key/neutral playback system is unchanged.
- The marching key raised the arm and knee on the same visible side. Existing
  arm pixels now provide opposite-side opposition; the relaxed arm sits behind
  the raised thigh. This is an art correction, not exercise approval.
- All upright frames share the existing 45-colour palette and face/hair key.
  Some legacy part layers remain colour/region masks, not anatomical rig layers.
- Adventure scarf/pack/cloak concealed joints in workouts. A separate equipment
  overlay now supplies light training seams/cuffs for all stages, on the SAME
  body image. Adventure equipment remains in Today/Village. There are no
  independently generated workout avatars.
- The current stages share one physique. Their existing progression is outfit
  based; this pass preserves body proportions instead of inventing body-growth
  or real-user measurement changes.
- The current lying slot was empty. The archived 48x64 study cropped both ends
  and had an older identity. One built-in image-generation seed produced a wider
  lying/core study using the approved character reference. It was quantised to
  the shared palette and separated into editable regions in Aseprite.
  [Seed](../direction/core-study-v1.png) /
  [exact built-in prompt](../direction/core-study-prompt.txt).
- The 160x96 core study remains PROVISIONAL, review-only and clinically
  unvalidated. Head/back contact and limb separation were refined using existing
  pixels only; final neck/hand anatomy still requires manual review. Runtime lying
  stays unavailable and unmapped; no exercise catalogue or eligibility changed.

## Exact Aseprite work still needed

| File | Columns / frame | Specific manual correction |
| --- | --- | --- |
| `art/source/hero-body.aseprite` | 96x128 columns 8/9 (walk-a/b), x=672/768 | Polish the flexed knee/shin join at local y=91..104 in both keys and the toe-off ankle/cuff at y=102..119. Retain the unmirrored boot lighting, exact upper body and y=120 anchor. Review the existing neutral-between-keys playback; no extra frames are needed for this pass. |
| Same file | Column 2 (march), x=96 | The sleeve/bicep connection was patched from canonical pixels and a stray outline pixel removed. Refine the near wrist/elbow junction around local x=25..40,y=49..69 and separate the far hand from the raised thigh around x=67..77,y=72..83. Keep opposite-side opposition readable. |
| `art/source/hero-core-study.aseprite` | Timeline frame 1, 160x96 | Check the rotated posterior head/neck join at x=43..54,y=67..78; soften the newly completed shirt/back edge at x=49..88,y=80..85. Refine far elbow/wrist readability at x=56..108,y=58..70 and near hand at x=94..105,y=77..85. Review knee overlaps at x=105..126,y=40..58 and foot contacts at x=116..152,y=74..85 against the perspective floor plane. Keep provisional and unscheduled. |
| `art/source/hero-equipment.aseprite` | Veteran row 2; columns 2,8,9 | Hand-polish cloak attachment/folds and leg cutouts. This gear is intentionally absent from workouts. |
| `art/source/hero-training-outfit.aseprite` | Rows 1..3; movement columns | Refine the soft cuff masks and small stage accents without covering wrists, knees or ankles. All stages must keep the same underlying body. |

Columns are sprite-strip columns, not extra timeline frames. Core now has separate far forearm, far leg, torso/support, near leg, head/neck
and near forearm layers. These are editable pixel components, not a finished rig.
The hidden Adventurer/Veteran trim layers share one base body; the export renders
all three from those same layers.

## Editing and reproduction

1. Edit the named masters. Keep the 96x128 grid, face registration and foot anchor;
   core alone uses a wider 160x96 review canvas.
2. Run `npm run art:export` for all runtime PNGs, review-only core stages,
   avatar metadata and source inventory.
3. `npm run art:motion` now refreshes blink only and PRESERVES authored walking
   keys. It no longer regenerates/mirrors an edited walk-b.
4. Run `npm run art:compare` to regenerate the final PNG and self-contained HTML.
   Main cells are exact 2x nearest-neighbour; footer samples show 48x64 game-space
   village frames and a 160x96 mobile core study.
5. Run unit/build/mobile checks after edits. The character-pass mobile checks
   compare real face pixels between Today/workout, head/hand registration and
   contact baselines, in addition to canonical stage metadata.

The canonical reference fingerprint remains the adventure standing key. A separate
outfit fingerprint records the actual training equipment. Shared identity is also
checked directly from rendered face pixels, not inferred from those metadata flags.

One-time scripts `refine-character.lua` / `align-walk-keys.lua` document earlier passes;
normal export does not rerun destructive pose edits. The first refuses an already
prepared training master. Approved village/environment art was not regenerated.


## Targeted sprite correction pass

- Core: rigidly lowered/rotated the existing head, completed the occluded shirt
  underside to the near support level (y=85), separated forearms and planted-foot
  silhouettes. The far sole recedes to y=78; the near sole remains y=85. This
  three-quarter ground interpretation and the neck still need an artist's review.
- Walk: reused the original standing boot texture without mirroring or scaling;
  alternated flat support and toe-off, with articulated knee/shin adjustments.
  Upper-body pixels through y=83 are identical to idle. Only Walk A/B changed
  in the runtime body and corresponding equipment masks.
- No new image generation, pose, character design, stage physique, exercise or
  scheduling change. Approved village art and runtime animation are untouched.
- [Physique proposal](physique-proposal.md) is documentation only.
- `npm run art:export` and `npm run art:compare` reproduce the updated outputs.
  `correct-target-sprites.lua` records this one-time edit from the previous
  masters and refuses the already-corrected core. Do not rerun old alignment
  scripts over authored walk keys.
## Verification of targeted corrections

- 30 unit/art checks and all 70 existing mobile checks PASS (WebKit/Chromium).
  Production build PASS. No tests or runtime logic changed.
- Pixel comparison against the preceding source commit: zero changes outside
  Walk A/B in body, adventure equipment and training equipment. Flat soles match
  idle; the opposite foot has a smaller toe contact at the same y=119 baseline.
- Normal export/comparison repeated byte-identically across 16 output files.
- Final comparison reviewed at 2x and native mobile/game samples. Real mobile
  Village/Workout captures reviewed; head identity, stage and nearest-neighbour
  rendering preserved. Existing test captures were not retained as noisy changes.
- No village assets, catalogue, scheduler, storage, PWA or dependency changes.
  This verification does not replace the specific manual anatomy corrections above.
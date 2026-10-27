# Character art pass - review and manual handoff

[Final comparison](character-comparison.png) / [self-contained HTML](character-comparison.html)

## Findings and corrections

- Idle/walking hair tops differed by two source pixels; marching was two pixels
  left and had different eye/mouth shading. Upright poses now reuse the exact
  canonical head region. Walk upper bodies are pixel-identical to idle.
- The old second contact key mirrored below the belt about the canvas midpoint,
  displacing hips and also mirroring low forearms. Contacts now use the actual
  hip centre (x=52), preserve the forearms and keep the floor at source y=119
  with anchor y=120. Existing contact keys remain; no new animation system.
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
  unvalidated. Its head/upper-back support still looks ambiguous. Runtime lying
  stays unavailable and unmapped; no exercise catalogue or eligibility changed.

## Exact Aseprite work still needed

| File | Columns / frame | Specific manual correction |
| --- | --- | --- |
| `art/source/hero-body.aseprite` | 96x128 columns 8/9 (walk-a/b), x=672/768 | Hand-author knee/ankle weight transfer in local y=74..119; correct mirrored boot highlights to the shared upper-left light. Keep head/torso and y=120 anchor fixed. |
| Same file | Column 2 (march), x=96 | The sleeve/bicep connection was patched from canonical pixels and a stray outline pixel removed. Refine the near wrist/elbow junction around local x=25..40,y=49..69 and separate the far hand from the raised thigh around x=67..77,y=72..83. Keep opposite-side opposition readable. |
| `art/source/hero-core-study.aseprite` | Timeline frame 1, 160x96 | Redraw/check posterior head and neck support, upper-back contact, near/far forearm separation and distinct sole contacts. Improve the regional leg/arm layer boundaries near the hand/hip overlap. Do not label as a validated demonstration. |
| `art/source/hero-equipment.aseprite` | Veteran row 2; columns 2,8,9 | Hand-polish cloak attachment/folds and leg cutouts. This gear is intentionally absent from workouts. |
| `art/source/hero-training-outfit.aseprite` | Rows 1..3; movement columns | Refine the soft cuff masks and small stage accents without covering wrists, knees or ankles. All stages must keep the same underlying body. |

Columns are sprite-strip columns, not extra timeline frames. Core's head, torso,
arms and legs are region-separated artwork, not a finished articulated rig.
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

One-time scripts `refine-character.lua` / `align-walk-keys.lua` document this pass;
normal export does not rerun destructive pose edits. The first refuses an already
prepared training master. Approved village/environment art was not regenerated.

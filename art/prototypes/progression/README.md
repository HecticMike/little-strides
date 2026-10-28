# Beginner / Veteran physique prototype

**Review only. Not used by the app.** The live character progression and the
provisional core study are untouched. These are fictional character rewards,
not claims about measured physical changes in the player.

- [Comparison PNG](comparison.png) / [self-contained, native-size HTML](comparison.html).
- Editable master: `hero-progression.aseprite`, 192x256 RGBA, shared 45-colour palette.
- Columns: idle x=0; march x=96. Rows: unchanged Beginner y=0; Veteran study y=128.
  Each cell remains 96x128 with foot anchor y=120. These are strip cells, not
  additional timeline animation frames.

## Assessment

This is a visibly stronger direction than the earlier one/two-pixel proposal.
The native 48x64 shoulder band averages 17.6 pixels for Beginner and 22.0/21.8
for Veteran idle/march: roughly four display pixels wider, while the waist and
legs retain their existing size. Head, face, hair, palette and overall height
are unchanged. The opened chest and shoulder contour read as a more athletic,
confident version of the same person; posture changes are restrained rather
than a new stance or longer skeleton.

The unlabelled, single-colour silhouettes and identical-trim controls retain the
difference without stage gear or labels. Workout-size samples make it clearer.
The cloak still contributes strongly to adventure-stage recognition; do not
use the equipped pair alone to judge the body change.

**Recommendation:** visually successful as a proof of concept, practical as a
shared-body art direction. Approve the silhouette before a pose-by-pose rollout.
Do not automatically stretch every remaining pose: raised arms, bent elbows and
contact positions need individual masks. Idle/blink/walk should inherit one
registered torso design; march/calf/reach need consistent limb volumes and both
outfits refitted to the same body. This prototype does not implement that rollout. Full integration would require
stage-specific body selection before equipment in the shared React/Phaser avatar
compositor, rather than separate renderers or independently drawn outfits. The
current 96x128 frame and 960x384 composed-atlas budget can be retained. An
intermediate Adventurer body would also need approval; it is not prototyped here.

## Editing and reproducible export

One body supplies both clothing views. The nine editable pixel layers separate
body outfit/boots, skin/face and canonical hair; adventure cloak/pack/scarf;
workout cuffs/seams; and an identical-Beginner-trim comparison control. Layer
visibility selects clothing, never a separately generated exercise character.
These are raster component layers, not a skeletal rig. Protect the unchanged
Beginner row when editing the Veteran cells.

Run from Little Strides:

```text
npm run art:export -- --progression-prototype
```

This only exports the separate study, validates identity/palette/anchors/native
visibility and recreates the comparison/metadata. It preserves manual Aseprite
edits and does not regenerate the master. `ASEPRITE_PATH` uses the existing
pipeline convention. `scripts/prototype-progression.lua` records the one-time
construction from the approved masters and refuses to overwrite this source.

`mobile-reference.json` was measured from the unchanged running app at 375x667:
343x328.15625 artwork region; canvas box 231x324.15625 with 10/20px vertical
padding. Comparison crops reproduce those CSS sizes, original background and
countdown. View the HTML or PNG at 100% to judge scale. If workout CSS changes,
start the existing local preview and run the command above with `--measure`.
That single isolated browser measurement uses existing test opt-ins only; it
does not enable exercises in the app or require full mobile regression tests.

## Exact manual polish before integration

In `hero-progression.aseprite`, **Veteran row y=128** (coordinates below local to
each 96x128 cell):

- Idle column x=0: refine shoulder/sleeve-to-bicep joins at x=26..42,y=42..59
  and x=67..79,y=44..65. Recluster the widened pixels around elbow contours;
  retain the unchanged head, hand sizes and leg/foot registration.
- March column x=96: refine the sleeve/raised upper-arm transition at
  x=24..42,y=46..57 and elbow/fist junction y=53..67. The existing fist/fingers
  were translated as a fixed-width part; do not inflate the hand.
- Both columns: soften the new chest highlight/flank fold at x=38..66,y=44..64.
  Fit scarf/strap shoulder joins at x=30..77,y=38..53 and cloak edges around
  y=63..86. No new accessory design or anatomy is needed.

The initial body uses nearest-neighbour contour reshaping plus shared-palette
cloth clusters. It is an editable visual study, not finished hand-polished
anatomy or a clinically approved demonstration. Existing exercise locks remain.
## Verification

- All six existing art tests PASS (`node --test tests/art.test.mjs`).
- Export checks: Beginner body/workout pixels unchanged; both prototype heads
  and lower legs pixel-identical; shared palette only; common y=119 baseline;
  at least three native shoulder pixels of differentiation in each pose.
- Nine prototype outputs/source/reference files repeat byte-identically.
  Twenty-six existing live/core files remain byte-identical after both normal
  and prototype export paths. No runtime code, live progression, workout rules,
  village or core-study edits. Full mobile regression was not run.
- Comparison reviewed visually at 2x, 48x64 and measured mobile artwork size.
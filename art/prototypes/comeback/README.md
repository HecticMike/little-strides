# Comeback proof — first approval milestone

This is increment 1 of the approved redesign, **not a live app replacement**. The user accepted the direction; structural character quality remains provisional.
The runtime, exercise eligibility, existing art, history and rewards are unchanged.

## Review

- Open `structural-review.html` (or PNG) for the broad before/after review; findings and priorities are in `design-audit.md`.
- Open `comparison.html` for native-size sprites and actual 375 × 667 Today/workout captures.
- Open `exercise-review.html` for the 12-entry mobile review matrix and catalogue gaps.
- `generated-character-concept.png` is a **flattened, built-in-imagegen concept reference**, not an editable production sprite. The exact generation prompt is in `concept-prompt.txt`.
- `character.aseprite` and `studio.aseprite` are separately authored **native-grid** masters. They do not import, trace or downsample the generated reference.

## Style and shared character

Character: 48 × 64 standing cells, 96 × 64 heel-slide cells; 18 opaque colours in the current export. Same teal shirt, charcoal shorts, cream trainers, hair, face, height and window-led upper-right light direction at both stages. Shoulders/arms broaden without changing shoes, standing height or facial pixels. These are fictional development endpoints; no measured physique or clinical claim.

The source layout is a 192 × 128 canvas: starting/developed standing at (0,0)/(48,0); starting/developed heel slide at (0,64)/(96,64). Blank atlas space is intentional. Studio: 160 × 96, separate architecture, floorboards, window/neighbourhood, sunlight, details, plant and mat layers. The Today crop removes 16 logical pixels at the top; workout uses a lower-room crop. Enlargement uses nearest-neighbour; no generated painting is reduced into sprites.

## Edit and export

1. Open `character.aseprite`. Edit the named pose/stage part layers. Preserve standing opaque foot baseline y=61 and the common head registration. Head layers are registered duplicate artwork, **not a linked anatomical rig**: apply head corrections to both matching stage layers.
2. Open `studio.aseprite` to edit its nine meaningful environment layers. `Workout / Side-view mat` is intentionally hidden in the room view. The exporter derives `studio-workout.png` from architecture/light only and `studio-workout-mat.png` from that independent mat layer, without saving visibility changes. Keep character pixels out of the room master.
3. Run `npm run art:export -- --comeback-proof`. It exports only these masters, reviews and captures; it does not run live art exports. Both browser engines installed for the existing Playwright suite are required.
4. Run `node --test tests/comeback-proof.test.mjs`. Normal `npm run art:export` remains the existing live workflow. The two `refine-comeback-*.lua` scripts record one-time structural edits and refuse to repeat; they are not export steps.

`create-comeback-proof.lua` records the one-time native pixel authoring and refuses to overwrite either master. Normal export preserves manual edits. Do not delete masters to rerun authoring.

## Remaining substantial manual artwork

- Confirm the overall adult character design before polishing isolated pixels: head-to-body balance, natural shoulder/neck connection, arm length, hand placement, hip/leg balance and restrained physique changes. Compare at native size and 3x enlargement. This pass improves construction but is not a finished professional model sheet.
- `character.aseprite`, standing cells: shared head/neck at local x=19-29, y=2-17; shoulder/sleeve/upper-arm joins x=10-36, y=17-32; wrists/hands y=35-41; shorts/crotch/knees x=16-33, y=34-52. Validate joint continuity across the whole silhouette rather than adding muscle lines to the shirt.
- Heel-slide cells: profile/neck support x=6-24, y=44-59; shoulder/elbow/forearm/hand x=23-51, y=52-60; near partially extended knee/shin x=47-87, y=46-60; far knee/ankle/foot x=45-80, y=36-60. The near heel is supported; the knee is partway through the slide. The far arm is largely occluded in this strict profile; do not invent an unrelated visible limb. Add 64 to local y and 96 to developed-cell x.
- Posture, support and movement-specific anatomy remain unvalidated. No new pose, walking frame, eligibility or dose was added. Before a production pose set, the character needs coherent front/profile references and manual anatomical review.
- Room: the detached wall wedge is removed; the floor-only light retains board grain/seams. The workout excludes cropped window/plant props and the room mat, then uses exactly one independent side-view mat. Further scene detail is lower priority than the character model.

**Next:** use this structural review to settle the character drawing before producing intermediate stages/walking or the full exercise catalogue. The overall direction is accepted. Training/profile/feedback implementation remains the next functional increment; live replacement still follows the approved plan.

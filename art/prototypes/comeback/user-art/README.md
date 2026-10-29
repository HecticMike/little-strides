# Supplied character and Sunlit room — corrected source preparation

The rejected head rotation and artificial neck bridge have been removed. **Each supplied heel-slide head, neck and shoulder stays with its original torso.** The overall source pose is preserved; no detached head is rotated or transplanted. Standing appearance and preferred game proportions are retained.

## Review

Open `comparison.html` / `comparison.png`, or the individual Today/workout HTML/PNG captures. These remain review-only layouts, not a live app deployment. Eight WebKit/Chromium cases cover both stages on phone viewports.

## Source choice and fidelity

- Apartment is now **Sunlit Pixel-Art Home Workout Room.png**, preserved at its original **1620 x 971** resolution. The 160x96/64-colour conversion is not used. The exported source has zero pixel differences from the original; phone canvases sample the detailed source directly rather than enlarging a low-resolution intermediate.
- `studio.aseprite` is honestly one flattened original background, not layered/reconstructed furniture or lighting. The original fits within a 2048px texture edge. No generation or background repaint was performed.
- Original images and SHA-256 records are in `art/direction/comeback-user/sources.json`; `_uploads` is untouched. Previous converted apartment is retained only as provenance.
- The failed rotation version is retained under `rejected-rotation` for review history, not referenced by the current export.

## Aseprite masters

- `character.aseprite`: 384x256 material/region atlas. Standing cells are 96x128 at (0,0) and (96,0); heel-slide cells are 192x128 at (0,128) and (192,128). Visible shirt/shorts/limb pixels are separated for editing, but hidden anatomy is not reconstructed and this is not a skeleton rig.
- `heads.aseprite`: shared standing head placements plus **source-matched floor head/neck/shoulder junctions** for the supplied stages. Floor junctions are deliberately kept together to preserve the drawing, not forced to use an independently pasted head. Edit this master for head/junction changes; it is authoritative for export.
- `studio.aseprite`: full-detail Sunlit original. Edit only if an actual source-art change is intended.

Standing source pixels are enlarged exactly 2x from the previously accepted preparation. Floor poses are refitted from the original complete uploads at a higher working resolution, with cleaned binary alpha and the same 27-colour character palette. At game scale they can display at half working size. This retains the original game proportions while reducing loss at the head/neck.

`registered-floor-source.png` records the complete registered floor poses before region separation. Exported floor images must equal that reference exactly; the regression check rejects another head rotation, paste or invented neck bridge. This is a fidelity check, **not a claim of correct or clinically validated anatomy**.

## Export

Run `npm run art:export -- --comeback-user-art` and `npm test`.

Export reads all three masters and composes body/junction layers without changing masters or saved visibility. It refreshes source PNGs, inventory, self-contained comparisons and eight phone captures. Workout composition uses the Sunlit room's mat once. No extra background mat or independent head transform is applied.

The older import/refine/head-source scripts record superseded preparation and must not be rerun. `restore-comeback-source-poses.lua` documents this one-time restoration and refuses repeated authoring. Apply future manual edits directly to the current masters.

## Remaining work

The supplied floor drawing remains a stylised, unreviewed illustration. Any future anatomy correction must be assessed as a complete pose, including shoulder support and limb contact, rather than rotating a head cutout or treating connected pixels as an anatomical validation. Existing clinical locks and live exercise behaviour are unchanged. No further generated image is requested.

## Supplied Easy march still

The newly uploaded starting-character pose is integrated into the comeback build, not the published release. `march-comparison.png` shows approved standing on the left and the new march on the right, enlarged and at48x64 display scale. It is a single exercise still, not a walk cycle or locomotion system.

- Original byte-identical PNG: `art/direction/comeback-user/starting-march.png`; separate `march-source.json` records upload name, hash and dimensions. The existing six-source manifest and originals remain unchanged.
- Editable source: `march.aseprite`,96x128 working pixels /48x64 logical grid, one frame. Eight visible body-region layers separate collar, shirt, arms/hands, pelvis/shorts, planted and lifted legs/trainers, and remaining outlines. Hidden anatomy is not reconstructed; this is not an articulated rig or a professional hand-authored sprite.
- The head preview is for editing context. Export reads the authoritative upright head directly from `heads.aseprite` (rows0-41); edit head identity there. No head rotation, new neck bridge or changes to the lying study were made.
- Edit the body layers in Aseprite on the2x2 working grid. Keep the planted sole atrow123 and clear margins. Keep the existing27-colour palette and opaque/transparent pixels. Do not change the starting physique or draw the developed stage into this frame.
- Export: `npm run art:export -- --comeback-runtime` (included in normal `npm run art:export`). Only masters are read; the guarded import script and diagnostic fit script are one-time preparation history and should not be rerun over edits.
- `march-export.json` records layer inventory, head equality, binary alpha, registration and connected silhouette. `march-export-verification.json` records unchanged source masters and byte-identical repeat exports.

Current limitations: stylised illustration, anatomically/clinically unreviewed. Both stages now have separate matching marching stills; the supplied Developed source is documented below. No exercise was enabled or unlocked through art integration. Raised-foot contact and body balance remain artist-review points if refinement is requested; no animation was manufactured from this single image.


## Supplied supine abdominal-bracing setup

The starting-character upload `Supine Pixel Hero Sprite.png` is preserved byte-identically as `art/direction/comeback-user/starting-supine.png`; `supine-source.json` records provenance. No image generation or replacement of approved art was required. The original has soft alpha/glow; preparation removes that halo and maps the opaque figure to the same27-colour palette.

`supine-start.aseprite` is a192x128 working canvas with one still frame. Seven visible pose-region layers separate near/far bent legs and trainers, pelvis/shorts, shirt, visible forearm/hand, support contours, and the **complete head/neck/upper-back junction**. A hidden reference layer retains the complete registered pose. These are editable visible regions from the supplied drawing, not reconstructed hidden anatomy or a skeleton rig.

Edit the head and neck together in this pose master; do not replace them with the upright head or rotate a detached head. Keep both knees/feet distinct and the original support/perspective. The far arm is occluded in the supplied view and has not been invented; exposing it would require a deliberate manual redraw. The source remains anatomically unreviewed.

Export with `npm run art:export -- --comeback-runtime`, or normal `npm run art:export`. Export reads the master without modifying it, skips the hidden reference, and writes `public/art/comeback-bracing.png`, the prototype PNG, `supine-export.json` and `supine-comparison.png`. The report records zero source/junction pixel differences, binary alpha, palette/registration and visible layer counts. `supine-export-verification.json` records repeatability. Do not rerun the guarded import script over manual edits.

App usage is **starting position only** for the existing abdominal-bracing and pelvic-tilt IDs. Each retains its own written instructions and no repetition target. The common knees-bent setup does not depict an abdominal contraction or a pelvic tilt; pelvic tilts explicitly say that the tilt is not depicted. This setup is not mapped to glute bridge or other movements. The Starting source remains unchanged; Developed now has its own supplied setup master, documented below. No clinical eligibility, loading classification or exercise lock changes. Existing heel-slide, standing, marching and apartment masters are unchanged.


## Supplied glute-bridge raised position

`art/direction/comeback-user/starting-bridge.png` is the byte-identical1536x1024 upload; `bridge-source.json` records its provenance. Preparation removes the soft-alpha glow, preserves the complete source pose and applies the existing palette. The source illustration is anatomically/clinically unreviewed.

`bridge.aseprite` is a192x128 working canvas with one frame. Eight visible regions separate near/far legs/trainers, raised pelvis/shorts, shirt, both supplied forearms/hands, torso contours, and the intact head/neck/shoulder junction. The hidden complete-reference layer is not exported. These are editable visible pixels, not an articulated rig or reconstructed occluded anatomy. Keep the head/neck/shoulders together; no detached-head rotation or synthetic neck bridge was used.

Edit visible layers directly in Aseprite and export with `npm run art:export -- --comeback-runtime` (also included by normal `npm run art:export`). Keep the shared palette, clear margins and support baseline121. The guarded import script is preparation history and must not overwrite manual edits. Export reads the master without modifying it and writes `public/art/comeback-bridge.png`, native export, report and comparison.

`bridge-comparison.png` shows setup on the upper left and raised bridge on the upper right, then the raised pose enlarged and at working size. `bridge-export.json` records zero source/head-junction differences, binary alpha and layer inventory. `bridge-export-verification.json` records repeat exports and unchanged masters.

The app maps this original asset only to Starting glute bridge; Developed now has its separate supplied master below. It is labelled **raised position only** with the existing lift/lower instructions and no repetition target; no complete motion cycle or timed hold is implied. Developed now uses its separate matching bridge source, documented below. Existing clinical locks, source artwork and exercise loading metadata remain unchanged. Any future anatomy refinement should review frame1's head/shoulder support, knees and contact points as a complete drawing.


## Calf-raise still from the approved standing character

`calf.aseprite` is a192x132 atlas: Starting in the left96px cell, Developed in the right. One still frame; no walk cycle. Both use the existing canonical body layers and shared upright heads without changing physique, proportion or identity. Only the separately editable trainers were angled and five small logical-pixel clusters cleaned up for contact. `calf-source.json` and the guarded preparation scripts record the derivation; no generated image or new uploaded source was required.

Edit the `Raised heels / Starting|Developed / Near trainer` and `Far trainer` layers on the2x2 working grid. Other named body regions remain independently editable. The `Preview / ... shared canonical head` layers are context only: the exporter reads `heads.aseprite` as the authoritative head. Keep toe contact within the132px frame; ground alignment is4 working pixels below the normal standing frame, so the renderer raises the sprite4px relative to the floor. Do not stretch the torso or detach/rotate the head.

Run `npm run art:export -- --comeback-runtime` (also included by normal `npm run art:export`). Export reads the edited master without modifying it; guarded import/contact-cleanup scripts must not overwrite manual edits. Outputs: `calf.png`, `public/art/comeback-calf.png`, `calf-export.json`, `calf-comparison.png`. The comparison columns are Starting standing/raised, Developed standing/raised; rows show enlarged whole figures, trainer details, approximately144px workout width, and48px logical thumbnails. `calf-export-verification.json` records unchanged prior artwork/masters and byte-identical exports.

This is an **unreviewed raised-heels still**, not a complete lift/lower cycle, balance instruction or clinical demonstration. Existing written support/lift/lower cue and honest pacing remain. Manual artist-review points, if refinement is needed: frame1's far trainer toe/heel silhouette and both ankle/trainer junctions in each cell. Clinical/anatomical review remains separate; no exercise is unlocked by this artwork. Both current stages now have matching artwork for all six initial-profile eligible movements.


## Coverage review and Developed supine source

`coverage-review.png` compares the current Starting/Developed workout assets, including honest blank cells. `coverage-review.json` is generated from the real catalogue, art registry and isolated planner scenarios by `node scripts/review-comeback-art.mjs`; the script also writes self-contained `coverage-review.html`. No runtime assets or Aseprite masters are modified. Starting has illustrations for all six currently profile-eligible movements. Developed now has6/6: separate supplied marching, supine and bridge stills cover their matching stages. Locked/profile-excluded candidates do not justify generating further art now.

Completed source brief for the supplied `Resting Pixel Hero Sprite.png`: attach `_uploads/Supine Pixel Hero Sprite.png` for the exact pose/camera and `_uploads/Athletic Teal-Shirt Pixel Sprite.png` for the Developed physique/identity. Produce a1536x1024 PNG with real alpha transparency, whole figure centred with10% clear margins. Target final preparation is192x128 working pixels, so preserve chunky pixel clusters and a clear silhouette; no painterly detail, blur, glow, ground, cast shadow, furniture or text.

Match the existing supine pose: head right, feet left, same shallow three-quarter side view; back, pelvis and head resting on one implied floor; both knees bent and both soles planted; arms relaxed alongside the body. Preserve natural supported head/neck/upper-back continuity, distinct knees/feet and hands, and moderate normal limb proportions. Use the same canonical face, brown hair, skin, teal shirt, dark shorts and pale trainers as the Developed standing reference, with its moderately athletic shoulders/arms/legs. Do not redesign the outfit, inflate muscles, lift the pelvis into a bridge, extend a leg, raise the head or turn the head into an upright portrait. This is a neutral setup still only, not a movement cycle or clinically validated demonstration.


`supine-developed.aseprite` is the editable192x128 one-frame master for that upload. Seven visible regions separate both bent legs/trainers, pelvis/shorts, shirt shading, visible forearm/hand, support contours and the intact head/neck/upper-back. The complete reference is hidden and excluded from export. This is a supplied generated drawing separated into editable visible pixels, not a reconstructed skeleton or hidden anatomy. The original1536x1024 PNG is preserved byte-identically as `art/direction/comeback-user/developed-supine.png`, with `supine-developed-source.json` provenance. Its soft-alpha glow is removed by the same240 threshold and27-colour palette fit as the Starting setup; no head rotation, transplant, neck bridge or proportion changes were made.

Edit the head/neck/shoulder region together in this pose master, not the upright head master. Keep feet, pelvis and head support consistent, both knees/soles legible and the existing support baseline121. The far arm remains occluded; no hidden arm was invented. Export with `npm run art:export -- --comeback-runtime` or normal `npm run art:export`. The shared read-only supine exporter writes `supine-developed.png`, `public/art/comeback-bracing-developed.png`, the report and enlarged/native comparison. Guarded preparation scripts must not overwrite manual edits. `supine-developed-export-verification.json` records preserved prior art and repeatability.

Only Developed bracing/pelvic tilts use this new PNG. Starting still uses its unchanged original. Both captions retain starting-position-only wording and self-paced/no-rep-target instructions; pelvic tilt explicitly says the tilt is not depicted. This is anatomically/clinically unreviewed. Any further artist review should focus on frame1's complete head/neck support and near/far knee/foot contacts, rather than moving detached parts. Physique differences in this supplied supine pose are modest; no synthetic muscle enlargement was applied.


## Supplied Developed marching still

`march-developed.aseprite` is a96x128 working /48x64 logical one-frame master. Eight visible body-region layers separate collar, shirt, both arms/hands, pelvis/shorts, planted leg/trainer, lifted leg/trainer and remaining outlines. The shared-head preview provides editing context; export reads the authoritative Developed upright head from `heads.aseprite` (second96px cell, rows0-41). Body pixels below row42 remain exactly the fitted supplied pose. No head rotation, hidden anatomy or walking animation was introduced. This is editable visible artwork from a supplied generated image, not an articulated rig or professionally validated demonstration.

Original1024x1536 `_uploads/Marching Pixel-Art Boy Sprite.png` is preserved byte-identically as `art/direction/comeback-user/developed-march.png`; `march-developed-source.json` records provenance. The existing alpha threshold/shared27-colour palette fit removes glow. Export uses23 colours, binary alpha, exact2x2 logical blocks, planted sole row123 and one connected silhouette. Starting's master and exported PNG remain unchanged.

Edit the body layers directly in Aseprite on the2x2 grid; preserve planted sole123, clear margins and the head/collar registration. Edit canonical head identity in `heads.aseprite`, not the preview layer. Run `npm run art:export -- --comeback-runtime` or normal `npm run art:export`. The shared exporter reads both marching masters without modifying them and writes per-stage PNG/report/comparison plus runtime assets. Guarded import/fit scripts are preparation history and must not overwrite manual edits. `march-developed-export-verification.json` records unchanged masters/prior artwork and reproducibility.

The app uses this still only for Developed Easy march, with the existing provisional label, movement cue and honestly labelled pacing. It does not depict a complete step cycle or measured repetitions. Frame1 collar junction, planted ankle/foot balance and raised-knee silhouette remain manual artist/anatomy review points if refinement is required. Clinical status/eligibility, recovery, history and rewards are unchanged. The Developed bridge source is now integrated below, completing both current stages for the initial-profile pool.


## Supplied Developed bridge raised-position still

`bridge-developed.aseprite` is the192x128, one-frame editable master for `_uploads/Pixel Art Glute Bridge Sprite_new.png`. The original1536x1024 PNG is preserved byte-identically as `art/direction/comeback-user/developed-bridge.png`, with `bridge-developed-source.json` provenance. Existing alpha240/shared-palette preparation removes glow without changing the complete source pose; the prepared image has172x59 opaque bounds, baseline121,22 colours and binary alpha.

Eight visible regions separate near/far bent legs/trainers, raised pelvis/shorts, shirt shading, both visible forearms/hands, support contours and the intact head/neck/shoulder junction. A hidden complete reference is excluded from export. These are editable visible regions from supplied generated artwork, not reconstructed hidden anatomy or a rig. Edit frame1 head/neck/shoulder pixels together; do not rotate or transplant the upright head. Preserve the source support/perspective and distinct knees, feet and hands. Those junctions and contacts remain specific manual artist/anatomy review points if refinement is requested.

Run `npm run art:export -- --comeback-runtime` or normal `npm run art:export`. The shared exporter reads both bridge masters without modifying them and writes `bridge-developed.png`, `public/art/comeback-bridge-developed.png`, the report and setup/raised comparison using the matching Developed supine source. Guarded import/fit scripts must not overwrite edits. `bridge-developed-export-verification.json` records preserved earlier art, unchanged masters and byte-identical repeat exports.

App usage is Developed glute bridge only, explicitly **raised position only**, with the existing lift/lower cue and self-paced/no-rep-target indicator. It is not a complete motion cycle, timed-hold prescription or clinically validated demonstration. Starting keeps its original PNG. No exercise eligibility, difficulty, recovery, activity record or reward rule changed.

Both current physique endpoints now have artwork for all six movements eligible under the initial profile. This does not add drawings for excluded/locked candidates, create intermediate physiques or establish individual clinical suitability. No further source image is requested for the current pool. Next is the personal-alpha readiness review and physical iPhone checks, with current coverage/recovery limitations kept visible.


## Isolated progression silhouette study

Current endpoint masters remain unchanged. See [the standing silhouette study](../stage-study/README.md)
for a broader-build proposal, native/mobile-size comparison and exact Aseprite review
points. Export separately with `npm run art:export -- --comeback-stage-study`. It is
not a live stage or exercise demonstration, and is not included in runtime exports.

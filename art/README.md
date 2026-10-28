# Hearthwood artwork

The approved village artwork is preserved. The focused character pass reused existing sprites and generated one provisional core-study seed.
Runtime PNGs are exported from editable masters with `npm run art:export`.
The export also refreshes [source-inventory.json](source-inventory.json), listing
actual dimensions, layer names and nontransparent pixel counts.

## What is editable, and what is flattened?

| Master | Actual structure |
| --- | --- |
| `hero-body.aseprite` | Outfit/boots, skin/face and hair layers, plus a separate revealed-trouser-edge layer for the walk keys. These are colour/part masks across a pose strip, not a fully separated anatomical animation rig. |
| `hero-equipment.aseprite` | Separate cloak, leather pack/straps and scarf masks; two stage rows. |
| `buildings.aseprite` | Original/restored workshop roof, walls/doorway, chimney and state-specific timber/canvas or window/banner layers. Column 0 remains a flattened lodge reference, unused by Phaser. |
| `workshop-context.aseprite` | Separate approach/foliage, workbench/tools/barrels and foreground fence/stored stone. The structure has a transparent cutout. |
| `village-ground.aseprite` | Flattened painted terrain/lodge, with the entire workshop patch removed. This is not a seamless terrain tileset. |
| `village-foreground.aseprite` | Canopy and garden-fence occlusion masks. These are extracted painted pixels, not separately authored trees. |
| `vista.aseprite`, `training.aseprite` | Flattened crops used as Today/workout backgrounds. |
| `tiles.aseprite` | Flattened small legacy strip. |
| `icons.aseprite` | Eight independently editable 24px UI/world glyph layers, drawn natively in Aseprite. |
| `app-icon.aseprite` | Seven native pixel layers: enamel, frame, path, ferns, both boots and highlights. |

The workshop components are region-separated existing artwork, not reconstructed
architectural models. Layer separation supports meaningful pixel editing of roofs,
walls and details while preserving the approved materials and perspective.

## Registration and rendering

- World textures: 640x576, displayed in the existing 320x288 coordinate system.
- Workshop context: 280x300. Structure strip: 840x300, three 280x300 columns:
  flattened lodge reference, original workshop, restored workshop.
- Both context and structure are placed at world (180,12) at half source size.
  Their alpha masks are disjoint and cover the removed backdrop exactly. The
  original building is no longer painted underneath its restoration.
- Original scene reconstruction is pixel-exact. Restoration changes 28,054
  structural pixels; the shared terrain, workbench and fence remain unchanged.
- Foreground masks, player, interactive crest/route marker and lantern glow are
  independent Phaser objects. Painted lodge smoke remains static; duplicate
  rectangle smoke was removed. Lantern light subtly pulses unless reduced motion
  is requested. There is no claim that every environmental detail is animated.
- Canvas rendering, pixel rounding and nearest-neighbour scaling remain enabled.
  The village character now uses the same 2:1 source scale as the scenery instead
  of fractional 3:8 sampling. Its foot anchor is source y=120.
- Walking uses two existing contact keys with the neutral key between them.
  No extra sprites were generated. Fully hand-polished weight transfer remains.

## Canonical character and exercises

One shared 96x128 character body supplies Today, Phaser and the workout canvas.
Adventure and light training equipment are separate overlays on that exact body. The 960x384 composed atlas fits below 1024 on both edges.
The character uses the shared 45-colour palette; scenery uses 192 colours plus
transparency. There are no external runtime images/fonts or new dependencies.

Columns remain stand, march, squat, push, calf, reach, lying, walk-a, walk-b,
idle-blink. Squat/push/lying art is withheld, not replaced by an unrelated movement.
Beginner uses the base; Adventurer adds scarf/pack; Veteran adds cloak. These
fictional rewards do not measure the user's body.

The mobile composition prioritises the existing differentiated march and reach
keys. All movement artwork remains stylised and clinically unvalidated. Calf-raise
heel/contact clarity, stage cloth fit and anatomical review remain manual tasks.
Exercise opt-ins, disabled/locked candidates and written cues are unchanged.

## Minimum Aseprite editing steps

1. Open the relevant master and keep its dimensions, column order and foot anchor.
   Use `art/palette.gpl` for the character; retain the scenery masters' indexed
   palette. Paint the shared character layers rather than creating separate
   village/workout people.
2. For workshop edits, use the Original or Restored layers in the corresponding
   column. Edit terrain/tools/fence in `workshop-context.aseprite`, not a second
   painted copy of them. Keep paint within the existing masks for simple edits.
   Extending a structural silhouette requires clearing matching context pixels
   in BOTH states and reviewing collision boundaries.
3. Run `npm run art:export`. This preserves manual masters and refreshes PNGs,
   avatar metadata and the factual source inventory.
4. `npm run art:motion` refreshes blink only and preserves authored walk-a/b.
   `npm run art:compare` recreates the labelled final character comparison.
5. Run `npm test`, `npm run build`, start `npm run preview`, then run
   `npm run test:mobile`. Refinement screenshots are in `screenshots/refinement`.
   The pixel-reconstruction check deliberately guards the approved appearance;
   review intentional art changes before changing its reference.

Aseprite defaults to `C:/Program Files/Aseprite/Aseprite.exe`; set `ASEPRITE_PATH`
on another machine. `refine-village-assets.lua` records the one-time lossless split
and refuses an already layered source. The earlier import now refuses to flatten
these refined masters. Neither script runs during normal export/build. Generated
originals and historical prompts in `art/direction` are design provenance, not
runtime assets or production animation rigs.

Remaining manual work: anatomical/heel-contact review; more natural walking weight
transfer; cloak fitting; optional future separation of the flattened lodge,
terrain and backgrounds. A full tilemap conversion is not required for this area.

## Focused character pass

See [the character audit](review/character-audit.md) for measured registration fixes,
light outfit architecture, the review-only core study, exact manual frame/column
corrections and reproduction commands. The old runtime lying slot remains withheld.
New editable masters: `hero-training-outfit.aseprite` and `hero-core-study.aseprite`.
Neither is a claim of clinically validated or finished professional anatomy.

## Core exercise illustrations (2026-10-28)

Four new sibling masters cover abdominal bracing, pelvic tilt, heel slide and
bilateral bridge: `art/source/hero-core-<exercise-id>.aseprite`. The historical
`hero-core-study.aseprite` is unchanged and its `lying` slot remains withheld.

These are **illustrative, clinically unvalidated** images, not exercise approval.
Dead bug, wall push and squat retain their existing locks. Bracing and pelvic tilt
share a similar supported start position; pelvic movement is deliberately subtle,
so the existing written cue remains essential. No new dose or movement is prescribed.

Each new master has editable colour/part masks for skin/face, hair, shirt,
trousers/footwear and outline/details, plus hidden Adventurer/Veteran cuffs. These
are meaningful pixel layers, not a fully articulated anatomical rig. All stages
share one physique, canonical identity/palette and the existing progression model.
The physique prototype is unchanged.

Edit a master in Aseprite, keep the 192x128 frame and registered support baseline,
then run `npm run art:export`. `scripts/export-core-illustrations.lua` exports four
columns and three stage rows to `public/art/hero-core-poses.png`; runtime crops
are defined in `CORE_ILLUSTRATIONS.viewport`. Normal export preserves manual edits.
`import-core-illustrations.lua` is a one-time seed import and refuses existing masters.

Built-in image generation produced the four seeds. Exact prompts and unchanged
originals are in `art/direction/core-illustrations/`. Aseprite performs alpha cleanup,
common-scale sampling and shared-palette conversion. Remaining manual refinement:
far-arm visibility, exact neck/support contacts, and subtle pelvic movement cues.
All new artwork stays labelled illustrative in the app.

## Alpha launcher and interface icons

`app-icon.aseprite` is the 64x64 logical master for the boots-and-trail emblem.
`icons.aseprite` is a 192x24 strip: Today boots, Village cottage, Journal book,
Settings mechanism, progress medal, stage shield, timber bundle, garden flower.
The UI uses native 24px frames. Phaser reads the same frame size and retains the
prior world-space sizes of its workshop marker and garden flowers.

Edit the masters in Aseprite, then run `npm run art:export`. The export creates
192/512px general launcher icons, a 512px Android maskable variant, a 180px Apple
touch icon and a 32px favicon under `public/icons/strides-*.png`. Nearest-neighbour
sampling preserves the pixel edges. The maskable variant omits the decorative
frame; both boots must remain inside the central radius-25.6px safe circle.
The background stays fully opaque; system launchers apply their own corner masks.
The measured audit is saved in `art/review/interface-audit.json`.

`create-interface-art.lua` is the guarded one-time drawing recipe; normal export
never overwrites the source masters. `refine-launcher-background.lua` records the
native enamel/frame refinement. `append-garden-icon.lua` records the lossless atlas
extension. The old asset-seed generator skips install icons once this master exists.
Legacy icon filenames remain exported as aliases; the current manifest/Apple links
use fresh filenames so new installations request the updated artwork.

## Chapter I assets

See [chapter production and manual-edit notes](../docs/chapter_one.md#artwork-editing)
for registered material masks, the actual-workshop crest patch, native nine-slice
masters, honestly flattened discovery landscapes and reproducible exports.
The canonical character and physique prototype were not regenerated.

## Walking and floor-contact refinement (2026-10-28)

`hero-body.aseprite` Walk A/B (columns 8/9, zero-based 7/8) now use a wider
alternating stride, lifted swing foot and opposing forearms. Head/central shirt
registration and the y=119 supporting sole remain fixed. The existing gait cycles
with distance travelled; Reduce Motion intentionally simplifies travel.
`hero-equipment.aseprite` cloak masks follow the changed silhouette. No height,
face, physique prototype or other pose was changed.

Each `hero-core-{abdominal-bracing,pelvic-tilt,heel-slide,glute-bridge}.aseprite`
now has a separate editable **Shared mat and contact shadow** layer. Anatomy is
unchanged and remains illustrative, not clinically validated. The old
`hero-core-study.aseprite` is untouched and withheld.

Edit walk knee/boot joins on the existing Outfit and boots layer, and wrist joins
on Skin and face. Keep the canonical head/torso and supporting sole registered.
Review both keys at 48×64 and in the village. Floor pose neck support, far-arm
separation and joint positions still need manual/individual review; the mat does
not validate anatomy. Run `npm run art:export`, then `npm run art:compare`.
`scripts/enhance-motion-and-ground.lua` records the one-time transformation;
normal exports preserve manual edits rather than rerunning this authoring step.

## Walk contact polish and complete pose review

Only `hero-body.aseprite` Walk A/B were edited: resting-arm outlines are removed;
boots now retain their original pixels and proportions during weight transfer,
with the near leg drawn over the far leg. The small area of clothing revealed
by the moved hands has its own editable layer. Head, central torso, palette, every
other pose, character stages and exercise anatomy are unchanged.
`scripts/polish-walk-contacts.lua` records this bounded authoring edit. Do not
rerun it after manual leg edits; normal `npm run art:export` preserves them.

`npm run art:compare` now includes all four floor illustrations at all stages,
as well as the standing/marching/walking crops and withheld core study. It also
reproduces `art/review/walk-animation.gif`: a derived six-frame playback of the
existing gait, with 48×64 village and 96×128 source samples for each stage. It is
a review export, not an independent master or a new runtime animation system.
The HTML is self-contained; playback is optional. PNG/HTML/GIF exports are stable.

Minimum remaining manual exercise-art work (all sources are 192×128):

| Aseprite master | Specific attention |
| --- | --- |
| `hero-core-abdominal-bracing.aseprite` | Head/neck support silhouette (approximately x8–50, y76–119); separate the far forearm/hand from the near arm. |
| `hero-core-pelvic-tilt.aseprite` | Same support/forearm review; the intended subtle pelvic change is difficult to distinguish. Determine an appropriate depiction before changing anatomy. |
| `hero-core-heel-slide.aseprite` | Head/neck support and far forearm; review the extended heel/sole contact and knee silhouette. |
| `hero-core-glute-bridge.aseprite` | Neck/upper-back contact and the near/far arm separation; review hip-to-knee alignment as one pose. |

Use the existing Skin and face, Chestnut hair, Teal training shirt, Trousers and
footwear, Pose outline and details layers. Keep head/face/hair registered together; keep cuffs and Shared mat and contact shadow
separate. Review at the app's actual crop (y56–127) and phone size. These notes
identify art-review regions, not clinical movement instructions. Illustrations
remain unvalidated. The locked `hero-core-study.aseprite` and physique prototype
were not changed. No exercise becomes reviewed or unlocked through an art edit.

## Floor support and arm-separation pass

The four `hero-core-{abdominal-bracing,pelvic-tilt,heel-slide,glute-bridge}.aseprite`
masters now retain their original face/hair pixels through a registered 15-degree
rotation about the neck. The support-line silhouette is trimmed where needed;
facial features were not redrawn. The existing near arm is separated and rotated
8 degrees at the shoulder; a shaded, receding copy supplies the far arm. A shallow
cloth plane and contact shadows make their different resting depths readable.
Pelvis, knee and heel positions remain unchanged. Artwork is still unvalidated.

Meaningful new editable layers in each master:

- `Supine head - face and neck`, `Supine head - collar and contour`, together with
  `Chestnut hair`. Keep these registered when editing the head; body/neck pixels
  also remain in the original `Skin and face` layer.
- `Near forearm - separated`, `Far forearm - shaded depth`.
- `Upper-back support - shirt underside`, `Support contact shadows` and the
  separate `Shared mat and contact shadow` cloth plane.

Normal `npm run art:export` preserves all these layers. The one-time authoring
record is `scripts/refine-floor-support.lua`; it refuses refined masters. Do not
rerun old import/authoring scripts over manual edits. `npm run art:compare` now
reproduces `floor-support-before-after.png` and embeds optional before/after
viewing in the self-contained comparison HTML. The fixed before atlas is the
preceding approved export, not another production character.

Remaining manual review: exact neck/shoulder contact, far-arm perspective and hand
contours in all four named masters; subtle pelvic movement depiction in the tilt;
hip-to-knee alignment in the bridge; extended-heel contact in the slide. These
are art/individual-review tasks, not newly approved movement instructions.
Bracing and tilt deliberately remain similar static positions; written cues
remain essential. The old locked core study, walking/body master, physique
prototype, exercise eligibility and all workout logic were not changed.

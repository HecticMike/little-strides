# Hearthwood artwork

The approved village artwork is preserved. The focused character pass reused existing sprites and generated one provisional core-study seed.
Runtime PNGs are exported from editable masters with `npm run art:export`.
The export also refreshes [source-inventory.json](source-inventory.json), listing
actual dimensions, layer names and nontransparent pixel counts.

## What is editable, and what is flattened?

| Master | Actual structure |
| --- | --- |
| `hero-body.aseprite` | Three genuine pixel layers: outfit/boots, skin/face, hair. These are colour/part masks across a pose strip, not a fully separated anatomical animation rig. |
| `hero-equipment.aseprite` | Separate cloak, leather pack/straps and scarf masks; two stage rows. |
| `buildings.aseprite` | Original/restored workshop roof, walls/doorway, chimney and state-specific timber/canvas or window/banner layers. Column 0 remains a flattened lodge reference, unused by Phaser. |
| `workshop-context.aseprite` | Separate approach/foliage, workbench/tools/barrels and foreground fence/stored stone. The structure has a transparent cutout. |
| `village-ground.aseprite` | Flattened painted terrain/lodge, with the entire workshop patch removed. This is not a seamless terrain tileset. |
| `village-foreground.aseprite` | Canopy and garden-fence occlusion masks. These are extracted painted pixels, not separately authored trees. |
| `vista.aseprite`, `training.aseprite` | Flattened crops used as Today/workout backgrounds. |
| `tiles.aseprite`, `icons.aseprite` | Flattened small legacy strips. |

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

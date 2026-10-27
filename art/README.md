# Hearthwood artwork

The approved direction and generated originals live in `art/direction/`.
Editable production masters are in `art/source/`; runtime PNGs and metadata are in
`public/art/`. No image service, external font or CDN is required at runtime.

## Canonical character

- One 96 ? 128 base body with separate outfit/boots, skin/face and hair layers.
  A shared 45-colour palette is in `art/palette.gpl`.
- Ten stable columns: stand, march, squat, push, calf, reach, lying, walk-a,
  walk-b, idle-blink. Squat, push and lying are deliberately transparent and
  marked unavailable in metadata. Locked exercises show the standing character
  and withheld-demonstration label; no unrelated pose is prescribed.
- Beginner uses the base. Adventurer adds the shared ochre scarf and leather pack.
  Veteran adds the forest cloak. These equipment layers were extracted from
  generated stage references and registered in Aseprite; the face/body is never
  replaced by an independently generated stage character.
- React and Phaser compose the exact same atlas and stage equipment. The atlas is
  960 ? 384, below 1024 pixels on either edge. Equipment is clipped around each
  pose so hands and joints remain readable.
- Three movement keys are stylised illustrations, not clinically reviewed
  demonstrations. Exercise opt-ins, locked candidates and written cues are unchanged.
  Development stages are fictional rewards, not measurements of a user's body.

## Village

The approved composition supplies a small painted 640 ? 576 courtyard, displayed
in the existing 320 ? 288 coordinate system. Its underlying scenery includes the
lodge and vegetation; it is not a newly constructed seamless general-purpose tileset.
Separate canopy/fence layers provide foreground occlusion. A registered workshop
patch changes only the building area after the existing restoration purchase.
All scenery uses one 192-colour palette plus transparency; exported art totals
under 0.8 MB. Phaser uses its canvas renderer at 30 fps for this small sprite count,
with nearest-neighbour rendering and retained pixels in mobile screenshots.

`buildings.aseprite` has three 280 ? 300 columns: lodge reference, original
workshop patch, restored patch. Workshop patches share anchor (180,12) in world
coordinates and are displayed at half source size. The courtyard collision mask
and approach points match the paths/doors. The lodge column is retained for
editing/reference; the runtime lodge is baked into the courtyard.

## Edit and export

1. Open the relevant `art/source/*.aseprite` file in Aseprite. The character body
   has named layers; equipment has separate cloak, pack/straps and scarf layers.
   The world foreground has canopy and fence masks. The ground is an editable
   painted layer, not a hand-separated tile/architecture rig.
2. Keep frame dimensions, pose order, transparency, foot baseline and registration.
   Load `art/palette.gpl` for character work. World masters retain their shared
   indexed scenery palette. Edit both workshop columns against the unchanged base.
3. Run `npm run art:export`. It exports current masters without regenerating them
   and writes canonical frame availability/dimensions to `avatar.json`.
4. If deliberately regenerating the derived second walking contact and blink,
   run `npm run art:motion`, then `npm run art:export`. This preserves artist
   layers and the movement columns, but replaces manual edits to walk-b/blink.
5. Run `npm test`, `npm run build`, `npm run preview`, then
   `npm run test:mobile`. Review Today, Village, all stages, movement keys and
   workshop before/after on a 375-pixel portrait viewport.

Aseprite defaults to `C:/Program Files/Aseprite/Aseprite.exe`; set
`ASEPRITE_PATH` on another machine. `scripts/import-approved-art.lua` records the
ONE-TIME assembly from generated originals, palette reduction and masks. Re-running
it overwrites the corresponding masters; it is intentionally absent from normal
export/build commands. The earlier `art:seed` is a legacy bootstrap, not a way to
recreate the approved artwork. The old 48 ? 64 refinement script refuses these
new masters.

## Finished integration and remaining artwork

Integrated: approved character identity, shared stage composition, three distinct
movement keys, two contact keys/blink, rich small courtyard, foreground masks,
touch boundaries, visible original/restored workshop, mobile presentation and
offline-export pipeline.

Still provisional: hand-polished walking weight transfer/in-betweens; exact cloth
fit at every pose; exercise anatomy/illustration review; original hand-separated
building/terrain tiles. The second walking key derives its lower legs from the
first, rather than being a fully hand-authored animation. The scenery originates
from generated painted artwork, not an artist-authored SNES tile pack. Do not
describe these files as finished professional animation or validated demonstrations.

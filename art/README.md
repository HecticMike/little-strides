# Hearthwood pixel-art system

The editable masters are in `art/source/`. Runtime PNGs and frame metadata are in `public/art/`. These are original initial game assets, not purchased stock art or emoji.

## Style contract

- Warm, muted 16-bit fantasy palette: ink outlines, teal clothing, ochre scarf, auburn hair, cream highlights. `src/art-spec.mjs` is the shared palette/frame/stage contract; `art/palette.gpl` is its Aseprite palette.
- Character frames: 48 × 64, feet on a common baseline, light from upper left, selective 1px outlines and clustered shading. Keep the same head, face, scarf, tunic, boots and limb lengths across poses. No antialiasing or gradients.
- Body sheet: ten columns in the order `stand`, `march`, `squat`, `push`, `calf`, `reach`, `lying`, `walk-a`, `walk-b`, `idle-blink`. The lying image is an identity study only; it is deliberately not assigned to a workout.
- Equipment sheet: same columns, two rows. Adventurer adds the first row; Veteran adds the second. Beginner uses the unmodified base body. The runtime composes all three stages from that same body, preserving identity in React and Phaser. Stages are fictional rewards, not measurements of a person's body.
- World: 16px tile grid in a 320 × 288 area. Buildings: three 96 × 112 frames (training lodge, original workshop, restored workshop). A rewarded workout earns one timber. Approach the workshop and spend one timber to restore its roof, windows, planter and banner; restoration is saved before the short construction effect. Existing Phase 2 restorations are retained.
- Icons: six 16px frames (quest, village, journal, settings, flower, stage crest). The font stays system-based and offline; monospace is limited to headings/short labels.

## Editing and exporting

1. Open the relevant `.aseprite` master in Aseprite. Edit `hero-body.aseprite` for shared appearance; edit `hero-equipment.aseprite` for stage equipment. Do not redraw a separate village/workout avatar.
2. Load `art/palette.gpl` through Aseprite's palette menu if needed. Retain sheet dimensions, frame order and transparent background. These initial masters are editable flattened sheets, not a fully separated layered production animation rig.
3. Run `npm run art:export`. This invokes the installed Aseprite batch exporter, refreshes the runtime PNGs and `avatar.json`, and preserves manual master edits. On another machine set `ASEPRITE_PATH` to its executable.
4. After editing the base standing/marching keys, run `npm run art:motion` to rederive the two walking keys and blink through `scripts/derive-motion.lua`. This preserves the seven existing exercise/study columns and copies stage equipment from the canonical sheet. Then run `npm test`, `npm run build`, then the mobile tests. Build precaches every exported PNG and metadata file; no runtime Aseprite or network service is needed.

`npm run art:seed` regenerates deterministic construction PNGs under ignored `art/seed/` and imports only masters that do not already exist. It never overwrites existing `.aseprite` masters. It is for bootstrapping/restoring missing initial artwork, not the normal editing workflow.

## Complete versus provisional

Complete for this implementation: canonical shared rendering, all supported exercise-to-frame mappings, standing design and stage equipment, compact village/environment/UI sheets, reward-driven building change, stable names/metadata, editable sources and reproducible export.

The pixel artwork is an initial original pass, not claimed as professional final art. Exercise images are stylised key poses, not validated demonstrations or motion capture. Existing written exercise instructions are unchanged. Remaining manual artwork: refine limb anatomy/weight distribution in the wall push and shallow squat; polish the non-workout lying study; refine weight transfer and add hand-polished in-between frames beyond the two derived walking keys. There is no new lying exercise, back-facing character, NPC pack or unreviewed movement advice in this phase.
## Phase 4 exercise refinement

The wall-push key now has clearer wall contact, bent-arm silhouette and trunk inclination, with matching stage equipment. The squat key has less splayed knee/boot alignment. scripts/refine-exercise-poses.lua records this one-time edit; ordinary art:export preserves subsequent manual work. Both poses remain provisional and locked out of real sessions. Legacy interrupted plans with provisional art show the standing character and an explicit withheld-demonstration label. Manual anatomy/weight-distribution review is still required; the lying study remains unused. No standing/village/walking redesign was made.

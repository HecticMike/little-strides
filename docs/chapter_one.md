# A world worth returning to — Chapter I

The first chapter is playable offline in the existing app. The later chapters
(Beyond the gate, Connections, Your Hearthwood) are a roadmap, not released content.
No deadlines, streak losses, building decay or exercise multipliers are added.

## The small step

The standard selector remains 7/10/15/20 minutes, with 10 on a fresh launch.
The separate 3-minute shortcut forces an activation/mobility pool, one position,
30 seconds setup and 30 seconds finish. Remaining activity/rest must fit exactly
under the existing opt-ins, block limits, discomfort holds and rolling recovery.
It can be unavailable. It is not a promise of symptom prevention or a clinical dose.
One fully completed eligible session earns one timber at any supported length.
Partial activity is saved and acknowledged; it earns no timber and loses no progress.

## Chapter content

| Project | Timber | Persistent result |
| --- | ---: | --- |
| Workshop | 1 | Existing restoration and Rowan at the workshop |
| Banner | 1 | Fern/star crest replaces the actual workshop banner |
| Garden | 2 | Bench with wildflowers or woodland ferns |
| Path | 2 | Two lanterns; local evening light pools |
| Noticeboard | 3 | Map and woodland pond/watchtower discovery choice |
| Welcome | 3 | Mira, gathering table and closing memory |

Projects are ordered; only the current project can be purchased. Purchases use
unique earned workout IDs, are idempotent, and save before art/sound feedback.
Both Today/completion project cards and the village use the same purchase function.
The original workshop approach/restore interaction also remains available.
Choices have equal game value. Discoveries are optional, never expire and can be
reopened in Village or Journal. The destination choice leaves a persistent keepsake.

## Compatibility and implementation

World schema 2 retains the original workshop ledger and adds ordered project
purchases plus discovery/reading state. Schema-1 and older automatic restorations
migrate without rewriting history or losing banked rewards. JSON format remains
version 1; the updated validator accepts existing sessions and validates new
three-minute sessions/world spending. Old app versions may reject the new world.
Do not import the new backup into an older cached release.

Today composes the current scene through shared Canvas assets without importing
Phaser. Phaser draws the same props, crest and local time of day at its existing
30fps target. The player and all exercise/physique assets remain unchanged;
walking cadence is slightly slower and contact/shadow registration is retained.
The workout uses a quieter painted backdrop and authored nine-slice controls.
Selection/preparation/completion/restoration sounds are original local PCM;
optional village ambience defaults off, respects mute/volume, stops for workouts,
page hiding and audio interruption. iPhone haptics are not assumed.

## Artwork editing

Open `art/source/chapter-props.aseprite`: each object has separate structure/cloth,
planting/skin and light/hair material masks, registered in 96px cells (4 columns).
These masks allow meaningful pixel editing; they are not articulated character rigs.
Rowan/Mira portraits crop those same sprites, keeping identity consistent.
Open `chapter-banner.aseprite` for the lossless wall patch and star crest.
Open `ui-enamel.aseprite` or `ui-paper.aseprite` for the three-layer 32px nine-slice
materials. Keep the 8px border slices registered.

`discovery-pond.aseprite` and `discovery-watchtower.aseprite` are honestly flattened
320x200 landscape masters. Original generated PNGs and prompt provenance are in
`art/direction/chapter-one`. They are not layered environment-production assets.

Export all edited masters with `npm run art:export`. Normal export preserves layers
and does not call bootstrap/refinement scripts. Do not rerun `create-chapter-art.lua`
or `refine-chapter-props.lua` over manual artwork. Generate sounds reproducibly with
`node scripts/generate-chapter-sound.mjs` (existing pace/transition are preserved).

Minimum manual art work: refine Rowan/Mira facial pixels at native size, clean prop
outlines where quantisation removed fine details, and review bench/table contact
with painted terrain. Existing exercise anatomy and the canonical walk keys retain
their documented manual-review needs; no anatomy is newly approved by this chapter.

## Personal acceptance

Use a real iPhone 15 to check speaker/Silent Mode/Bluetooth, calls, wake lock,
Home Screen safe areas and offline relaunch. Try a suitable small step only after
reviewing its movements; verify comfort feedback and actual activity in Journal.
Check whether starting feels easier and whether a project choice takes under a
minute. Revisit after time away: nothing expires and no progress is removed.
Complete and evaluate Home before producing three more chapters of artwork.

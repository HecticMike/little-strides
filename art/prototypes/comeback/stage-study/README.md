# Isolated comeback silhouette study

Review `comparison.png` or self-contained `comparison.html`. Columns are Starting,
a proposed broader Developed silhouette, and the existing Developed artwork.
This is one standing-idle study, not a new live stage or an exercise demonstration.
No runtime assets, rewards, progression thresholds or exercise eligibility change.

## Findings

The approved endpoints have nearly identical outer silhouettes. Shading-only
middle stages would be difficult to distinguish at native mobile scale. An initial
24-unit shading trial was rejected during this pass for that reason. The revised
study tests a stronger endpoint range before attempting intermediate physiques.
The broader shoulders/arms read more clearly at 144px figure width, but the change
remains modest at 48x64. This does not yet establish five distinct stages.

## Editable source

Open `developed-silhouette.aseprite` in Aseprite: 96x128 working pixels / 48x64
logical pixels. Keep its 2x2 grid and existing 27-colour palette. Ten named Starting
body-region layers remain editable, with three separate native-pixel study layers
for shoulders/sleeves, upper arms and shirt planes. This is visible pixel artwork,
not an articulated rig. It reuses the supplied body; only the study edits are
native-authored. No generated image, resampling, head transplant or anatomy
stretch was used. The shared head preview is context; `user-art/heads.aseprite`
remains authoritative at export. Head, lower body, hands and soles stay registered.

Export edited layers with:

    npm run art:export -- --comeback-stage-study

This isolated branch reads the master, exports PNGs, renders the labelled
comparison with existing Playwright, and checks palette/grid/connectivity,
head/lower-body equality and preservation of all 11 approved masters plus 10
runtime art/metadata files. Normal live exports do not include this study.
`prepare-comeback-stage-study.lua` is guarded preparation history; do not reimport
over manual edits. `report.json` and `verification.json` contain measured checks.

## Review and remaining work

Review the middle column's broader build, especially the shoulder slope and sleeve
caps (logical x13-33, y21-26), biceps/elbow junctions (x13-18 and x28-33, y27-32),
and shirt folds (x19-27, y25-34). These clusters need artist judgement; passing
pixel checks is not a claim of finished anatomy or professional sprite quality.
The study retains Starting leg silhouettes and does not establish final whole-body
physique progression. Do not copy these pixel patches into floor poses. After
visual approval, refine the agreed build, then author and review the intermediate
standing stages and matching pose-specific anatomy. No further generated image
is requested for this study. No walking work is planned.

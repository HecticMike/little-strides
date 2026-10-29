# Isolated comeback standing range

Review `comparison.png` or self-contained `comparison.html`. Columns are Starting
(0 units), Finding form study (24), and refined Developed study (96). These are
standing-idle art proofs, not live stages or exercise demonstrations. The original
approved Starting/Developed masters, all runtime artwork, progression thresholds
and exercise eligibility remain unchanged. `developed.png` retains the original
Developed reference outside the main three-build comparison.

## Result

The three standing builds have progressively wider shoulder silhouettes:17/19/21
logical pixels at row23, with identical head, height, hands, legs and sole anchors.
The final study's sleeve edges, elbows and waist gap were refined; the new middle
study uses independently editable, hand-selected shoulder/arm/shirt clusters.
This establishes a small standing range rather than five finished physiques.
Differences remain modest at48x64. The8/48 builds and matching exercise poses are
not produced; live characters still use the approved two endpoint appearances.

## Aseprite editing and export

Open `form-standing.aseprite` or `developed-silhouette.aseprite`:96x128 working
pixels /48x64 logical pixels, a2x2 grid and the existing27-colour palette. Ten
named Starting body-region layers remain editable. Separate study layers contain
shoulder/sleeve silhouettes, upper-arm form and shirt planes. The final study also
has `Refinement / Sleeve edges, elbow and waist`. These are editable visible pixel
regions, not an articulated rig or reconstructed hidden anatomy. Base artwork
comes from the supplied canonical character; only the study changes are native
pixel edits. No new generated image, raster stretching or head transplant.

The shared head preview provides context; `user-art/heads.aseprite` remains the
authoritative head at export. Export reads both masters without modifying them:

    npm run art:export -- --comeback-stage-study

The isolated branch exports PNGs, generates the existing Playwright comparison,
and validates both studies' palette, logical grid, connected silhouette and exact
head/lower-body equality. It also checks preservation of all11 approved masters
and10 active runtime art/metadata files. Normal runtime exports omit these proofs.
`report.json`, `form-export.json`, `range-report.json` and `verification.json`
record the measured results. Guarded prepare/refine scripts are preparation
history; edit existing masters directly rather than rerunning them.

## Remaining artist review

Frame1 of both masters: review the shoulder-to-sleeve slope (logical x13-33,
y21-26), near/far upper-arm and elbow transitions (x13-18 and x28-33,y27-32),
and shirt taper/folds (x18-27,y25-35). The final study has a deliberately clearer
arm/waist gap; do not accidentally fill it. Check all corrections at48x64 as well
as enlarged. These pixel checks do not validate anatomy or professional art quality.

Standing legs retain Starting anatomy. Matching exercise-stage development needs
pose-specific authoring and anatomy review; do not copy upright shoulder/arm
patches into lying poses. Next is to establish matching exercise artwork before
replacing any live stage. No new source image or walking artwork is requested.


## Heel-slide pose studies

`heel-comparison.png` / self-contained `heel-comparison.html` pair the three
standing references with the matching heel-slide studies. `heel-mobile.png` is
the375px-wide artwork review, not a live-app screenshot. The343px workout crop
uses the current renderer's source/destination geometry, on a neutral background.
No artwork or interface has been replaced in the live app.

Editable files: `form-heel-slide.aseprite` and `developed-heel-slide.aseprite`,
frame1,192x128 working pixels. Four source body/limb-region layers are retained,
with separate native upper-arm and shirt-light/fold study layers. The intact
floor head/neck/shoulder preview comes from the Starting source junction in
`user-art/heads.aseprite`; the exporter reads that authoritative junction. Keep
this source-matched pose junction together, without rotating or transplanting an
upright head. Source floor art uses its existing1px working detail; it must not
be forced onto the standing sprite's2x2 grid.

Export both standing and heel-slide studies using the existing isolated command:

    npm run art:export -- --comeback-stage-study

The two heel studies change24/59 working pixels, respectively. Entire head/neck/
shoulder pixels, legs, hands, support/contact rows and overall bounds match the
Starting source exactly. Both retain binary alpha, the shared palette and one
connected silhouette. The visible arm section is9/10/12 skin pixels at x116;
this is an art diagnostic, not a measurement or fitness claim. The outer floor
silhouette remains unchanged: these are small visible-arm/shirt studies, not
finished whole-body physique stages. The protected shoulder region and Starting
legs limit how fully they match the broader standing build.

Manual artist review: both files, frame1, biceps-to-sleeve boundary x112-120/
y105-112 and tee folds x113-125/y97-105. Compare the complete arm/torso drawing,
not individual skin pixels. Do not turn the arm contour into an unsupported
lump or describe it as validated exercise anatomy. Preserve x<102 limb/hand
pixels, y>=118 floor contacts and the complete source head/neck/shoulder mask.
No new generated source is requested. The normal runtime/export/catalogue remains
unchanged; other pose-specific stages and the8/48 standing builds are unfinished.

## Later identity work

Owner requested a new app name and an Aseprite app icon after the character
work. Choose the name with the owner before changing product text or install
metadata. Then author a layered native-pixel icon, check its small iPhone/Android
silhouette and export existing PWA sizes. Preserve the deployed URL, installed
app's data and existing backup/history compatibility during any rename. No name
or icon has been changed in this art pass.


## Marching pose studies

`march-comparison.png` / self-contained HTML show the0/24/96 marching range
enlarged, at144px figure width, at48x64 and in silhouette. `march-mobile.png`
compares each standing/marching pair at144px within a375px layout. These are
artwork reviews, not app screenshots or new exercise prescriptions.

Open `form-march.aseprite` or `developed-march.aseprite`, frame1,96x128 working /
48x64 logical pixels. Eight source body-region layers remain editable, plus three
native study layers for pose-specific shoulder/sleeve silhouette, arm form and
shirt planes. Preserve the2x2 grid, shared palette and authoritative upright head
from `user-art/heads.aseprite`. Preparation uses the existing marching body, not
pasted standing shoulders or an automatically distorted body.

The three marching shoulder spans at logical row23 are18/20/22px. Both new
studies keep the canonical head exactly unchanged. All source pixels from row68
(logical34) down are unchanged, preserving hands, pelvis, the lifted knee and
planted foot. New arm contours follow the supplied bent-arm position. Grid,
alpha, palette, connected silhouette and protected-pixel checks do not establish
anatomical or clinical validation. This is one still per stage; no walking or
complete march cycle is added, and no body-development claim concerns the user.

Export with `npm run art:export -- --comeback-stage-study`; existing export now
covers standing, heel-slide and marching proofs read-only. The guarded native
preparation script is history; edit the masters directly. See march-report.json,
form-march-export.json, developed-march-export.json and verification.json.

Manual artist review: both files, frame1, sleeve-to-upper-arm joins (logical
x11-18/y23-28 and x28-34/y24-29), bent far-arm shading x29-32/y28-31, and
shirt planes x20-26/y24-32. Keep the original elbow/wrist positions and the same
head/neck registration. Differences remain restrained at native size. Remaining
neutral supine/bridge/calf pose development and8/48 stages still need work before
live integration. The later naming and native Aseprite icon task remains queued.

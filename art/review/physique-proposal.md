# Subtle physique progression - proposal only

NOT IMPLEMENTED. All current stages still share the same body. These would be
fictional character rewards, unrelated to measured changes in the user's body.

| Stage | Small proposed difference at the 96x128 source scale |
| --- | --- |
| Beginner | Retain the approved current silhouette and shading. |
| Adventurer | At most one source pixel of additional shoulder/upper-arm contour; a small shared-palette highlight on the upper arm and thigh. |
| Veteran | At most two source pixels beyond Beginner at shoulders/upper arms; slightly firmer thigh/torso shading. No larger head, taller body or exaggerated muscles. |

Keep face, hair, skin tone, clothing design, head size, limb lengths and joint
centres identical. Preserve the y=120 foot anchor, hand/foot contact points and
upper-left light. Prefer shading over width where a silhouette change would
obscure a joint. A one-pixel change may disappear at the village's 48x64 display;
review it there before adding detail.

## Shared-asset implications

Use one stage definition applied to the existing body, before either adventure
or training equipment. Do not generate independent village/workout people.
Stage-specific paint masks would need matching edits in stand, blink, both walk
keys, march, calf and reach; the 160x96 review-only core would need corresponding
shoulder/arm/thigh changes without moving its support contacts. Withheld poses
must receive the same treatment if they are ever reviewed, not be unlocked by
this art work.

Shoulder width requires refitting sleeves, scarf/pack straps and cloak cutouts;
arm/thigh changes require checking cuffs, overlaps and bent-joint silhouettes in
both outfits. Altering only the standing frame would be insufficient. Retain the
existing grid/palette and small atlas budget; assess stage body masks alongside
the current equipment rows before choosing a runtime representation.

Minimum future review: side-by-side stages for every existing pose, the current
walk/neutral cycle at game size, face/anchor pixel checks and mobile workout
captures in both outfits. Keep the effect subtle or defer it if all poses cannot
be made consistent. No scheduler, difficulty or exercise-eligibility changes.
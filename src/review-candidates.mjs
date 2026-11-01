// Read-only product copy from the source review; deliberately outside the live catalogue.
export const REVIEW_CANDIDATES=Object.freeze([
  {
    "id": "bent-knee-fall-out",
    "name": "Bent-knee fall-out",
    "purpose": "Trunk/pelvic control while one bent knee moves sideways. Do not assume substantial strengthening without reviewing effort and dose.",
    "reviewNeeded": "Hip rotation, bent-knee tolerance, back control and floor/shoulder support require individual review. No treatment dose or range is prescribed here.",
    "sourceUrl": "https://www.wuth.nhs.uk/media/30877/physiotherapy-pilates-patient-information-leaflet-on-completion.pdf",
    "sourceSection": "Printed exercise page: bent knee fall out (PDF page 4).",
    "sourceContext": "Continuation leaflet for people who completed physiotherapy Pilates. It is not clearance for a new programme.",
    "selectable": false,
    "scheduling": null,
    "clinicalStatus": "research-only-unreviewed"
  },
  {
    "id": "single-knee-fold",
    "name": "Single knee fold (one leg at a time)",
    "purpose": "Abdominal/pelvic control with an unsupported leg; potentially more demanding than heel slides. Classification and dose remain unresolved.",
    "reviewNeeded": "Review trunk control, hip/knee position, back symptoms and supported head/shoulder contact. No automatic progression from a tolerated heel slide.",
    "sourceUrl": "https://plr.cht.nhs.uk/download/1314/Pilates%20Exercises%20A4",
    "sourceSection": "Scissors level 1, printed page 10 of 31; not level 2.",
    "sourceContext": "NHS physiotherapy exercise booklet with multiple levels; printed review date June 2026 has passed. Wirral leaflet also describes single-leg-at-a-time scissors. No personal suitability or dose is inferred.",
    "selectable": false,
    "scheduling": null,
    "clinicalStatus": "research-only-unreviewed"
  },
  {
    "id": "indoor-walking",
    "name": "Comfortable indoor walking - research proposal",
    "purpose": "Candidate for locomotor/aerobic movement variety; duration alone cannot establish moderate intensity. It would still share the current knee-exposure bottleneck.",
    "reviewNeeded": "Personal knee/ankle/hip tolerance, balance, available space, turning and shoulder comfort need review; no automatic replacement for a held march.",
    "sourceUrl": "https://www.nhs.uk/conditions/psoriatic-arthritis/",
    "sourceSection": "Things you can do: regular low-impact exercise",
    "sourceContext": "NHS lists walking among low-impact activities; it does not specify or approve an indoor app protocol or personal dose.",
    "selectable": false,
    "scheduling": null,
    "clinicalStatus": "research-only-unreviewed"
  }
].map(Object.freeze));

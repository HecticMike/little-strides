# In Good Time - sunlit window identity

Movement for everyday life. Contemporary home exercise, with an ordinary character and no fantasy or superhero framing.

## Editable sources

- `art/source/app-icon.aseprite`: 64 x 64 RGBA; separate deep-teal background, window/floor shadow, floor sunlight, warm glass, oak frame and frame highlights. Every layer contains native pixel artwork. No generated image or flattened import.
- `art/source/app-favicon.aseprite`: independently drawn, simplified 32 x 32 RGBA window with six editable layers. The header uses this native small drawing at 32px.
- Retired boot icon retained in `art/archive/little-strides-app-icon.aseprite`. Other interface glyphs, apartment, character and original art sources are unchanged.

Open a master in Aseprite, retain the exact canvas size and use the Pencil tool with anti-aliasing off. Edit the appropriate material/light layer; do not flatten or rescale the master. Keep every window-frame, glass and frame-highlight pixel within radius 25.6px of (32,32). The background must remain fully opaque and square. Let the phone apply its own corners. Floor light and shadows may extend outside the central safe circle.

Shared colours: deep teal #203b40, teal #294b4d, shadow #192f35, oak #936748, amber #e5b365, gold #f4ca7f and cream #fff0c6. Broad intentional clusters and a strong light/shadow contrast; no dithering, lettering or elaborate border.

## Export and review

```powershell
npm run art:export -- --branding
```

The regular `npm run art:export` also includes branding. Exports read the existing masters without redrawing or saving them. `scripts/create-window-icon.lua` is the original one-time native drawing recipe, guarded against overwriting an existing favicon; do not use it to export later edits.

Outputs retain the existing `public/icons/strides-*` and compatibility alias filenames: 192/512px launcher, 512px maskable, 180px Apple touch and 32px favicon. Scaling is nearest-neighbour; 180px is necessarily a noninteger enlargement of the64px master. No baked rounded corners. Launcher and maskable share the same opaque artwork.

Review `art/review/in-good-time-icon.png` or its self-contained HTML for the enlarged master, actual32/48/60px icons, independent32px favicon and rounded/circular previews. `interface-audit.json` records layer coverage and central safe bounds; `branding-verification.json` records master/export hashes. Repeat exports must be byte-identical and leave both masters untouched.

## Compatibility

Display names change; the hosted URL, repository, IndexedDB name, lock/cache namespaces, avatar IDs and `little-strides` JSON backup identifier do not. Historical documentation/art and archived village progress retain their original names. No data migration or exercise/progression change is part of this work.

Home Screen metadata refresh requires a physical iPhone check. Keep the app installed; never clear its data just to refresh an icon. Export JSON before any later installation-management action.

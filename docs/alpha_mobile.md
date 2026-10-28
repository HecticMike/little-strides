# Little Strides alpha 0.1 — real-phone testing

App: https://hecticmike.github.io/little-strides/

Source: https://github.com/HecticMike/little-strides (public, as requested).

This alpha installs from the browser as a standalone Home Screen web app. Use the
GitHub Pages address above; no GitHub or ChatGPT sign-in is required. No store publication is needed.
The exercise candidates, recovery rules and local records are the existing app;
this release upgrades icons and small interface artwork.

## Install on iPhone

1. Copy the app URL into Safari while online.
2. Open Share (inside the page menu on some Safari layouts), then Add to Home Screen.
3. Leave Open as Web App switched on if it is offered, and tap Add.
4. Open Little Strides from its new Home Screen icon.
5. Keep the app online until the header says Offline ready.

These menu steps follow [Apple's current iPhone guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Install on Android

1. Copy the app URL into Chrome while online.
2. Open the three-dot menu, choose Install and create shortcut → Install.
   Some Chrome versions offer Install app or Add to Home screen instead.
3. Follow the confirmation, then open Little Strides from the installed icon.
4. Keep it online until Offline ready appears.

See [Google Chrome's installation guide](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid).

## First alpha check

- Settings → Test sound: check the phone's volume, mute and chosen audio output.
- Preview workflow: try Pause, Resume, Skip and Replace before exercising.
  Preview records no exercise and earns no timber.
- Review or disable movements: individually enable only candidates you have
  reviewed as suitable. User opt-in and the illustrations are not clinical approval.
- When appropriate, run an available full 7- or 10-minute session. Keep it in the
  foreground; let the final countdown finish automatically. One complete session
  earns 1 timber. Village → Workshop → Restore spends it once.
- Confirm the Journal record, close/reopen the app and check it is still present.
- After Offline ready, try an airplane-mode reload and confirm artwork/history load.
- Check a short app switch or incoming call: the workout should pause, exclude time
  away and ask you to resume. Confirm the screen stays awake during foreground use.

Physical phone checks remain necessary: real installation, device masks and
launch appearance, audio/silent/Bluetooth routes, wake lock, calls and background
interruptions. Browser emulation does not certify these behaviours on your phone.
For an issue, note the device, OS/browser version, Alpha 0.1 and the steps that led to it.

## Move from the old preview

1. Open the old preview on the device/browser containing your history:
   https://little-strides-mobile.ssi-strategy-7759.chatgpt.site/
2. Settings → Export JSON. Keep the downloaded file before removing anything.
3. Install/open the GitHub Pages app, then Settings → Import JSON; select that file.
4. Check your Journal, village restoration and exercise/recovery settings.
   Import restores the backup; it does not merge two separate histories.

The new domain has separate browser storage. Nothing transfers automatically.
The old preview is retained for export, but future releases use GitHub Pages.
Source and built assets are public. Your local exercise records and exported
backups are not uploaded to the repository by the app.

## Keep your alpha data

History is local to the device/browser installation; it does not synchronise
from desktop or another phone. Export JSON in Settings on the old installation,
move the file to the phone, then Import JSON inside the installed app if you want
that history. Check imported records and recovery restrictions before starting.

Export JSON after important testing and before uninstalling/reinstalling or clearing
browser data. Do not clear storage to fix an icon. Phone launchers can retain an old
icon; keep the installed app or re-add it only after making a backup. If the app
reports Update ready, finish/pause your workout, close all its windows and reopen.
No app data or eligibility is reset by this source update.

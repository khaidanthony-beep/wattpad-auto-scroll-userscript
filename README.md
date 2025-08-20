# Wattpad Auto Scroll + “Load more” (with controls)

Tiny userscript that adds a floating **Start/Stop** panel with toggles:
- Auto-scroll to bottom
- Click **Load more**
- Hotkey **Alt+Shift+S**
- Safe auto-stop when the page stops growing

## Install
1. Install **Tampermonkey** (Chrome/Edge/Firefox).
2. Open `wattpad-auto.user.js` in this repo → click **Raw** → Tampermonkey should prompt to install.
3. Visit any Wattpad search page → press **Start** or **Alt+Shift+S**.

## Notes
- No `unsafeWindow` (uses `@grant none`).
- “Load more” detection by text/ARIA; adjust `findLoadMore()` if Wattpad changes UI.

## License
MIT

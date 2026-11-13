# mark-maker

A small local web tool for designing marks (monograms first, icons and logos later) and previewing them as a browser favicon. Everything runs in the browser; nothing is uploaded anywhere.

**Status:** early. Monogram mode works: live preview, draggable letters with per-letter color, gradient and shade, SVG and PNG download.

## Run it

No build step, no dependencies to install.

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What it does (v1 goal)

- Type 1–3 initials and see a live monogram.
- Pick a font, weight, letter spacing and size.
- Pick a frame shape (circle, rounded square, shield, etc.) and colors.
- Preview the result at real favicon sizes (16, 32, 48, 180 px) and in a mock browser tab (light and dark).
- Export SVG (text converted to paths) and PNGs, plus a `<link rel="icon">` snippet.

## Layout

```
index.html          the single app page; a mode switcher picks the active mode
src/
  shared/           preview, colors, favicon/tab previews, export, saving designs
  modes/
    monogram.js     v1
    icon.js         later
    logo.js         later
vendor/             pinned third-party libraries (opentype.js 1.3.4)
fonts/              bundled .woff files (SIL Open Font License, from Fontsource)
docs/               local-only notes (gitignored, not in the repo)
AGENTS.md           instructions for AI agents working in this repo
CLAUDE.md           points Claude Code at AGENTS.md
```

Serving over HTTP is required because fonts are fetched at startup. Exported SVGs contain letter outlines, not text, so they don't need the fonts installed.

## Extending it

It is one app with several modes (Monogram first; Icon and Logo later), switched from inside the UI. All modes share the same preview, color and export code. To add a mode, create `src/modes/<name>.js` and register it; see `AGENTS.md` for the rules.

## License

MIT, see [`LICENSE`](LICENSE). Bundled fonts in `fonts/` are under the SIL Open Font License; opentype.js in `vendor/` is MIT.

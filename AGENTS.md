# mark-maker: agent instructions

## What this repo is

A local, browser-based design tool for creating marks: monograms first, then icons and logos. The main use is producing a favicon and clean SVG files. It is a personal tool, not a deployed product.

Read `docs/prd.md` before starting any non-trivial work. It defines v1 scope and build order. Keep `README.md` current when run steps or layout change.

## Constraints (follow these)

- **No build step.** Plain HTML, CSS and JavaScript (ES modules are fine). It must work by opening `index.html` or running `python3 -m http.server`. Don't add a bundler, framework or `package.json` unless the user asks.
- **Runs locally and offline-friendly.** No backend, no accounts, no analytics, no uploading user designs anywhere. Persistence is `localStorage` only.
- **Dependencies:** keep them minimal. If a library is needed (e.g. `opentype.js` for text-to-path), vendor it into `vendor/` or load a pinned version from a CDN, and note it in the README. Never use unpinned `@latest` URLs.
- **SVG is the source of truth.** The mark is one SVG that the controls update. PNG and favicon outputs are rendered from that SVG, never drawn separately, so every export matches the preview.
- **Exported SVGs must not depend on installed fonts.** Convert text to paths on export.

## Architecture rules

- This is **one app with modes**, not separate tools. A mode switcher in the UI selects the active mode (Monogram now; Icon and Logo later). Don't create per-tool pages or folders.
- Layout: `index.html` at the root; `src/modes/<name>.js` for each mode (its controls, and a function that builds the SVG); `src/shared/` for everything common (preview, color handling, favicon-size and browser-tab previews, export, saving designs); `vendor/` for pinned libraries. Create these folders as needed.
- A mode exports a small, consistent interface (name, controls definition, `render(state) -> SVG`) so the shared code can drive any mode the same way.
- Adding a new mode should not require changing the shared code beyond registering it.
- Keep frame shapes, fonts and color palettes as plain data lists so adding one is a one-line change.
- Check legibility at 16×16. That size is what matters for a favicon, so small details that vanish there are a design problem to flag.

## Working style

- Prefer small, runnable steps. After each change, say how to see it (which file to open or reload).
- Keep files few and readable. Don't split into many files until one grows past what is easy to read.
- Don't invent features beyond `docs/prd.md`; propose additions and ask first.
- Don't commit generated exports or user-saved designs.

## Git workflow

- Work on a branch, not directly on `main`. Create one at the start of a session.
- Don't push or open a PR unless asked.
- Commit messages: a single one-line summary. No body.

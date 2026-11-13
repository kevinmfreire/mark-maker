// Loads bundled font files with opentype.js (vendor/opentype.min.js, exposed as window.opentype).
const cache = new Map(); // url -> opentype Font

export async function loadFonts(urls) {
  await Promise.all(urls.filter(u => !cache.has(u)).map(async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load ${url}`);
    cache.set(url, window.opentype.parse(await res.arrayBuffer()));
  }));
}

export const getFont = url => cache.get(url);

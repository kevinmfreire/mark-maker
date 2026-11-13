// Monogram mode. Interface every mode exports:
// { name, controls, defaults, render(state, opts) -> SVG string, preload() -> Promise, onDrag }.
import { loadFonts, getFont } from '../shared/fonts.js';

// Plain data list: adding a font is one line (plus its .woff files in fonts/).
// Free fonts under the SIL Open Font License, from Fontsource.
const f = (id, label) => ({ id, label, files: { 400: `fonts/${id}-400.woff`, 700: `fonts/${id}-700.woff` } });
export const fonts = [
  f('playfair-display', 'Playfair Display (serif)'),
  f('cormorant-garamond', 'Cormorant Garamond (serif)'),
  f('inter', 'Inter (sans)'),
  f('montserrat', 'Montserrat (geometric)'),
  f('poppins', 'Poppins (geometric)'),
  f('dancing-script', 'Dancing Script (script)'),
];

const VIEW = 100; // SVG viewBox is 0 0 100 100
const EM = 100;   // glyph outlines are built at 100 units per em, then scaled with a transform

export const controls = [
  { section: 'Letters' },
  { key: 'letters', label: 'Initials', type: 'text', maxLength: 3 },
  { section: 'Typography' },
  { key: 'font', label: 'Font', type: 'select', options: fonts.map(x => ({ value: x.id, label: x.label })) },
  { key: 'weight', label: 'Weight', type: 'select', options: [{ value: '400', label: 'Regular' }, { value: '700', label: 'Bold' }] },
  { key: 'spacing', label: 'Spacing', type: 'range', min: -20, max: 20, step: 1 },
  { key: 'offsetY', label: 'Vertical', type: 'range', min: -20, max: 20, step: 1 },
  { section: 'Colors' },
  { key: 'letterColor', label: 'Letter', type: 'color' },
  { key: 'background', label: 'Background', type: 'color' },
  { section: 'Layout' },
  { key: 'scale', label: 'Letter size', type: 'range', min: 30, max: 100, step: 1 },
  { section: 'Selected letter (drag letters in the preview)' },
  { label: 'Letter', type: 'select', get: s => String(s.sel), set: (s, v) => { s.sel = Number(v); },
    options: s => [...(s.letters || '')].map((ch, i) => ({ value: String(i), label: `${i + 1}: ${ch.toUpperCase()}` })) },
  { label: 'Size %', type: 'range', min: 40, max: 250, step: 1, ...prop('size') },
  { label: 'Rotate', type: 'range', min: -180, max: 180, step: 1, ...prop('rot') },
  { label: 'Color', type: 'color', get: s => glyph(s, s.sel).color || s.letterColor, set: (s, v) => setGlyph(s, s.sel, { color: v }) },
  { label: 'Gradient', type: 'checkbox', ...prop('grad') },
  { label: 'Gradient to', type: 'color', ...prop('color2') },
  { label: 'Gradient angle', type: 'range', min: 0, max: 360, step: 5, ...prop('angle') },
  { label: 'Shade', type: 'range', min: 0, max: 100, step: 1, ...prop('shade') },
  { label: 'Knockout gap', type: 'range', min: 0, max: 5, step: 0.5, ...prop('gap') },
  { label: 'Bring to front', type: 'button', onClick: s => reorder(s, 1) },
  { label: 'Send to back', type: 'button', onClick: s => reorder(s, 0) },
  { label: 'Reset letters', type: 'button', onClick: s => { s.glyphs = []; s.order = []; } },
];

export const defaults = {
  letters: 'MK',
  font: fonts[0].id,
  weight: '700',
  spacing: 0,
  offsetY: 0,
  letterColor: '#ffffff',
  background: '#2563eb',
  scale: 70,
  sel: 0,
  glyphs: [], // per-letter tweaks, see glyphDefaults
  order: [],  // draw order, back to front, as letter indexes; missing letters draw in natural order
};

const glyphDefaults = { dx: 0, dy: 0, size: 100, rot: 0, color: null, grad: false, color2: '#f59e0b', angle: 90, shade: 0, gap: 0 };
function glyph(s, i) { return { ...glyphDefaults, ...(s.glyphs[i] || {}) }; }
function setGlyph(s, i, patch) { s.glyphs[i] = { ...glyph(s, i), ...patch }; }
function prop(k) { return { get: s => glyph(s, s.sel)[k], set: (s, v) => setGlyph(s, s.sel, { [k]: v }) }; }

function drawOrder(s, n) {
  const o = (s.order || []).filter(i => i < n);
  for (let i = 0; i < n; i++) if (!o.includes(i)) o.push(i);
  return o;
}
function reorder(s, toFront) {
  const o = drawOrder(s, [...(s.letters || '')].length).filter(i => i !== s.sel);
  if (toFront) o.push(s.sel); else o.unshift(s.sel);
  s.order = o;
}

// Called by the shared preview while a letter is dragged (deltas in viewBox units).
export function onDrag(s, i, ddx, ddy) {
  const g = glyph(s, i);
  setGlyph(s, i, { dx: g.dx + ddx, dy: g.dy + ddy });
}

export const preload = () => loadFonts(fonts.flatMap(x => Object.values(x.files)));

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Outline of one character, centered on its box horizontally and on the cap height vertically.
function outline(font, ch) {
  const box = font.getPath(ch, 0, 0, EM).getBoundingBox();
  const cap = -font.getPath('H', 0, 0, EM).getBoundingBox().y1;
  const w = box.x2 - box.x1;
  return { w, d: font.getPath(ch, -(box.x1 + box.x2) / 2, cap / 2, EM).toPathData(2) };
}

export function render(s, opts = {}) {
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">\n  <rect width="${VIEW}" height="${VIEW}" fill="${s.background}"/>`;
  const font = getFont(fonts.find(x => x.id === s.font)?.files[Number(s.weight)] ?? '');
  const chars = [...(s.letters || '')].map(c => c.toUpperCase());
  if (!font || !chars.length) return `${head}\n</svg>`;

  const shapes = chars.map((ch, i) => ({ ...outline(font, ch), g: glyph(s, i) }));
  const gap = 3 + s.spacing;
  const natural = shapes.reduce((sum, o) => sum + o.w * (s.scale / 100) * o.g.size / 100, 0) + (chars.length - 1) * gap;
  const fit = Math.min(1, 90 / natural); // shrink so three wide initials still fit the canvas
  const base = (s.scale / 100) * fit;

  let x = 50 - (natural * fit) / 2;
  const defs = [], layers = [];
  shapes.forEach((o, i) => {
    const { g } = o;
    const k = base * g.size / 100;
    const w = o.w * k;
    const cx = x + w / 2 + g.dx;
    const cy = VIEW / 2 + s.offsetY + g.dy;
    x += w + gap * fit;

    let fill = g.color || s.letterColor;
    if (g.grad) {
      defs.push(`<linearGradient id="g${i}" gradientTransform="rotate(${g.angle} .5 .5)"><stop offset="0" stop-color="${fill}"/><stop offset="1" stop-color="${g.color2}"/></linearGradient>`);
      fill = `url(#g${i})`;
    }
    const xf = (dx, dy) => `translate(${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}) rotate(${g.rot}) scale(${k.toFixed(4)})`;
    let edge = '';
    if (g.gap > 0) {
      // Knockout: a background-colored outline painted under the fill cuts a gap into letters behind this one.
      edge = ` stroke="${s.background}" stroke-width="${(2 * g.gap / k).toFixed(3)}" stroke-linejoin="round" paint-order="stroke"`;
    } else if (opts.interactive) {
      edge = ' stroke="transparent" stroke-width="6" pointer-events="all"'; // bigger hit area for thin letters
    }
    let layer = '';
    if (g.shade > 0) layer += `<path d="${o.d}" transform="${xf(2.5, 2.5)}" fill="#000" fill-opacity="${(g.shade / 200).toFixed(2)}"/>`;
    layer += `<path d="${o.d}" transform="${xf(0, 0)}" fill="${fill}"${edge}/>`;
    layers[i] = opts.interactive ? `<g data-handle="${i}">${layer}</g>` : layer;
  });
  const body = drawOrder(s, chars.length).map(i => layers[i]);
  return `${head}\n  ${defs.length ? `<defs>${defs.join('')}</defs>\n  ` : ''}${body.join('\n  ')}\n</svg>`;
}

export default { name: 'Monogram', controls, defaults, render, preload, onDrag };

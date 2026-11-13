import monogram from './modes/monogram.js';
import { palettes } from './shared/colors.js';
import { downloadSvg, downloadPng, pngSizes } from './shared/export.js';

// Register modes here. Icon and Logo get added to this list later.
const modes = [monogram];

const $ = id => document.getElementById(id);
let mode = modes[0];
let state = structuredClone(mode.defaults);

function renderPreview() {
  const box = $('preview');
  box.innerHTML = mode.render(state, { interactive: true });
  // Selection outline lives outside the SVG so it never ends up in an export.
  const el = mode.onDrag && box.querySelector(`[data-handle="${state.sel}"]`);
  if (el) {
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    const o = document.createElement('div');
    o.className = 'sel-outline';
    Object.assign(o.style, { left: `${r.left - b.left}px`, top: `${r.top - b.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    box.append(o);
  }
}

// Drag any element marked data-handle in the preview; the mode decides what that moves.
function setupDrag() {
  const box = $('preview');
  let drag = null;
  box.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-handle]');
    if (!el || !mode.onDrag) return;
    const i = Number(el.dataset.handle);
    drag = { i, x: e.clientX, y: e.clientY };
    box.setPointerCapture(e.pointerId);
    if (state.sel !== i) { state.sel = i; buildControls(); }
    renderPreview();
  });
  box.addEventListener('pointermove', e => {
    if (!drag) return;
    const k = 100 / box.getBoundingClientRect().width; // px -> viewBox units
    mode.onDrag(state, drag.i, (e.clientX - drag.x) * k, (e.clientY - drag.y) * k);
    drag.x = e.clientX; drag.y = e.clientY;
    renderPreview();
  });
  const end = () => { if (drag) { drag = null; buildControls(); } };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
}

function field(c) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = `f-${c.key || c.label}`;
  const read = () => (c.get ? c.get(state) : state[c.key]);
  const write = v => { if (c.set) c.set(state, v); else state[c.key] = v; };
  if (c.type === 'button') {
    const b = document.createElement('button');
    b.textContent = c.label;
    b.onclick = () => { c.onClick(state); buildControls(); renderPreview(); };
    wrap.append(b);
    return wrap;
  }
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = c.label;
  wrap.append(label);

  let input;
  if (c.type === 'select') {
    input = document.createElement('select');
    for (const o of (typeof c.options === 'function' ? c.options(state) : c.options)) input.add(new Option(o.label, o.value));
  } else {
    input = document.createElement('input');
    input.type = c.type;
    if (c.type === 'checkbox') input.checked = !!read();
    if (c.type === 'text' && c.maxLength) input.maxLength = c.maxLength;
    if (c.type === 'range') { input.min = c.min; input.max = c.max; input.step = c.step; }
  }
  input.id = id;
  if (c.type !== 'checkbox') input.value = read();
  wrap.append(input);

  let out;
  if (c.type === 'range') {
    out = document.createElement('output');
    out.textContent = read();
    wrap.append(out);
  }
  input.addEventListener('input', () => {
    write(c.type === 'range' ? Number(input.value) : c.type === 'checkbox' ? input.checked : input.value);
    if (out) out.textContent = input.value;
    if (c.key === 'letters') {
      const len = [...input.value].length;
      if (state.sel >= len) state.sel = Math.max(0, len - 1);
      buildControls();
      document.getElementById(id)?.focus();
    }
    renderPreview();
  });
  return wrap;
}

function buildControls() {
  const panel = $('controls');
  panel.replaceChildren();
  for (const c of mode.controls) {
    if (c.section) {
      const h = document.createElement('h2');
      h.textContent = c.section;
      panel.append(h);
    } else {
      panel.append(field(c));
    }
  }
}

function buildModes() {
  const nav = $('modes');
  nav.replaceChildren();
  for (const m of modes) {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.setAttribute('aria-pressed', String(m === mode));
    b.onclick = () => { mode = m; state = structuredClone(m.defaults); buildModes(); buildControls(); renderPreview(); };
    nav.append(b);
  }
}

function setupExport() {
  const sel = $('png-size');
  for (const n of pngSizes) sel.add(new Option(`${n} px`, n));
  sel.value = 512;
  $('dl-svg').onclick = () => downloadSvg(mode.render(state));
  $('dl-png').onclick = () => downloadPng(mode.render(state), Number(sel.value));
}

setupDrag();
setupExport();
buildModes();
buildControls();
mode.preload().then(renderPreview);
void palettes; // wired into the UI in step 2

/**
 * components/theme.js — Theme, color, font, background system
 * Depends on: state.js, config.js
 */
'use strict';

function applyColors() {
  const r = document.documentElement;
  r.style.setProperty('--p1', state.p1Color);
  r.style.setProperty('--p1-rgb', hexToRgb(state.p1Color));
  r.style.setProperty('--p1-dim', `rgba(${hexToRgb(state.p1Color)},0.13)`);
  r.style.setProperty('--p1-dim2', `rgba(${hexToRgb(state.p1Color)},0.22)`);
  r.style.setProperty('--p2', state.p2Color);
  r.style.setProperty('--p2-rgb', hexToRgb(state.p2Color));
  r.style.setProperty('--p2-dim', `rgba(${hexToRgb(state.p2Color)},0.13)`);
  r.style.setProperty('--p2-dim2', `rgba(${hexToRgb(state.p2Color)},0.22)`);
  document.getElementById('custom-color1').value = state.p1Color;
  document.getElementById('custom-color2').value = state.p2Color;
}

function setTheme(t, el) {
  state.theme = t;
  applyTheme(t);
  // Update old-style swatches (font display chips, etc.)
  document.querySelectorAll('.theme-swatch[data-theme]').forEach(s => s.classList.remove('active'));
  if (el && el.classList.contains('theme-swatch')) el.classList.add('active');
  // Update new theme-card grid
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('onclick')?.includes("'" + t + "'"));
  });
  saveState();
  Object.keys(charts).forEach(k => { destroyChart(k); });
  setTimeout(renderAll, 50);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? '' : t);
  if (t === 'dark') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function renderColorSwatches() {
  const s1 = document.getElementById('swatches-p1');
  const s2 = document.getElementById('swatches-p2');
  if (!s1 || !s2) return;

  s1.innerHTML = P1_COLORS.map(c => `<div class="color-swatch ${c===state.p1Color?'active':''}" style="background:${c}" onclick="setP1Color('${c}')" title="${c}"></div>`).join('');
  s2.innerHTML = P2_COLORS.map(c => `<div class="color-swatch ${c===state.p2Color?'active':''}" style="background:${c}" onclick="setP2Color('${c}')" title="${c}"></div>`).join('');

  const h1 = document.getElementById('custom-hex1'); if (h1) h1.textContent = state.p1Color;
  const h2 = document.getElementById('custom-hex2'); if (h2) h2.textContent = state.p2Color;
  const cc1 = document.getElementById('custom-color1'); if (cc1) cc1.value = state.p1Color;
  const cc2 = document.getElementById('custom-color2'); if (cc2) cc2.value = state.p2Color;
}

function setP1Color(c) {
  state.p1Color = c; applyColors(); saveState(); renderColorSwatches();
  Object.keys(charts).forEach(k => destroyChart(k)); setTimeout(renderAll, 50);
}

function applyTextColor(color) {
  state.textColor = color;
  document.documentElement.style.setProperty('--text', color);
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  document.documentElement.style.setProperty('--text2', `rgba(${r},${g},${b},0.6)`);
  document.documentElement.style.setProperty('--text3', `rgba(${r},${g},${b},0.35)`);
  const hexEl = document.getElementById('text-color-hex');
  if (hexEl) hexEl.textContent = color;
  const ccEl = document.getElementById('custom-text-color');
  if (ccEl) ccEl.value = color;
  // Mark active preset
  document.querySelectorAll('#text-color-presets .color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.getAttribute('onclick')?.includes(color));
  });
  saveState();
}
function setP2Color(c) {
  state.p2Color = c; applyColors(); saveState(); renderColorSwatches();
  Object.keys(charts).forEach(k => destroyChart(k)); setTimeout(renderAll, 50);
}

// ── Avatar upload ─────────────────────────────────


function applyFont(fontId, displayStyle) {
  const f = FONTS.find(x => x.id === fontId) || FONTS[0];
  // Determine display font based on body font choice + optional override
  const ds = displayStyle || state.fontDisplay || 'serif';
  const displayMap = {
    serif:     "'Instrument Serif', serif",
    body:      f.stack,          // same as body font
    mono:      "'Fira Code', monospace",
    playfair:  "'Playfair Display', serif",
    dm:        "'DM Serif Display', serif",
  };
  const displayStack = displayMap[ds] || displayMap.serif;

  document.documentElement.setAttribute('data-font', f.id);
  document.documentElement.style.setProperty('--font-body',    f.stack);
  document.documentElement.style.setProperty('--font-display', displayStack);

  state.font = f.id;
  if (displayStyle) state.fontDisplay = displayStyle;
  saveState();
  renderFontGrid();
  renderFontPicker();
}

function renderFontGrid() {
  const el = document.getElementById('font-grid');
  if (!el) return;
  el.innerHTML = FONTS.map(f => `
    <div class="font-card ${state.font === f.id ? 'active' : ''}"
         style="font-family:${f.stack}" onclick="applyFont('${f.id}')">
      <div class="font-card-name">${f.name}</div>
      <div class="font-card-preview" style="font-family:${f.stack}">${f.preview}</div>
    </div>
  `).join('');
  // Sync display-font chips
  document.querySelectorAll('#display-font-chips .theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.df === (state.fontDisplay || 'serif'));
  });
  // Sync text color inputs
  const tc = document.getElementById('custom-text-color');
  const th = document.getElementById('text-color-hex');
  if (tc) tc.value = state.textColor || '#f0efe8';
  if (th) th.textContent = state.textColor || '#f0efe8';
  // Sync text-color preset swatches active state
  document.querySelectorAll('#text-color-presets .color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.style.background === (state.textColor || '#f0efe8'));
  });
}

function renderFontPicker() {
  const el = document.getElementById('font-picker-grid');
  if (!el) return;
  el.innerHTML = FONTS.map(f => `
    <div class="font-card ${state.font === f.id ? 'active' : ''}"
         style="font-family:${f.stack}" onclick="applyFont('${f.id}');updateFontPreview()">
      <div class="font-card-name">${f.name}</div>
      <div class="font-card-preview" style="font-family:${f.stack}">${f.preview}</div>
    </div>
  `).join('');
}

function updateFontPreview() {
  const prev = document.getElementById('font-preview-text');
  if (prev) prev.style.fontFamily = 'var(--font-body)';
}

// ══════════════════════════════════════════════════════════════
//  QUICK-ADD (numpad)
// ══════════════════════════════════════════════════════════════
let _qaBuffer = '';
let _qaType   = 'gasto';
let _qaOpen   = false;

// [moved to top]



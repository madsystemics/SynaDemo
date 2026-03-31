/**
 * components/avatar.js — Avatar upload + background image system
 * Depends on: state.js, utils/format.js
 */
'use strict';

function uploadAvatar(input, person) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { showToast('⚠️ Imagem muito grande (máx 3MB)'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    if (person === 1) { state.avatar1 = dataUrl; } else { state.avatar2 = dataUrl; }
    saveState();
    renderAvatarPreview(person, dataUrl);
    syncAvatarsInTopbar();
    showToast('✅ Foto de perfil atualizada!');
  };
  reader.readAsDataURL(file);
}

function removeAvatar(person) {
  if (person === 1) { state.avatar1 = null; } else { state.avatar2 = null; }
  saveState();
  renderAvatarPreview(person, null);
  syncAvatarsInTopbar();
  showToast('Foto removida');
}

function renderAvatarPreview(person, dataUrl) {
  const el  = document.getElementById('av' + person + '-preview');
  const btn = document.getElementById('btn-rm-av' + person);
  const emoji = state.emojis[person - 1] || (person === 1 ? '💛' : '💙');
  const color = person === 1 ? state.p1Color : state.p2Color;
  if (!el) return;
  if (dataUrl) {
    el.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    el.style.borderColor = color;
    if (btn) btn.style.display = 'block';
  } else {
    el.textContent = emoji;
    el.style.borderColor = 'var(--border2)';
    if (btn) btn.style.display = 'none';
  }
  // update name label
  const lbl = document.getElementById('av' + person + '-name-lbl');
  if (lbl) lbl.textContent = state.names[person - 1] || 'Pessoa ' + person;
}

function syncAvatarsInTopbar() {
  [1, 2].forEach(p => {
    const chipEl = document.getElementById('chip-av' + p);
    const av = p === 1 ? state.avatar1 : state.avatar2;
    const emoji = state.emojis[p - 1] || (p === 1 ? '💛' : '💙');
    if (!chipEl) return;
    if (av) {
      chipEl.innerHTML = `<img src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      chipEl.textContent = emoji;
    }
  });
  // Topbar user-menu button
  const topBtn = document.getElementById('topbar-avatar-emoji');
  if (topBtn) {
    if (state.avatar1) {
      topBtn.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
      topBtn.innerHTML = `<img src="${state.avatar1}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      topBtn.textContent = (state.names[0] || 'U')[0].toUpperCase();
    }
  }
}

function initAvatarPreviews() {
  renderAvatarPreview(1, state.avatar1);
  renderAvatarPreview(2, state.avatar2);
  syncAvatarsInTopbar();
}

// ── Background upload ─────────────────────────────
function uploadBackground(input) {
  const file = input.files?.[0];
  if (file) processBackgroundFile(file);
}

function processBackgroundFile(file) {
  const MAX = 8 * 1024 * 1024;
  if (file.size > MAX) { showToast('⚠️ Arquivo muito grande (máx 8MB)'); return; }
  const ok = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
  if (!ok.includes(file.type)) { showToast('⚠️ Formato não suportado'); return; }
  showToast('⏳ Carregando imagem...');
  const reader = new FileReader();
  reader.onload = e => {
    state.bgUrl = e.target.result;
    saveState();
    applyBackground();
    showBgControls(true);
    updateDropzonePreview(true);
    showToast('✅ Fundo aplicado!');
  };
  reader.readAsDataURL(file);
}

function applyBackground() {
  const layer = document.getElementById('app-bg-layer');
  if (!layer) return;
  if (!state.bgUrl) { layer.style.opacity = '0'; return; }
  layer.style.backgroundImage = `url("${state.bgUrl}")`;
  layer.style.opacity = state.bgOpacity;
  layer.style.filter = `blur(${state.bgBlur}px) brightness(${state.bgBrightness}) contrast(${state.bgContrast})`;
}

function updateBgSettings() {
  const blur    = parseFloat(document.getElementById('sl-bg-blur')?.value   ?? 4);
  const opacity = parseFloat(document.getElementById('sl-bg-opacity')?.value ?? 35) / 100;
  const bright  = parseFloat(document.getElementById('sl-bg-bright')?.value  ?? 60) / 100;
  const cont    = parseFloat(document.getElementById('sl-bg-contrast')?.value ?? 100) / 100;

  state.bgBlur       = blur;
  state.bgOpacity    = opacity;
  state.bgBrightness = bright;
  state.bgContrast   = cont;

  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('bg-blur-val',    blur + 'px');
  set('bg-opacity-val', Math.round(opacity * 100) + '%');
  set('bg-bright-val',  Math.round(bright  * 100) + '%');
  set('bg-contrast-val',Math.round(cont    * 100) + '%');

  saveState();
  applyBackground();
}

function removeBackground() {
  state.bgUrl = null; saveState();
  applyBackground();
  showBgControls(false);
  updateDropzonePreview(false);
  showToast('Fundo removido');
}

function showBgControls(show) {
  const panel = document.getElementById('bg-controls-panel');
  if (panel) panel.style.display = show ? 'block' : 'none';
  if (show) {
    const map = {
      'sl-bg-blur':     state.bgBlur,
      'sl-bg-opacity':  Math.round(state.bgOpacity * 100),
      'sl-bg-bright':   Math.round(state.bgBrightness * 100),
      'sl-bg-contrast': Math.round(state.bgContrast * 100),
    };
    Object.entries(map).forEach(([id, v]) => { const e = document.getElementById(id); if (e) e.value = v; });
    updateBgSettings();
  }
}

function updateDropzonePreview(hasImage) {
  const dz   = document.getElementById('bg-dropzone-preview');
  const txt  = document.getElementById('bg-dropzone-text');
  const icon = document.getElementById('bg-dropzone-icon');
  if (hasImage && state.bgUrl) {
    if (dz)   { dz.style.backgroundImage = `url("${state.bgUrl}")`; dz.style.display = 'block'; }
    if (txt)  txt.textContent = 'Clique para trocar a imagem';
    if (icon) icon.textContent = '✅';
  } else {
    if (dz)   dz.style.display = 'none';
    if (txt)  txt.textContent = 'Clique ou arraste uma imagem aqui';
    if (icon) icon.textContent = '🖼️';
  }
}

function bgDragOver(e) { e.preventDefault(); document.getElementById('bg-dropzone')?.classList.add('drag-over'); }
function bgDragLeave()  { document.getElementById('bg-dropzone')?.classList.remove('drag-over'); }
function bgDrop(e) {
  e.preventDefault();
  document.getElementById('bg-dropzone')?.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) processBackgroundFile(file);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('custom-color1')?.addEventListener('input', e => {
    const h = document.getElementById('custom-hex1'); if (h) h.textContent = e.target.value;
    setP1Color(e.target.value);
  });
  document.getElementById('custom-color2')?.addEventListener('input', e => {
    const h = document.getElementById('custom-hex2'); if (h) h.textContent = e.target.value;
    setP2Color(e.target.value);
  });
});

// ══════════════════════════════════════════════════
//  NAMES & EMOJIS
// ══════════════════════════════════════════════════


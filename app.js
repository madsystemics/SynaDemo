/**
 * app.js — Entry point: init + router. Load LAST.
 */
'use strict';

function init() {
  loadState();
  applyTheme(state.theme);
  applyColors();
  applyFont(state.font || 'sora', state.fontDisplay || 'serif');
  if (state.textColor && state.textColor !== '#f0efe8') {
    applyTextColor(state.textColor);
  }
  document.getElementById('f-data').value = new Date().toISOString().split('T')[0];
  populateCatSelect();
  populateQaCatSel();
  populateEmojiPickers();
  syncNames();
  initSync();
  checkAutoReport();
  setTimeout(() => {
    initAvatarPreviews();
    showPairCode();
    if (state.bgUrl) {
      applyBackground();
      showBgControls(true);
      updateDropzonePreview(true);
    }
  }, 0);
  renderAll();
  // Init animations after first render
  setTimeout(() => { initJellyAnimations(); initSynaLogo(); }, 200);
}

function loadState() {
  try {
    const uid = Auth.currentUser()?.uid || 'guest';
    const s = localStorage.getItem('fincasal_pro_v2_' + uid);
    if (s) Object.assign(state, JSON.parse(s));
  } catch(e) {}
}

function saveState() {
  const uid = Auth.currentUser()?.uid || 'guest';
  localStorage.setItem('fincasal_pro_v2_' + uid, JSON.stringify(state));
}

// ══════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════

function goPage(id) {
  if (currentPage === id) return;
  // Exit current page with spring-out
  const cur = document.querySelector('.page.active');
  if (cur) {
    cur.classList.add('page-exit');
    cur.classList.remove('active');
    setTimeout(() => cur.classList.remove('page-exit'), 220);
  }
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`[data-page="${id}"]`);
  if (navEl) {
    navEl.classList.add('active');
    // Wobble the icon
    const icon = navEl.querySelector('.ni, .nav-item');
    if (icon) { icon.style.animation='none'; requestAnimationFrame(()=>{ icon.style.animation=''; }); }
  }
  // Enter new page
  const next = document.getElementById('page-' + id);
  if (next) {
    // Tiny delay lets exit animation start
    setTimeout(() => {
      next.classList.add('active');
    }, 30);
  }
  // Animate page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.style.animation = 'none';
    requestAnimationFrame(() => { titleEl.style.animation = ''; });
  }
  const titles = {dashboard:'Dashboard',lancamentos:'Lançamentos',graficos:'Gráficos',orcamento:'Orçamento',metas:'Metas',configuracoes:'Configurações'};
  if (titleEl) titleEl.textContent = titles[id] || id;
  currentPage = id;
  // Render after enter starts
  setTimeout(renderAll, 60);
}

function changeMonth(d) {
  currentMonth += d;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  document.getElementById('month-label').textContent = MONTHS[currentMonth] + ' ' + currentYear;
  document.getElementById('dash-period').textContent = MONTHS[currentMonth] + ' ' + currentYear;
  renderAll();
}

// ══════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════


/**
 * pages/render.js — renderAll() orchestrator + modals + data export
 */
'use strict';

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id === 'modal-report')    { openReport(); }
  if (id === 'modal-font')      { renderFontPicker(); }
  if (id === 'modal-pair')      { showPairCode(); const pi=document.getElementById('pair-input'); if(pi) pi.value=''; }
  if (id === 'modal-challenge') {
    const ch = state.challenge;
    const btnCancel = document.getElementById('btn-cancel-challenge');
    if (ch) {
      const n=document.getElementById('ch-name'); if(n) n.value=ch.name;
      const g=document.getElementById('ch-goal'); if(g) g.value=ch.goal;
      const e=document.getElementById('ch-emoji'); if(e) e.value=ch.emoji;
      const t=document.getElementById('ch-type'); if(t) t.value=ch.type;
      const s=document.getElementById('ch-start'); if(s) s.value=ch.start;
      const d=document.getElementById('ch-end'); if(d) d.value=ch.end;
      if (btnCancel) btnCancel.style.display='block';
    } else {
      const today=new Date().toISOString().split('T')[0];
      const next=new Date(); next.setDate(next.getDate()+30);
      const s=document.getElementById('ch-start'); if(s) s.value=today;
      const d=document.getElementById('ch-end'); if(d) d.value=next.toISOString().split('T')[0];
      if (btnCancel) btnCancel.style.display='none';
    }
  }
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  }
});

// ══════════════════════════════════════════════════
//  DATA EXPORT / IMPORT
// ══════════════════════════════════════════════════

function exportData() {
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'financas-casal-backup.json';
  a.click(); showToast('📁 Exportado com sucesso!');
}

function importData(inp) {
  const file = inp.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      Object.assign(state, data);
      saveState(); init();
      showToast('✅ Dados importados!');
    } catch { showToast('⚠️ Arquivo inválido'); }
  };
  r.readAsText(file);
}

function clearAll() {
  if (!confirm('Apagar TODOS os dados? Esta ação é irreversível.')) return;
  state.transactions = []; state.metas = []; state.budgets = {};
  saveState(); renderAll(); showToast('🗑 Dados apagados');
}

// ══════════════════════════════════════════════════
//  RENDER ALL
// ══════════════════════════════════════════════════

function renderAll() {
  syncNames();
  renderColorSwatches();
  populateCatSelect();
  renderCatsSettings();
  document.querySelector(`[data-theme="${state.theme||'dark'}"]`)?.classList.add('active');

  if (currentPage==='dashboard') {
    renderQuickAddStrip();
    renderChallengeDash();
    renderDashCards();
    renderDashRecent();
    renderDashCats();
    renderChartDonut();
    renderChartBarDash();
    // Stagger stat cards after render
    requestAnimationFrame(() => staggerAnimate('#dash-cats', '.budget-row, div[style]', 50));
  }
  if (currentPage==='lancamentos') {
    renderTxTable();
  }
  if (currentPage==='graficos') {
    renderChartEvolucao();
    renderChartCats();
    renderChartPerson(1);
    renderChartPerson(2);
    renderChartAcumulado();
  }
  if (currentPage==='orcamento') {
    renderBudgetList();
    renderChartBudget();
  }
  if (currentPage==='metas') {
    renderMetas();
    renderChartMetas();
  }
  if (currentPage==='configuracoes') {
    renderColorSwatches();
    renderCatsSettings();
    renderFontGrid();
    renderThemeGrid();
    renderChallengeSettings();
    showPairCode();
  }

  // update theme swatches active state
  // Sync theme grid cards
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('onclick')?.includes("'" + (state.theme||'dark') + "'"));
  });
}

// ── START ──
// Auth boots first; init() is called by Auth.onLogin()

// ════════════════════════════════════════════════════
//  AUTH ENGINE — localStorage-based (no backend needed)
//  Swap AuthService methods for Firebase/Supabase later
// ════════════════════════════════════════════════════
const Auth = (() => {
  const USERS_KEY  = 'fc_users_db';
  const SESSION_KEY = 'fc_session';

  // ── Helpers ────────────────────────────────────
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }
  function saveUsers(db) {
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
  }
  function hashPw(pw) {
    // Simple deterministic hash (not crypto-secure — use bcrypt on a real backend)
    let h = 0x811c9dc5;
    for (let i = 0; i < pw.length; i++) {
      h ^= pw.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16) + pw.length.toString(16);
  }
  function genUid() {
    return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function genResetToken() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  // ── Session ────────────────────────────────────
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.name,
      ts: Date.now()
    }));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
  function currentUser() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!s) return null;
      // Session expires after 30 days
      if (Date.now() - s.ts > 30 * 86400 * 1000) { clearSession(); return null; }
      return s;
    } catch { return null; }
  }

  // ── Auth methods ────────────────────────────────
  function signup(name, email, password) {
    if (!name || name.trim().length < 2) return { ok: false, err: 'Nome deve ter pelo menos 2 caracteres.' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, err: 'E-mail inválido.' };
    if (!password || password.length < 6) return { ok: false, err: 'Senha deve ter pelo menos 6 caracteres.' };

    const db = getUsers();
    const emailKey = email.toLowerCase().trim();
    if (db[emailKey]) return { ok: false, err: 'Este e-mail já está cadastrado.' };

    const user = { uid: genUid(), name: name.trim(), email: emailKey, pwHash: hashPw(password), createdAt: Date.now() };
    db[emailKey] = user;
    saveUsers(db);
    setSession(user);
    return { ok: true, user };
  }

  function login(email, password) {
    if (!email || !password) return { ok: false, err: 'Preencha e-mail e senha.' };
    const db = getUsers();
    const emailKey = email.toLowerCase().trim();
    const user = db[emailKey];
    if (!user) return { ok: false, err: 'E-mail não encontrado.' };
    if (user.pwHash !== hashPw(password)) return { ok: false, err: 'Senha incorreta.' };
    setSession(user);
    return { ok: true, user };
  }

  function logout() {
    clearSession();
  }

  function requestReset(email) {
    const db = getUsers();
    const emailKey = email.toLowerCase().trim();
    if (!db[emailKey]) return { ok: false, err: 'E-mail não encontrado.' };
    const token = genResetToken();
    db[emailKey].resetToken = token;
    db[emailKey].resetTs = Date.now();
    saveUsers(db);
    // In a real app, send email. Here we show token in a simulated flow.
    return { ok: true, token, email: emailKey };
  }

  function resetPassword(email, token, newPw) {
    if (!newPw || newPw.length < 6) return { ok: false, err: 'Nova senha deve ter pelo menos 6 caracteres.' };
    const db = getUsers();
    const emailKey = email.toLowerCase().trim();
    const user = db[emailKey];
    if (!user) return { ok: false, err: 'Usuário não encontrado.' };
    if (!user.resetToken || user.resetToken !== token) return { ok: false, err: 'Token inválido.' };
    if (Date.now() - user.resetTs > 15 * 60 * 1000) return { ok: false, err: 'Token expirado. Solicite novamente.' };
    user.pwHash = hashPw(newPw);
    delete user.resetToken;
    delete user.resetTs;
    saveUsers(db);
    return { ok: true };
  }

  function changePassword(oldPw, newPw) {
    const session = currentUser();
    if (!session) return { ok: false, err: 'Não autenticado.' };
    const db = getUsers();
    const user = db[session.email];
    if (!user) return { ok: false, err: 'Usuário não encontrado.' };
    if (user.pwHash !== hashPw(oldPw)) return { ok: false, err: 'Senha atual incorreta.' };
    if (!newPw || newPw.length < 6) return { ok: false, err: 'Nova senha muito curta.' };
    user.pwHash = hashPw(newPw);
    saveUsers(db);
    return { ok: true };
  }

  function demoLogin() {
    const email = 'demo@fincasal.app';
    const db = getUsers();
    if (!db[email]) {
      db[email] = { uid: 'u_demo', name: 'Demo User', email, pwHash: hashPw('demo123'), createdAt: Date.now() };
      saveUsers(db);
    }
    setSession(db[email]);
    return { ok: true, user: db[email] };
  }

  // Called after login to boot the app
  function onLogin(user) {
    // Show app, hide auth
    document.getElementById('auth-root').classList.remove('visible');
    document.getElementById('app-root').style.display = 'block';
    // Populate topbar user menu
    document.getElementById('um-name').textContent  = user.name  || user.email;
    document.getElementById('um-email').textContent = user.email || '';
    document.getElementById('topbar-avatar-emoji').textContent = (user.name || 'U')[0].toUpperCase();
    // Boot app
    init();
    setTimeout(() => {
      initJellyAnimations();
      initSynaLogo();
    }, 400);
    setTimeout(() => {
      // Re-init logo after DOM is ready
      const logo = document.getElementById('syna-logo');
      if (!logo) return;
      logo.addEventListener('mousemove', e => {
        const rect = logo.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width/2)  / (rect.width/2);
        const y = (e.clientY - rect.top  - rect.height/2) / (rect.height/2);
        const img = logo.querySelector('.syna-logo-img');
        if (img) img.style.transform = `perspective(200px) rotateY(${x*18}deg) rotateX(${-y*18}deg) scale(1.12) translateY(-3px)`;
      });
      logo.addEventListener('mouseleave', () => {
        const img = logo.querySelector('.syna-logo-img');
        if (img) { img.style.transform=''; }
      });
    }, 400);
  }

  return { signup, login, logout, requestReset, resetPassword, changePassword, demoLogin, currentUser, onLogin };
})();

// ── Check session on page load ─────────────────────

// ══════════════════════════════════════════════════════════════
//  JELLY ANIMATION ENGINE
// ══════════════════════════════════════════════════════════════

// ── Ripple on click ───────────────────────────────────────────


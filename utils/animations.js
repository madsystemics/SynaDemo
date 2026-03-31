/**
 * utils/animations.js — Spring / jelly animation engine
 * Depends on: nothing (pure DOM)
 */
'use strict';

function createRipple(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

// ── Add ripple to elements matching selector ──────────────────
function attachRipple(selector) {
  document.querySelectorAll(selector).forEach(el => {
    if (el.dataset.ripple) return;
    el.dataset.ripple = '1';
    el.classList.add('ripple-host');
    el.addEventListener('click', createRipple);
  });
}

// ── Jelly wobble on element ───────────────────────────────────
function jellyWobble(el, intensity = 1) {
  if (!el) return;
  const kf = [
    { transform: 'scale(1)' },
    { transform: `scale(${1 - 0.08 * intensity}, ${1 + 0.12 * intensity})`, offset: 0.2 },
    { transform: `scale(${1 + 0.06 * intensity}, ${1 - 0.06 * intensity})`, offset: 0.4 },
    { transform: `scale(${1 - 0.03 * intensity}, ${1 + 0.03 * intensity})`, offset: 0.6 },
    { transform: `scale(${1 + 0.01 * intensity}, ${1 - 0.01 * intensity})`, offset: 0.8 },
    { transform: 'scale(1)' },
  ];
  el.animate(kf, { duration: 450, easing: 'ease-out' });
}

// ── Bounce number counter for card values ─────────────────────
function animateCounter(el, from, to, duration = 600) {
  if (!el || isNaN(to)) return;
  const start = performance.now();
  const diff = to - from;
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    // Spring easing
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const cur = from + diff * ease;
    el.textContent = 'R$ ' + Math.abs(cur).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = 'R$ ' + Math.abs(to).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  requestAnimationFrame(step);
}

// ── Stagger children animation ────────────────────────────────
function staggerAnimate(parentSelector, childSelector, delay = 60) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return;
  const children = parent.querySelectorAll(childSelector);
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(16px) scale(0.96)';
    child.style.transition = 'none';
    setTimeout(() => {
      child.style.transition = `opacity .35s cubic-bezier(0.34,1.56,0.64,1) ${i * delay}ms,
                                transform .35s cubic-bezier(0.34,1.56,0.64,1) ${i * delay}ms`;
      child.style.opacity = '1';
      child.style.transform = 'none';
    }, 20);
  });
}

// ── Attach all ripples + jelly on DOM ready ───────────────────
function initJellyAnimations() {
  const RIPPLE_TARGETS = [
    '.nav-item', '.btn-primary', '.btn-secondary', '.btn-danger',
    '.pill-filter', '.filter-chip', '.theme-card', '.font-card',
    '.color-swatch', '.theme-swatch', '.theme-chip',
    '.qa-btn', '.qa-key', '.toggle-btn', '.tb',
    '.month-btn', '.settings-item', '.user-menu-item',
    '.auth-btn', '.modal-close',
  ];
  RIPPLE_TARGETS.forEach(sel => attachRipple(sel));

  // Re-attach on DOM changes via MutationObserver
  const observer = new MutationObserver(() => {
    RIPPLE_TARGETS.forEach(sel => attachRipple(sel));
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Jelly wobble on nav active ────────────────────────────────
const _origGoPage_jelly = goPage;
// patch already done above, just add wobble hook via event
document.addEventListener('click', e => {
  const navItem = e.target.closest('.nav-item');
  if (navItem) jellyWobble(navItem, 0.7);

  const btn = e.target.closest('.btn-primary, .auth-btn');
  if (btn) jellyWobble(btn, 0.4);

  const qaKey = e.target.closest('.qa-key');
  if (qaKey) {
    qaKey.classList.add('qa-pressed');
    setTimeout(() => qaKey.classList.remove('qa-pressed'), 300);
  }
});

// ── Toast wobble on show ──────────────────────────────────────
const _origShowToast = showToast;
window.showToast = function(msg, type, dur) {
  _origShowToast(msg, type, dur);
  setTimeout(() => {
    const t = document.getElementById('toast');
    if (t && t.classList.contains('show')) jellyWobble(t, 0.5);
  }, 50);
};

// ── Card value counter animation ──────────────────────────────
// Hook into renderDashCards to animate card values
const _origRenderDash = typeof renderDashCards !== 'undefined' ? renderDashCards : null;

(function bootAuth() {
  const user = Auth.currentUser();
  if (user) {
    Auth.onLogin(user);
  }
  // Otherwise auth-root stays visible
})();

// ── Resize: redraw all charts when window resizes ──
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    Object.values(charts).forEach(c => { try { c.resize(); } catch(e) {} });
  }, 120);
});

// ════════════════════════════════════════════════════
//  AUTH UI HANDLERS
// ════════════════════════════════════════════════════
let _authMode = 'login';
let _resetContext = null; // { email, token } during reset flow

function authShowMode(mode) {
  _authMode = mode;
  const forms   = { login: 'form-login', signup: 'form-signup', reset: 'form-reset', confirm: 'form-reset' };
  const tabRow  = document.getElementById('auth-tab-row');
  const footer  = document.getElementById('auth-switch-link');

  // Show/hide forms
  ['form-login','form-signup','form-reset'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(forms[mode] || 'form-login').style.display = 'block';

  // Tabs
  document.getElementById('tab-login').classList.toggle('active',  mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  tabRow.style.display = (mode === 'reset') ? 'none' : 'flex';

  // Footer link
  if (mode === 'login')  footer.innerHTML = 'Não tem conta? <a onclick="authShowMode(\'signup\')">Criar gratuitamente</a>';
  if (mode === 'signup') footer.innerHTML = 'Já tem conta? <a onclick="authShowMode(\'login\')">Entrar →</a>';
  if (mode === 'reset')  footer.innerHTML = '';

  // Clear messages
  authSetError('');
  authSetSuccess('');
}

function authSetError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}
function authSetSuccess(msg) {
  const el = document.getElementById('auth-success');
  el.innerHTML = msg;
  el.classList.toggle('show', !!msg);
}
function authSetLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function authTogglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function authPwStrength(pw) {
  const bar = document.getElementById('pw-bar');
  if (!bar) return;
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const colors = ['#e05555','#e0a040','#e0a040','#5cb88a','#5cb88a'];
  const widths  = ['20%','40%','60%','80%','100%'];
  bar.style.width      = pw.length ? widths[Math.min(score-1,4)] : '0%';
  bar.style.background = pw.length ? colors[Math.min(score-1,4)] : 'transparent';
}

function authLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pw    = document.getElementById('login-pw')?.value;
  authSetError('');
  authSetLoading('btn-login', true);
  setTimeout(() => {
    const res = Auth.login(email, pw);
    authSetLoading('btn-login', false);
    if (!res.ok) { authSetError(res.err); return; }
    Auth.onLogin(res.user);
  }, 400); // slight delay for UX feel
}

function authSignup() {
  const name  = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const pw    = document.getElementById('signup-pw')?.value;
  const pw2   = document.getElementById('signup-pw2')?.value;
  authSetError('');
  if (pw !== pw2) { authSetError('As senhas não coincidem.'); return; }
  authSetLoading('btn-signup', true);
  setTimeout(() => {
    const res = Auth.signup(name, email, pw);
    authSetLoading('btn-signup', false);
    if (!res.ok) { authSetError(res.err); return; }
    Auth.onLogin(res.user);
  }, 400);
}

function authReset() {
  const email = document.getElementById('reset-email')?.value.trim();
  authSetError('');
  authSetLoading('btn-reset', true);
  setTimeout(() => {
    const res = Auth.requestReset(email);
    authSetLoading('btn-reset', false);
    if (!res.ok) { authSetError(res.err); return; }
    // Simulate "email sent" — show token-based reset form inline
    _resetContext = { email: res.email, token: res.token };
    document.getElementById('form-reset').innerHTML = `
      <div style="font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.6">
        ✉️ Em um app real, você receberia um e-mail. <br>
        Nesta versão local, use o código abaixo:
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-xs);padding:12px;text-align:center;font-size:22px;font-weight:700;letter-spacing:4px;color:var(--p1);margin-bottom:18px">${res.token}</div>
      <div class="auth-form-group">
        <label class="auth-label">Código recebido</label>
        <input class="auth-input" id="reset-token" placeholder="${res.token}" maxlength="8" style="text-transform:uppercase;letter-spacing:3px;text-align:center;font-size:18px">
      </div>
      <div class="auth-form-group">
        <label class="auth-label">Nova senha</label>
        <div class="auth-input-wrap">
          <input class="auth-input" id="reset-newpw" type="password" placeholder="Mínimo 6 caracteres">
          <button class="auth-pw-toggle" onclick="authTogglePw('reset-newpw',this)" type="button">👁</button>
        </div>
      </div>
      <button class="auth-btn" id="btn-reset-confirm" onclick="authConfirmReset()"><span>Redefinir senha →</span></button>
      <div class="auth-footer-link" style="margin-top:14px"><a onclick="authShowMode('login')">← Voltar para o login</a></div>
    `;
  }, 500);
}

function authConfirmReset() {
  if (!_resetContext) return;
  const token = (document.getElementById('reset-token')?.value || '').trim().toUpperCase();
  const newPw = document.getElementById('reset-newpw')?.value;
  authSetError('');
  authSetLoading('btn-reset-confirm', true);
  setTimeout(() => {
    const res = Auth.resetPassword(_resetContext.email, token || _resetContext.token, newPw);
    authSetLoading('btn-reset-confirm', false);
    if (!res.ok) { authSetError(res.err); return; }
    _resetContext = null;
    authSetSuccess('✅ Senha redefinida com sucesso! Faça login.');
    setTimeout(() => authShowMode('login'), 1800);
  }, 400);
}

function authDemo() {
  authSetLoading('btn-login', true);
  setTimeout(() => {
    const res = Auth.demoLogin();
    authSetLoading('btn-login', false);
    Auth.onLogin(res.user);
  }, 300);
}

function authLogout() {
  if (!confirm('Sair da conta?')) return;
  Auth.logout();
  // Reset app state visually
  document.getElementById('app-root').style.display = 'none';
  document.getElementById('auth-root').classList.add('visible');
  authShowMode('login');
  // Clear in-memory state
  Object.assign(state, {
    transactions: [], metas: [], budgets: {},
    names: ['Pessoa 1', 'Pessoa 2'], emojis: ['💛', '💙'],
    theme: 'dark',
  });
  // Destroy charts to avoid canvas reuse issues
  Object.values(charts).forEach(c => { try { c.destroy(); } catch {} });
  Object.keys(charts).forEach(k => delete charts[k]);
}

// ── Change password from inside the app ─────────────
function authChangePassword() {
  const oldPw = prompt('Senha atual:');
  if (!oldPw) return;
  const newPw = prompt('Nova senha (mínimo 6 caracteres):');
  if (!newPw) return;
  const res = Auth.changePassword(oldPw, newPw);
  if (res.ok) showToast('✅ Senha alterada com sucesso!');
  else showToast('⚠️ ' + res.err);
}

// ── User menu toggle ─────────────────────────────────
function toggleUserMenu() {
  const dd = document.getElementById('user-menu-dropdown');
  dd.classList.toggle('open');
}

// Close user menu when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrap')) {
    document.getElementById('user-menu-dropdown')?.classList.remove('open');
  }
});

// Enter key support on auth forms




// ══════════════════════════════════════════════════════════════
//  FONT SYSTEM
// ══════════════════════════════════════════════════════════════
// [moved to top]

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

function renderQuickAddStrip() {
  const el = document.getElementById('quick-add-strip');
  if (!el) return;
  el.innerHTML = QA_CATS.map(c => `
    <button class="qa-btn" onclick="openQuickAdd('${c.id}')">
      <span class="qa-icon">${c.icon}</span>
      <span class="qa-label">${c.label}</span>
    </button>
  `).join('') + `
    <button class="qa-btn" onclick="openQuickAdd('outros','receita')" style="border-color:rgba(var(--green-r),.25);background:rgba(var(--green-r),.05)">
      <span class="qa-icon">💰</span>
      <span class="qa-label" style="color:var(--green)">Receita</span>
    </button>
  `;
}

function openQuickAdd(catId, type) {
  _qaBuffer = '';
  _qaType   = type || 'gasto';
  _qaOpen   = true;
  qaUpdateDisplay();
  qaSelType(_qaType);
  // pre-select category
  const sel = document.getElementById('qa-cat');
  if (sel) {
    populateQaCatSel();
    sel.value = catId;
  }
  const desc = document.getElementById('qa-desc');
  if (desc) desc.value = '';
  openModal('modal-quickadd');
}

function populateQaCatSel() {
  const sel = document.getElementById('qa-cat');
  if (!sel) return;
  sel.innerHTML = state.cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

function qaKey(k) {
  if (k === 'del') {
    _qaBuffer = _qaBuffer.slice(0,-1);
  } else if (k === ',') {
    if (!_qaBuffer.includes(',')) _qaBuffer += ',';
  } else {
    if (_qaBuffer.includes(',') && _qaBuffer.split(',')[1]?.length >= 2) return;
    if (_qaBuffer.length >= 10) return;
    _qaBuffer += k;
  }
  qaUpdateDisplay();
}

function qaUpdateDisplay() {
  const el = document.getElementById('qa-display');
  if (!el) return;
  const raw = _qaBuffer.replace(',','.');
  const num = parseFloat(raw) || 0;
  el.textContent = _qaBuffer || '0,00';
  el.className = 'qa-amount-display ' + _qaType;
}

function qaSelType(t) {
  _qaType = t;
  document.getElementById('qa-tb-gasto')?.classList.toggle('on-gasto',   t==='gasto');
  document.getElementById('qa-tb-receita')?.classList.toggle('on-receita', t==='receita');
  qaUpdateDisplay();
}

function qaConfirm() {
  const raw    = _qaBuffer.replace(',','.');
  const amount = parseFloat(raw);
  const cat    = document.getElementById('qa-cat')?.value || 'outros';
  const desc   = document.getElementById('qa-desc')?.value.trim() || (state.cats.find(c=>c.id===cat)?.name||'Lançamento');
  if (!amount || amount <= 0) { showToast('⚠️ Digite um valor','error'); return; }
    state.transactions.push({
    id: Date.now().toString(),
    person: selectedPerson,
    type: _qaType,
    desc,
    valor: amount,
    data: new Date().toISOString().split('T')[0],
    cat,
    notas: '',
    recorrente: '',
  });
  saveState();
  _qaBuffer = '';
  closeModal('modal-quickadd');
  showToast(_qaType === 'gasto' ? '↓ Gasto adicionado' : '↑ Receita adicionada');
  renderAll();
  checkChallengeProgress();
}

// ══════════════════════════════════════════════════════════════
//  CHALLENGE SYSTEM
// ══════════════════════════════════════════════════════════════
function saveChallenge() {
  const name  = document.getElementById('ch-name')?.value.trim();
  const goal  = parseFloat(document.getElementById('ch-goal')?.value);
  const start = document.getElementById('ch-start')?.value;
  const end   = document.getElementById('ch-end')?.value;
  const emoji = document.getElementById('ch-emoji')?.value.trim() || '🏆';
  const type  = document.getElementById('ch-type')?.value;

  if (!name || !goal || !start || !end) { showToast('⚠️ Preencha todos os campos','error'); return; }

  state.challenge = { name, goal, start, end, emoji, type, createdAt: Date.now() };
  saveState();
  closeModal('modal-challenge');
  showToast('🏆 Desafio criado! Boa sorte!');
  renderAll();
}

function cancelChallenge() {
  if (!confirm('Cancelar o desafio atual?')) return;
  state.challenge = null;
  saveState();
  closeModal('modal-challenge');
  renderAll();
}

function getChallengeProgress() {
  const ch = state.challenge;
  if (!ch) return null;
  const now  = new Date();
  const start= new Date(ch.start + 'T00:00');
  const end  = new Date(ch.end   + 'T23:59');
  const txs  = state.transactions.filter(t => {
    const d = new Date(t.data + 'T12:00');
    return d >= start && d <= end;
  });

  let current = 0;
  if (ch.type === 'economia') {
    const r = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
    const g = txs.filter(t=>t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
    current = Math.max(0, r - g);
  } else if (ch.type === 'limite') {
    const g = txs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
    current = Math.max(0, ch.goal - g);
  } else if (ch.type === 'sem-cat') {
    const spent = txs.filter(t=>t.type==='gasto'&&t.cat===ch.category).reduce((a,t)=>a+t.valor,0);
    current = spent === 0 ? ch.goal : 0;
  } else {
    current = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
  }

  const pct    = Math.min(current / ch.goal * 100, 100);
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const won    = pct >= 100;
  return { pct, current, daysLeft, won, ch };
}

function renderChallengeDash() {
  const el = document.getElementById('challenge-dash');
  if (!el) return;

  const prog = getChallengeProgress();
  if (!prog) { el.style.display = 'none'; return; }
  el.style.display = 'block';

  const { pct, current, daysLeft, won, ch } = prog;
  const fmt = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  el.innerHTML = `
    <div class="challenge-card">
      <div class="challenge-header">
        <div class="challenge-title">${ch.name}</div>
        <div class="challenge-badge">${ch.emoji}</div>
      </div>
      <div class="challenge-desc">
        ${ch.type==='economia'?'Economizar '+fmt(ch.goal):ch.type==='limite'?'Gastar até '+fmt(ch.goal):'Meta: '+fmt(ch.goal)}
      </div>
      <div class="challenge-track">
        <div class="challenge-fill" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <div class="challenge-footer">
        <span class="challenge-pct">${Math.round(pct)}% concluído</span>
        <span class="challenge-days">${daysLeft} dia${daysLeft!==1?'s':''} restante${daysLeft!==1?'s':''}</span>
      </div>
      ${won ? '<div class="challenge-win">🎉 Desafio concluído! Parabéns!</div>' : ''}
    </div>
  `;
}

function renderChallengeSettings() {
  const el = document.getElementById('challenge-settings-area');
  if (!el) return;
  const prog = getChallengeProgress();
  const btn  = document.getElementById('btn-cancel-challenge');
  if (!prog) {
    el.innerHTML = '<div style="font-size:13px;color:var(--text3);padding:8px 0">Nenhum desafio ativo. Crie um!</div>';
    if (btn) btn.style.display = 'none';
    return;
  }
  const { pct, ch, daysLeft } = prog;
  el.innerHTML = `
    <div style="font-size:13px;margin-bottom:8px"><strong>${ch.emoji} ${ch.name}</strong></div>
    <div class="challenge-track" style="margin-bottom:6px">
      <div class="challenge-fill" style="width:${pct.toFixed(1)}%"></div>
    </div>
    <div style="font-size:12px;color:var(--text2)">${Math.round(pct)}% · ${daysLeft} dia(s) restante(s)</div>
  `;
  if (btn) btn.style.display = 'block';
}

function checkChallengeProgress() {
  const prog = getChallengeProgress();
  if (prog?.won && !state._challengeWinToasted) {
    state._challengeWinToasted = true;
    showToast('🎉 Desafio concluído! Parabéns!');
    saveState();
  }
}

// ══════════════════════════════════════════════════════════════
//  MONTHLY REPORT
// ══════════════════════════════════════════════════════════════
// [moved to top]

function buildReport(month, year) {
  const fmt = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtShortR = n => Math.abs(n)>=1000?'R$ '+(Math.abs(n)/1000).toFixed(1).replace('.',',')+'k':fmt(n);

  const txs = state.transactions.filter(t => {
    const d = new Date(t.data+'T12:00');
    return d.getMonth()===month && d.getFullYear()===year;
  });

  const tR  = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const tG  = txs.filter(t=>t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
  const bal = tR - tG;
  const savRate = tR > 0 ? ((tR-tG)/tR*100) : 0;

  const p1R = txs.filter(t=>t.person===1&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p1G = txs.filter(t=>t.person===1&&t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
  const p2R = txs.filter(t=>t.person===2&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p2G = txs.filter(t=>t.person===2&&t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);

  const catSpent = {};
  txs.filter(t=>t.type==='gasto').forEach(t=>{ catSpent[t.cat]=(catSpent[t.cat]||0)+t.valor; });
  const topCat = Object.entries(catSpent).sort((a,b)=>b[1]-a[1])[0];

  const recur = {};
  state.transactions.forEach(t=>{ const k=(t.desc||'').toLowerCase().trim(); recur[k]=(recur[k]||0)+1; });
  const recCount = Object.values(recur).filter(v=>v>=2).length;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const prevTxs   = state.transactions.filter(t=>{ const d=new Date(t.data+'T12:00'); return d.getMonth()===prevMonth&&d.getFullYear()===prevYear; });
  const prevG     = prevTxs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const gDelta    = prevG > 0 ? ((tG - prevG) / prevG * 100) : null;

  let insight = '';
  if (savRate > 30)      insight = `<strong>Excelente!</strong> Vocês pouparam ${savRate.toFixed(0)}% da renda — acima da meta recomendada de 20%.`;
  else if (savRate > 10) insight = `<strong>Bom controle.</strong> Taxa de poupança de ${savRate.toFixed(0)}%. Tente chegar a 20% no próximo mês.`;
  else if (tR === 0)     insight = `Nenhuma receita registrada. Lembre-se de lançar salários e entradas.`;
  else                   insight = `<strong>Atenção:</strong> Apenas ${savRate.toFixed(0)}% da renda foi poupada. Revise os gastos em ${topCat?topCat[0]:'lazer'}.`;

  if (gDelta !== null) {
    insight += gDelta > 10
      ? ` Os gastos subiram <strong>${gDelta.toFixed(0)}%</strong> em relação ao mês anterior.`
      : gDelta < -10
      ? ` Os gastos caíram <strong>${Math.abs(gDelta).toFixed(0)}%</strong> — ótima evolução!`
      : '';
  }

  return `
    <div class="report-section">
      <div class="report-kpi-grid">
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--green)">${fmtShortR(tR)}</div>
          <div class="report-kpi-lbl">Receitas</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--red)">${fmtShortR(tG)}</div>
          <div class="report-kpi-lbl">Gastos</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:${bal>=0?'var(--green)':'var(--red)'}">${fmtShortR(bal)}</div>
          <div class="report-kpi-lbl">Saldo</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--p1)">${savRate.toFixed(0)}%</div>
          <div class="report-kpi-lbl">Poupança</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <div class="report-title">Por parceiro</div>
      <div class="report-row">
        <span class="report-row-lbl">${state.emojis[0]} ${state.names[0]}</span>
        <span class="report-row-val" style="color:var(--p1)">${fmt(p1R-p1G)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↑ Receitas</span>
        <span style="font-size:12px;color:var(--green)">${fmt(p1R)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↓ Gastos</span>
        <span style="font-size:12px;color:var(--red)">${fmt(p1G)}</span>
      </div>
      <div class="report-row" style="margin-top:6px">
        <span class="report-row-lbl">${state.emojis[1]} ${state.names[1]}</span>
        <span class="report-row-val" style="color:var(--p2)">${fmt(p2R-p2G)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↑ Receitas</span>
        <span style="font-size:12px;color:var(--green)">${fmt(p2R)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↓ Gastos</span>
        <span style="font-size:12px;color:var(--red)">${fmt(p2G)}</span>
      </div>
    </div>

    ${Object.keys(catSpent).length ? `
    <div class="report-section">
      <div class="report-title">Gastos por categoria</div>
      ${Object.entries(catSpent).sort((a,b)=>b[1]-a[1]).map(([id,v]) => {
        const c = state.cats.find(x=>x.id===id)||{icon:'📦',name:id};
        const pct = tG>0?v/tG*100:0;
        return `
          <div class="report-row">
            <span class="report-row-lbl">${c.icon} ${c.name}</span>
            <span class="report-row-val">${fmt(v)} <span style="font-size:11px;color:var(--text3)">${pct.toFixed(0)}%</span></span>
          </div>
        `;
      }).join('')}
    </div>` : ''}

    <div class="report-section">
      <div class="report-title">Extras</div>
      <div class="report-row">
        <span class="report-row-lbl">Total de lançamentos</span>
        <span class="report-row-val">${txs.length}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl">Transações recorrentes detectadas</span>
        <span class="report-row-val">${recCount}</span>
      </div>
      ${gDelta!==null?`<div class="report-row">
        <span class="report-row-lbl">Variação de gastos (mês ant.)</span>
        <span class="report-row-val" style="color:${gDelta>0?'var(--red)':'var(--green)'}">${gDelta>0?'+':''}${gDelta.toFixed(0)}%</span>
      </div>`:''}
    </div>

    <div class="report-insight">${insight}</div>
  `;
}

function openReport() {
  const el    = document.getElementById('report-modal-body');
  const title = document.getElementById('report-modal-title');
  if (el)    el.innerHTML = buildReport(currentMonth, currentYear);
  if (title) title.textContent = 'Relatório de ' + MONTHS_FULL[currentMonth] + ' ' + currentYear;
  openModal('modal-report');
}

// ══════════════════════════════════════════════════════════════
//  REAL-TIME SYNC  (localStorage + StorageEvent)
// ══════════════════════════════════════════════════════════════
let _syncOnline = true;
let _syncWatchInterval = null;

function initSync() {
  // StorageEvent fires when ANOTHER tab/window changes localStorage
  window.addEventListener('storage', e => {
    const uid = Auth.currentUser()?.uid || 'guest';
    if (e.key === 'fincasal_pro_v2_' + uid) {
      try {
        const fresh = JSON.parse(e.newValue || '{}');
        Object.assign(state, fresh);
        setSyncStatus(true, 'sincronizado');
        renderAll();
        showToast('🔄 Dados atualizados pelo parceiro');
      } catch {}
    }
  });

  // Heartbeat to show online/offline status
  _syncWatchInterval = setInterval(() => {
    const wasOnline = _syncOnline;
    _syncOnline = navigator.onLine;
    if (wasOnline !== _syncOnline) {
      setSyncStatus(_syncOnline, _syncOnline ? 'ao vivo' : 'offline');
    }
  }, 3000);

  window.addEventListener('online',  () => { setSyncStatus(true,  'ao vivo'); });
  window.addEventListener('offline', () => { setSyncStatus(false, 'offline'); });
}

function setSyncStatus(online, text) {
  ['sync-dot','sync-dot-settings'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'sync-dot' + (online ? '' : ' offline'); }
  });
  ['sync-text','sync-text-settings'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}

// ══════════════════════════════════════════════════════════════
//  PAIR CODE SYNC
// ══════════════════════════════════════════════════════════════
function getPairCode() {
  const uid = Auth.currentUser()?.uid || 'guest';
  let code = localStorage.getItem('fc_paircode_' + uid);
  if (!code) {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem('fc_paircode_' + uid, code);
  }
  return code;
}

function showPairCode() {
  const code = getPairCode();
  const bigEl = document.getElementById('pair-code-big');
  const dispEl = document.getElementById('couple-code-display');
  const settEl = document.getElementById('report-month-lbl');
  if (bigEl) bigEl.textContent = code;
  if (dispEl) dispEl.textContent = code;
  if (settEl) settEl.textContent = MONTHS_FULL[currentMonth] + ' ' + currentYear;
}

function copyPairCode() {
  const code = getPairCode();
  navigator.clipboard?.writeText(code).catch(()=>{});
  showToast('📋 Código copiado: ' + code);
}

function joinPairCode() {
  const inp = document.getElementById('pair-input')?.value.trim().toUpperCase();
  if (!inp || inp.length < 4) { showToast('⚠️ Digite o código completo','error'); return; }

  // Find the other user's data by scanning localStorage for their pair code
  let found = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fc_paircode_')) {
      if (localStorage.getItem(key) === inp) {
        const otherUid = key.replace('fc_paircode_','');
        const otherData = localStorage.getItem('fincasal_pro_v2_' + otherUid);
        if (otherData) {
          try {
            const parsed = JSON.parse(otherData);
            // Merge transactions (keep unique by id)
            const myIds = new Set(state.transactions.map(t=>t.id));
            const merged = [...state.transactions, ...parsed.transactions.filter(t=>!myIds.has(t.id))];
            state.transactions = merged;
            // Adopt their names if we have none set
            if (parsed.names) state.names = parsed.names;
            if (parsed.emojis) state.emojis = parsed.emojis;
            saveState();
            renderAll();
            closeModal('modal-pair');
            showToast('✅ Sincronizado com sucesso!');
            found = true;
          } catch {}
        }
        break;
      }
    }
  }
  if (!found) showToast('⚠️ Código não encontrado ou sem dados','error');
}

// ══════════════════════════════════════════════════════════════
//  AUTO REPORT CHECK (on each init, notify if new month)
// ══════════════════════════════════════════════════════════════
function checkAutoReport() {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  // Show report banner on the 1st of the month if not shown yet
  if (now.getDate() === 1 && state.lastReportMonth !== m) {
    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const txs = state.transactions.filter(t => {
      const d = new Date(t.data+'T12:00');
      return d.getMonth()===prevM && d.getFullYear()===prevY;
    });
    if (txs.length > 0) {
      setTimeout(() => {
        showToast('📋 Relatório de ' + MONTHS_FULL[prevM] + ' disponível!');
        state.lastReportMonth = m;
        saveState();
      }, 1500);
    }
  }
}


// ══════════════════════════════════════════════════════════════
//  SYNA LOGO INTERACTIONS
// ══════════════════════════════════════════════════════════════
const SYNA_ANIMS   = ['anim-squish', 'anim-spin', 'anim-explode'];
const SYNA_COLORS  = ['#b340f0','#00d4ff','#ff3cac','#ffcc00','#00ff94'];
let   _synaAnimIdx = 0;

function synaLogoClick() {
  const logo = document.getElementById('syna-logo');
  if (!logo) return;

  // Remove all anim classes first
  SYNA_ANIMS.forEach(a => logo.classList.remove(a));

  // Small timeout so removing class triggers reflow
  requestAnimationFrame(() => {
    const anim = SYNA_ANIMS[_synaAnimIdx % SYNA_ANIMS.length];
    logo.classList.add(anim);
    _synaAnimIdx++;

    // Explode — emit particles
    if (anim === 'anim-explode') synaEmitParticles(logo);

    // Remove class after animation ends
    setTimeout(() => logo.classList.remove(anim), 700);
  });

  // Easter egg: navigate to dashboard on click
  if (typeof goPage === 'function') goPage('dashboard');
}

function synaEmitParticles(logoEl) {
  const rect = logoEl.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const count = 10;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'syna-particle';
    const angle  = (i / count) * Math.PI * 2;
    const dist   = 28 + Math.random() * 22;
    const px     = Math.cos(angle) * dist;
    const py     = Math.sin(angle) * dist;
    const color  = SYNA_COLORS[i % SYNA_COLORS.length];
    dot.style.cssText = `
      left:${cx}px; top:${cy}px;
      background:${color};
      --px:${px}px; --py:${py}px;
      box-shadow: 0 0 6px ${color};
      position:fixed;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }
}

// ── Tooltip on hover: show app name ──────────────────────────
function initSynaLogo() {
  const logo = document.getElementById('syna-logo');
  if (!logo) return;

  // Subtle tilt follow on mouse move
  logo.addEventListener('mousemove', e => {
    const rect = logo.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const y = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    const img = logo.querySelector('.syna-logo-img');
    if (img) {
      img.style.transform = `
        perspective(200px)
        rotateY(${x * 18}deg)
        rotateX(${-y * 18}deg)
        scale(1.12)
        translateY(-3px)
      `;
    }
  });

  logo.addEventListener('mouseleave', () => {
    const img = logo.querySelector('.syna-logo-img');
    if (img) {
      img.style.transform = '';
      img.style.transition = 'transform .45s var(--spring), filter .3s ease';
    }
  });
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (_authMode === 'login')  authLogin();
  if (_authMode === 'signup') authSignup();
  if (_authMode === 'reset')  authReset();
});


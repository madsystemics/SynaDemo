import { goPage } from "../app.js";
'use strict';

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



/**
 * pages/auth-ui.js — Auth UI handlers (login, signup, reset, demo)
 */
'use strict';

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



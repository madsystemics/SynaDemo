// ============================================================
//  DOM UTILS  — element helpers, ripple, toast, modal
// ============================================================

// ── Element query helpers ──────────────────────────────────
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
export const el = (tag, props = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class')  e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
};

// ── Set inner HTML safely (only used for trusted content) ──
export function setHTML(element, html) {
  if (element) element.innerHTML = html;
}

// ── Toast ──────────────────────────────────────────────────
let _toastTimer = null;
export function showToast(message, type = 'success', duration = 2800) {
  let toast = $('#global-toast');
  if (!toast) {
    toast = Object.assign(document.createElement('div'), { id: 'global-toast', className: 'toast' });
    document.body.appendChild(toast);
  }
  clearTimeout(_toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Modal ──────────────────────────────────────────────────
export function openModal(id) {
  $('#' + id)?.classList.add('open');
}
export function closeModal(id) {
  $('#' + id)?.classList.remove('open');
}
export function closeAllModals() {
  $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
}

// ── Ripple ────────────────────────────────────────────────
export function addRipple(element) {
  if (!element || element.dataset.ripple) return;
  element.dataset.ripple = '1';
  element.classList.add('ripple-host');
  element.addEventListener('click', e => {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
    `;
    element.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  });
}

// ── Attach ripple to all matching elements ─────────────────
const RIPPLE_SELECTORS = [
  '.btn', '.nav-item', '.pill-filter', '.toggle-btn',
  '.theme-card', '.swatch', '.font-card', '.bottom-nav-item',
  '.bottom-nav-fab', '.month-nav button', '.settings-row',
  '.auth-btn', '.modal-close', '.user-menu-item',
];
export function initRipples() {
  RIPPLE_SELECTORS.forEach(sel => $$(sel).forEach(addRipple));
}

// ── Jelly wobble ──────────────────────────────────────────
export function wobble(element, intensity = 1) {
  if (!element) return;
  element.animate([
    { transform: 'scale(1)' },
    { transform: `scale(${1-0.08*intensity}, ${1+0.12*intensity})`, offset: 0.2 },
    { transform: `scale(${1+0.06*intensity}, ${1-0.06*intensity})`, offset: 0.4 },
    { transform: `scale(${1-0.02*intensity}, ${1+0.02*intensity})`, offset: 0.7 },
    { transform: 'scale(1)' },
  ], { duration: 420, easing: 'ease-out' });
}

// ── Stagger-animate children ──────────────────────────────
export function staggerIn(parent, childSel, delayMs = 55) {
  if (!parent) return;
  const kids = $$(childSel, parent);
  kids.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(14px) scale(0.97)';
    setTimeout(() => {
      child.style.transition = `opacity .3s var(--spring-soft), transform .3s var(--spring-soft)`;
      child.style.opacity = '';
      child.style.transform = '';
      setTimeout(() => { child.style.transition = ''; }, 400);
    }, 20 + i * delayMs);
  });
}

// ── Page transition ────────────────────────────────────────
export function switchPage(fromId, toId) {
  const from = $('#page-' + fromId);
  const to   = $('#page-' + toId);
  if (!to) return;

  if (from && from !== to) {
    from.classList.add('exiting');
    from.classList.remove('active');
    setTimeout(() => from.classList.remove('exiting'), 220);
  }

  setTimeout(() => {
    to.classList.add('active');
    // Re-trigger title animation
    const title = $('#topbar-title');
    if (title) {
      title.style.animation = 'none';
      requestAnimationFrame(() => { title.style.animation = ''; });
    }
  }, 30);
}

// ── Auto-observe DOM for new rippleable elements ───────────
let _observer = null;
export function watchForNewElements() {
  if (_observer) return;
  _observer = new MutationObserver(() => initRipples());
  _observer.observe(document.body, { childList: true, subtree: true });
}

// ── Close modals on outside click ─────────────────────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

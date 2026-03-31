/**
 * components/logo.js — Syna logo interactions (click, hover, particles)
 * Depends on: utils/animations.js
 */
'use strict';

const SYNA_ANIMS  = ['anim-squish','anim-spin','anim-explode'];
const SYNA_COLORS = ['#b340f0','#00d4ff','#ff3cac','#ffcc00','#00ff94'];
let _synaAnimIdx  = 0;

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


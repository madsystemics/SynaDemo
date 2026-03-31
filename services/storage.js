// ============================================================
//  STORAGE SERVICE  — localStorage adapter
//  Per-user data isolation, fallback-safe, JSON serialized
// ============================================================

const PREFIX = 'syna_v1';

function userKey(uid, suffix) {
  return `${PREFIX}_${uid}_${suffix}`;
}

export const Storage = {
  // ── Save full app state for a user ─────────────────────
  save(uid, state) {
    try {
      const { transactions, budgets, goals, challenge, cats,
              names, emojis, p1Color, p2Color, theme, font, fontDisplay, textColor,
              avatar1, avatar2, bgUrl, bgBlur, bgOpacity, bgBrightness, bgContrast,
              lastReportMonth } = state;

      localStorage.setItem(userKey(uid, 'data'), JSON.stringify({
        transactions, budgets, goals, challenge, cats,
        names, emojis, p1Color, p2Color, theme, font, fontDisplay, textColor,
        avatar1, avatar2, bgUrl, bgBlur, bgOpacity, bgBrightness, bgContrast,
        lastReportMonth,
        savedAt: Date.now(),
      }));
      return true;
    } catch (e) {
      console.warn('[Storage] save failed:', e);
      return false;
    }
  },

  // ── Load state for a user ───────────────────────────────
  load(uid) {
    try {
      const raw = localStorage.getItem(userKey(uid, 'data'));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] load failed:', e);
      return null;
    }
  },

  // ── Pair code for multi-device sync ────────────────────
  getPairCode(uid) {
    const k = userKey(uid, 'pair');
    let code = localStorage.getItem(k);
    if (!code) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(k, code);
    }
    return code;
  },

  // ── Cross-device sync: find data by pair code ───────────
  syncByCode(code) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.endsWith('_pair')) continue;
      if (localStorage.getItem(k) !== code.toUpperCase()) continue;

      const uid = k.replace(`${PREFIX}_`, '').replace('_pair', '');
      const data = this.load(uid);
      if (data) return { uid, data };
    }
    return null;
  },

  // ── Storage event: detect changes from other tabs ──────
  onExternalChange(uid, callback) {
    const handler = (e) => {
      if (e.key === userKey(uid, 'data')) {
        try { callback(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },

  // ── Clear a user's data ─────────────────────────────────
  clear(uid) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(userKey(uid, ''))) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },

  // ── Export all user data as JSON blob ──────────────────
  exportJSON(uid, state) {
    const data = this.load(uid) ?? state;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `syna-backup-${new Date().toISOString().split('T')[0]}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  },

  // ── Import JSON ─────────────────────────────────────────
  async importJSON() {
    return new Promise((resolve, reject) => {
      const input = Object.assign(document.createElement('input'), {
        type: 'file',
        accept: '.json',
      });
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return reject(new Error('No file selected'));
        const reader = new FileReader();
        reader.onload = e2 => {
          try { resolve(JSON.parse(e2.target.result)); }
          catch { reject(new Error('Invalid JSON')); }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },
};

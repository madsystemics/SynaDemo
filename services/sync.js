/**
 * services/sync.js — Cross-tab sync via StorageEvent + pair codes
 * Depends on: state.js, utils.js, auth.js
 */
'use strict';

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



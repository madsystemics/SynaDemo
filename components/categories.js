/**
 * components/categories.js — Category select, settings list
 * Depends on: state.js, config.js
 */
'use strict';

function populateCatSelect() {
  const sel = document.getElementById('f-cat');
  if (!sel) return;
  sel.innerHTML = state.cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

function renderCatsSettings() {
  const el = document.getElementById('cats-settings-list');
  if (!el) return;
  el.innerHTML = state.cats.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">${c.icon}</span>
        <span style="font-size:13px">${c.name}</span>
      </div>
      ${!['moradia','alimentacao','transporte','lazer','saude','investimentos'].includes(c.id)?`
      <button class="tx-del-btn" onclick="deleteCat('${c.id}')">✕</button>`:
      '<span style="font-size:11px;color:var(--text3)">padrão</span>'}
    </div>
  `).join('');
}

function openCatModal() { openModal('modal-cat'); }
function saveCat() {
  const nome = document.getElementById('cat-nome').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📦';
  if (!nome) return;
  const id = nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + Date.now();
  state.cats.push({id, name:nome, icon});
  saveState(); populateCatSelect(); renderCatsSettings();
  closeModal('modal-cat');
  document.getElementById('cat-nome').value = '';
  document.getElementById('cat-icon').value = '';
  showToast('Categoria adicionada!');
}

function deleteCat(id) {
  state.cats = state.cats.filter(c => c.id !== id);
  saveState(); populateCatSelect(); renderCatsSettings();
}

// ══════════════════════════════════════════════════
//  TRANSACTIONS
// ══════════════════════════════════════════════════


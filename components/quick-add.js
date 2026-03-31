/**
 * components/quick-add.js — Quick add numpad strip on dashboard
 * Depends on: state.js, utils/format.js
 */
'use strict';

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


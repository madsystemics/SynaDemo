/**
 * components/transactions.js — Transaction CRUD + table render
 * Depends on: state.js, utils/format.js
 */
'use strict';

function selectPerson(p) {
  selectedPerson = p;
  document.getElementById('tb-p1').className = 'toggle-btn' + (p===1?' on-p1':'');
  document.getElementById('tb-p2').className = 'toggle-btn' + (p===2?' on-p2':'');
}

function selectType(t) {
  selectedType = t;
  document.getElementById('tb-gasto').className = 'toggle-btn' + (t==='gasto'?' on-gasto':'');
  document.getElementById('tb-receita').className = 'toggle-btn' + (t==='receita'?' on-receita':'');
}

function saveTx() {
  const desc = document.getElementById('f-desc').value.trim();
  const valor = parseFloat(document.getElementById('f-valor').value);
  const data = document.getElementById('f-data').value;
  const cat = document.getElementById('f-cat').value;
  const notas = document.getElementById('f-notas').value.trim();
  const recorrente = document.getElementById('f-recorrente').value;
  if (!desc || !valor || !data) { showToast('⚠️ Preencha descrição, valor e data'); return; }

  if (editingId) {
    const idx = state.transactions.findIndex(t => t.id === editingId);
    if (idx >= 0) state.transactions[idx] = {...state.transactions[idx], desc, valor, data, cat, notas, recorrente, person:selectedPerson, type:selectedType};
    editingId = null;
    document.getElementById('btn-salvar').textContent = '+ Adicionar lançamento';
    document.getElementById('btn-cancelar').style.display = 'none';
    showToast('✅ Lançamento atualizado');
  } else {
    state.transactions.push({id:Date.now(), person:selectedPerson, type:selectedType, desc, valor, data, cat, notas, recorrente});
    showToast('✅ Lançamento adicionado');
  }

  saveState();
  document.getElementById('f-desc').value = '';
  document.getElementById('f-valor').value = '';
  document.getElementById('f-notas').value = '';
  document.getElementById('f-recorrente').value = '';
  renderAll();
}

function cancelEdit() {
  editingId = null;
  document.getElementById('f-desc').value = '';
  document.getElementById('f-valor').value = '';
  document.getElementById('btn-salvar').textContent = '+ Adicionar lançamento';
  document.getElementById('btn-cancelar').style.display = 'none';
}

function deleteTx(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState(); renderAll(); showToast('🗑 Removido');
}

function editTx(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  editingId = id;
  selectedPerson = tx.person; selectedType = tx.type;
  selectPerson(tx.person); selectType(tx.type);
  document.getElementById('f-desc').value = tx.desc;
  document.getElementById('f-valor').value = tx.valor;
  document.getElementById('f-data').value = tx.data;
  document.getElementById('f-cat').value = tx.cat;
  document.getElementById('f-notas').value = tx.notas || '';
  document.getElementById('f-recorrente').value = tx.recorrente || '';
  document.getElementById('btn-salvar').textContent = '💾 Salvar alterações';
  document.getElementById('btn-cancelar').style.display = 'block';
  document.getElementById('f-desc').focus();
  goPage('lancamentos');
}

let txFilterState = 'todos';
function setTxFilter(f, el) {
  txFilterState = f;
  document.querySelectorAll('.tx-toolbar .pill-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTxTable();
}



function renderTxTable() {
  const search = (document.getElementById('tx-search')?.value||'').toLowerCase();
  let txs = monthTx().sort((a,b) => new Date(b.data)-new Date(a.data));
  if (txFilterState === 'p1') txs = txs.filter(t=>t.person===1);
  else if (txFilterState === 'p2') txs = txs.filter(t=>t.person===2);
  else if (txFilterState === 'receita') txs = txs.filter(t=>t.type==='receita');
  else if (txFilterState === 'gasto') txs = txs.filter(t=>t.type==='gasto');
  if (search) txs = txs.filter(t => t.desc.toLowerCase().includes(search) || catById(t.cat).name.toLowerCase().includes(search));

  const body = document.getElementById('tx-body');
  const empty = document.getElementById('tx-empty');
  const countLabel = document.getElementById('tx-count-label');
  if (countLabel) countLabel.textContent = txs.length + ' registro' + (txs.length!==1?'s':'');

  if (!txs.length) { if(body) body.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';

  const color = t => t.person===1 ? state.p1Color : state.p2Color;
  const name = t => `${state.emojis[t.person-1]} ${state.names[t.person-1]}`;
  const d = t => new Date(t.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  const cat = t => { const c=catById(t.cat); return `${c.icon} ${c.name}`; };
  const sign = t => t.type==='gasto' ? '- ' : '+ ';

  if(body) body.innerHTML = txs.map(t => `
    <tr>
      <td><div style="width:8px;height:8px;border-radius:50%;background:${color(t)}"></div></td>
      <td>
        <div style="font-weight:500">${t.desc}</div>
        ${t.notas?`<div style="font-size:11px;color:var(--text3)">${t.notas}</div>`:''}
        ${t.recorrente?`<span class="badge badge-cat" style="font-size:10px">${t.recorrente}</span>`:''}
      </td>
      <td><span class="badge ${t.person===1?'badge-p1':'badge-p2'}">${name(t)}</span></td>
      <td><span class="badge badge-cat">${cat(t)}</span></td>
      <td style="color:var(--text2)">${d(t)}</td>
      <td class="tx-amount-cell ${t.type}">${sign(t)}${fmt(t.valor)}</td>
      <td>
        <button class="tx-edit-btn" onclick="editTx(${t.id})" title="Editar">✏️</button>
        <button class="tx-del-btn" onclick="deleteTx(${t.id})" title="Excluir">✕</button>
      </td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════


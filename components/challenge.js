/**
 * components/challenge.js — Couple challenge system
 * Depends on: state.js, utils/format.js
 */
'use strict';

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



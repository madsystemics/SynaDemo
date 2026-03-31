/**
 * components/dashboard.js — Dashboard cards, recent tx, cat bars
 * Depends on: state.js, utils/format.js
 */
'use strict';

function renderDashCards() {
  const txs = monthTx();
  const p1r = txs.filter(t=>t.person===1&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p1g = txs.filter(t=>t.person===1&&t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const p2r = txs.filter(t=>t.person===2&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p2g = txs.filter(t=>t.person===2&&t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const totalG = p1g+p2g, totalR = p1r+p2r, saldo = totalR-totalG;
  const p1s = p1r-p1g, p2s = p2r-p2g;

  const el = document.getElementById('dash-cards');
  if (!el) return;
  el.innerHTML = `
    <div class="card card-accent-p1">
      <div class="card-title">${state.emojis[0]} ${state.names[0]}</div>
      <div class="card-value" style="color:var(--p1)">${fmtShort(p1s)}</div>
      <div class="card-sub">Receitas ${fmtShort(p1r)} · Gastos ${fmtShort(p1g)}</div>
    </div>
    <div class="card card-accent-p2">
      <div class="card-title">${state.emojis[1]} ${state.names[1]}</div>
      <div class="card-value" style="color:var(--p2)">${fmtShort(p2s)}</div>
      <div class="card-sub">Receitas ${fmtShort(p2r)} · Gastos ${fmtShort(p2g)}</div>
    </div>
    <div class="card card-accent-green">
      <div class="card-title">Total de receitas</div>
      <div class="card-value" style="color:var(--green)">${fmtShort(totalR)}</div>
      <div class="card-sub">Mês de ${MONTHS[currentMonth]}</div>
    </div>
    <div class="card ${saldo<0?'card-accent-red':'card-accent-green'}">
      <div class="card-title">Saldo conjunto</div>
      <div class="card-value" style="color:${saldo<0?'var(--red)':'var(--green)'}">
        ${saldo<0?'- ':''}${fmtShort(saldo)}
      </div>
      <div class="card-sub">${saldo>=0?'✓ Positivo este mês':'⚠ Atenção: negativo'}</div>
    </div>
  `;
}

function renderDashRecent() {
  const body = document.getElementById('dash-recent-body');
  if (!body) return;
  const txs = monthTx().sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,6);
  if (!txs.length) { body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">Sem lançamentos</td></tr>`; return; }
  const color = t => t.person===1?state.p1Color:state.p2Color;
  const d = t => new Date(t.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  body.innerHTML = txs.map(t=>`
    <tr>
      <td><div style="width:6px;height:6px;border-radius:50%;background:${color(t)}"></div></td>
      <td style="font-size:13px">${t.desc}</td>
      <td><span class="badge badge-cat">${catById(t.cat).icon} ${catById(t.cat).name}</span></td>
      <td style="color:var(--text2);font-size:12px">${d(t)}</td>
      <td class="tx-amount-cell ${t.type}" style="font-size:13px">${t.type==='gasto'?'- ':'+ '}${fmt(t.valor)}</td>
    </tr>
  `).join('');
}

function renderDashCats() {
  const el = document.getElementById('dash-cats');
  if (!el) return;
  const txs = monthTx().filter(t=>t.type==='gasto');
  const cats = {};
  txs.forEach(t => cats[t.cat] = (cats[t.cat]||0)+t.valor);
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max = Math.max(...sorted.map(e=>e[1]),1);
  if (!sorted.length) { el.innerHTML = '<div style="color:var(--text3);font-size:13px">Nenhum gasto lançado.</div>'; return; }
  el.innerHTML = sorted.map(([id,val])=>{
    const c = catById(id);
    const pct = Math.round(val/max*100);
    return `
      <div class="budget-row" style="padding:8px 0">
        <div class="budget-icon">${c.icon}</div>
        <div class="budget-info">
          <div class="budget-name">${c.name}</div>
          <div style="margin-top:4px"><div class="progress-wrap"><div class="progress-fill" style="width:${pct}%;background:var(--p1)"></div></div></div>
        </div>
        <div class="budget-amount" style="color:var(--text2)">${fmtShort(val)}</div>
      </div>
    `;
  }).join('');
}

// ══════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════


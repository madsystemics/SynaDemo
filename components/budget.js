/**
 * components/budget.js — Budget limits, progress bars, chart
 * Depends on: state.js, utils/format.js
 */
'use strict';

function renderBudgetList() {
  const el = document.getElementById('budget-list');
  if (!el) return;
  const txs = monthTx().filter(t=>t.type==='gasto');
  const spent = {};
  txs.forEach(t=>spent[t.cat]=(spent[t.cat]||0)+t.valor);
  let ok=0, over=0;
  const rows = state.cats.map(c=>{
    const s = spent[c.id]||0;
    const b = state.budgets[c.id]||0;
    const pct = b>0 ? Math.min(s/b*100,100) : 0;
    const isOver = b>0 && s>b;
    if (b>0) isOver?over++:ok++;
    const color = isOver?'var(--red)':pct>80?'var(--amber)':'var(--green)';
    return `
      <div class="budget-row">
        <div class="budget-icon">${c.icon}</div>
        <div class="budget-info" style="flex:1">
          <div style="display:flex;justify-content:space-between">
            <div class="budget-name">${c.name}</div>
            <div class="budget-amount" style="color:${isOver?'var(--red)':'var(--text)'}">${fmtShort(s)}${b>0?' / '+fmtShort(b):''}</div>
          </div>
          ${b>0?`<div style="margin-top:6px"><div class="progress-wrap"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div></div>
          <div style="font-size:11px;color:${color};margin-top:3px">${isOver?'⚠ Limite ultrapassado':pct>0?Math.round(pct)+'% usado':''}</div>`:'<div style="font-size:11px;color:var(--text3);margin-top:2px">Sem limite definido</div>'}
        </div>
      </div>
    `;
  }).join('');
  el.innerHTML = rows;
  const okEl=document.getElementById('bud-ok'); if(okEl) okEl.textContent=ok;
  const ovEl=document.getElementById('bud-over'); if(ovEl) ovEl.textContent=over;
}

function renderChartBudget() {
  destroyChart('budget');
  const ctx = document.getElementById('chart-budget');
  if (!ctx) return;
  const txs = monthTx().filter(t=>t.type==='gasto');
  const spent = {};
  txs.forEach(t=>spent[t.cat]=(spent[t.cat]||0)+t.valor);
  const cats = state.cats.filter(c=>state.budgets[c.id]>0||spent[c.id]>0).slice(0,8);
  const d = chartDefaults();
  charts.budget = new Chart(ctx,{
    type:'bar',
    data:{
      labels:cats.map(c=>c.icon+' '+c.name),
      datasets:[
        {label:'Gasto',data:cats.map(c=>spent[c.id]||0),backgroundColor:`rgba(${hexToRgb(state.p1Color)},0.8)`,borderRadius:4},
        {label:'Limite',data:cats.map(c=>state.budgets[c.id]||0),backgroundColor:`rgba(${hexToRgb(state.p2Color)},0.3)`,borderRadius:4},
      ]
    },
    options:{plugins:{legend:{labels:{color:d.color,font:{family:'Sora',size:11}}}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora',size:10}}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}}},responsive:true,maintainAspectRatio:false}
  });
}

function openBudgetModal() {
  const el = document.getElementById('budget-form-list');
  el.innerHTML = state.cats.map(c=>`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <span style="font-size:18px;width:28px">${c.icon}</span>
      <span style="flex:1;font-size:13px">${c.name}</span>
      <input class="form-control" style="width:130px" type="number" placeholder="R$ limite" value="${state.budgets[c.id]||''}" data-cat="${c.id}">
    </div>
  `).join('');
  openModal('modal-budget');
}

function saveBudgets() {
  document.querySelectorAll('#budget-form-list input[data-cat]').forEach(inp=>{
    const v = parseFloat(inp.value);
    if (v>0) state.budgets[inp.dataset.cat]=v;
    else delete state.budgets[inp.dataset.cat];
  });
  saveState(); closeModal('modal-budget'); renderAll(); showToast('✅ Limites salvos');
}

// ══════════════════════════════════════════════════
//  METAS
// ══════════════════════════════════════════════════


/**
 * components/report.js — Monthly financial report builder
 * Depends on: state.js, utils/format.js
 */
'use strict';

function buildReport(month, year) {
  const fmt = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtShortR = n => Math.abs(n)>=1000?'R$ '+(Math.abs(n)/1000).toFixed(1).replace('.',',')+'k':fmt(n);

  const txs = state.transactions.filter(t => {
    const d = new Date(t.data+'T12:00');
    return d.getMonth()===month && d.getFullYear()===year;
  });

  const tR  = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const tG  = txs.filter(t=>t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
  const bal = tR - tG;
  const savRate = tR > 0 ? ((tR-tG)/tR*100) : 0;

  const p1R = txs.filter(t=>t.person===1&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p1G = txs.filter(t=>t.person===1&&t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
  const p2R = txs.filter(t=>t.person===2&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p2G = txs.filter(t=>t.person===2&&t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);

  const catSpent = {};
  txs.filter(t=>t.type==='gasto').forEach(t=>{ catSpent[t.cat]=(catSpent[t.cat]||0)+t.valor; });
  const topCat = Object.entries(catSpent).sort((a,b)=>b[1]-a[1])[0];

  const recur = {};
  state.transactions.forEach(t=>{ const k=(t.desc||'').toLowerCase().trim(); recur[k]=(recur[k]||0)+1; });
  const recCount = Object.values(recur).filter(v=>v>=2).length;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const prevTxs   = state.transactions.filter(t=>{ const d=new Date(t.data+'T12:00'); return d.getMonth()===prevMonth&&d.getFullYear()===prevYear; });
  const prevG     = prevTxs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const gDelta    = prevG > 0 ? ((tG - prevG) / prevG * 100) : null;

  let insight = '';
  if (savRate > 30)      insight = `<strong>Excelente!</strong> Vocês pouparam ${savRate.toFixed(0)}% da renda — acima da meta recomendada de 20%.`;
  else if (savRate > 10) insight = `<strong>Bom controle.</strong> Taxa de poupança de ${savRate.toFixed(0)}%. Tente chegar a 20% no próximo mês.`;
  else if (tR === 0)     insight = `Nenhuma receita registrada. Lembre-se de lançar salários e entradas.`;
  else                   insight = `<strong>Atenção:</strong> Apenas ${savRate.toFixed(0)}% da renda foi poupada. Revise os gastos em ${topCat?topCat[0]:'lazer'}.`;

  if (gDelta !== null) {
    insight += gDelta > 10
      ? ` Os gastos subiram <strong>${gDelta.toFixed(0)}%</strong> em relação ao mês anterior.`
      : gDelta < -10
      ? ` Os gastos caíram <strong>${Math.abs(gDelta).toFixed(0)}%</strong> — ótima evolução!`
      : '';
  }

  return `
    <div class="report-section">
      <div class="report-kpi-grid">
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--green)">${fmtShortR(tR)}</div>
          <div class="report-kpi-lbl">Receitas</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--red)">${fmtShortR(tG)}</div>
          <div class="report-kpi-lbl">Gastos</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:${bal>=0?'var(--green)':'var(--red)'}">${fmtShortR(bal)}</div>
          <div class="report-kpi-lbl">Saldo</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-val" style="color:var(--p1)">${savRate.toFixed(0)}%</div>
          <div class="report-kpi-lbl">Poupança</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <div class="report-title">Por parceiro</div>
      <div class="report-row">
        <span class="report-row-lbl">${state.emojis[0]} ${state.names[0]}</span>
        <span class="report-row-val" style="color:var(--p1)">${fmt(p1R-p1G)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↑ Receitas</span>
        <span style="font-size:12px;color:var(--green)">${fmt(p1R)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↓ Gastos</span>
        <span style="font-size:12px;color:var(--red)">${fmt(p1G)}</span>
      </div>
      <div class="report-row" style="margin-top:6px">
        <span class="report-row-lbl">${state.emojis[1]} ${state.names[1]}</span>
        <span class="report-row-val" style="color:var(--p2)">${fmt(p2R-p2G)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↑ Receitas</span>
        <span style="font-size:12px;color:var(--green)">${fmt(p2R)}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl" style="padding-left:16px;font-size:12px">↓ Gastos</span>
        <span style="font-size:12px;color:var(--red)">${fmt(p2G)}</span>
      </div>
    </div>

    ${Object.keys(catSpent).length ? `
    <div class="report-section">
      <div class="report-title">Gastos por categoria</div>
      ${Object.entries(catSpent).sort((a,b)=>b[1]-a[1]).map(([id,v]) => {
        const c = state.cats.find(x=>x.id===id)||{icon:'📦',name:id};
        const pct = tG>0?v/tG*100:0;
        return `
          <div class="report-row">
            <span class="report-row-lbl">${c.icon} ${c.name}</span>
            <span class="report-row-val">${fmt(v)} <span style="font-size:11px;color:var(--text3)">${pct.toFixed(0)}%</span></span>
          </div>
        `;
      }).join('')}
    </div>` : ''}

    <div class="report-section">
      <div class="report-title">Extras</div>
      <div class="report-row">
        <span class="report-row-lbl">Total de lançamentos</span>
        <span class="report-row-val">${txs.length}</span>
      </div>
      <div class="report-row">
        <span class="report-row-lbl">Transações recorrentes detectadas</span>
        <span class="report-row-val">${recCount}</span>
      </div>
      ${gDelta!==null?`<div class="report-row">
        <span class="report-row-lbl">Variação de gastos (mês ant.)</span>
        <span class="report-row-val" style="color:${gDelta>0?'var(--red)':'var(--green)'}">${gDelta>0?'+':''}${gDelta.toFixed(0)}%</span>
      </div>`:''}
    </div>

    <div class="report-insight">${insight}</div>
  `;
}

function openReport() {
  const el    = document.getElementById('report-modal-body');
  const title = document.getElementById('report-modal-title');
  if (el)    el.innerHTML = buildReport(currentMonth, currentYear);
  if (title) title.textContent = 'Relatório de ' + MONTHS_FULL[currentMonth] + ' ' + currentYear;
  openModal('modal-report');
}

// ══════════════════════════════════════════════════════════════
//  REAL-TIME SYNC  (localStorage + StorageEvent)
// ══════════════════════════════════════════════════════════════
let _syncOnline = true;
let _syncWatchInterval = null;



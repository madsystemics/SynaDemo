/**
 * components/goals.js — Goals (metas): CRUD + render + chart
 * Depends on: state.js, utils/format.js
 */
'use strict';

function renderMetas() {
  const el = document.getElementById('metas-list');
  if (!el) return;
  if (!state.metas.length) {
    el.innerHTML=`<div class="empty"><div class="empty-icon">🎯</div>Nenhuma meta criada.<br>Adicione sua primeira meta!</div>`;
    return;
  }
  el.innerHTML = state.metas.map(m=>{
    const pct = Math.min(m.atual/m.alvo*100,100);
    const prazo = m.prazo ? new Date(m.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—';
    const color = pct>=100?'var(--green)':pct>60?'var(--p1)':'var(--p2)';
    return `
      <div class="meta-card">
        <div class="meta-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${m.icon||'🎯'}</span>
            <div>
              <div class="meta-name">${m.nome}</div>
              <div style="font-size:11px;color:var(--text3)">Prazo: ${prazo}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div class="meta-pct" style="color:${color}">${Math.round(pct)}%</div>
            <button class="tx-del-btn" onclick="deleteMeta('${m.id}')">✕</button>
          </div>
        </div>
        <div class="progress-wrap" style="height:8px;margin-bottom:8px"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2)">
          <span>Guardado: <strong style="color:var(--text)">${fmt(m.atual)}</strong></span>
          <span>Meta: <strong style="color:var(--text)">${fmt(m.alvo)}</strong></span>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <input style="flex:1" class="form-control" type="number" placeholder="Adicionar valor..." id="meta-add-${m.id}">
          <button class="btn-secondary" style="width:auto;padding:8px 14px;margin:0" onclick="addToMeta('${m.id}')">+ Adicionar</button>
        </div>
      </div>
    `;
  }).join('');
  updateDica();
}

function renderChartMetas() {
  destroyChart('metas');
  const ctx = document.getElementById('chart-metas');
  if (!ctx || !state.metas.length) return;
  const d = chartDefaults();
  const palette=['#e8c97a','#7ab8e8','#5cb88a','#e05555','#e0a040'];
  charts.metas = new Chart(ctx,{
    type:'bar',
    data:{
      labels:state.metas.map(m=>m.icon+' '+m.nome),
      datasets:[
        {label:'Guardado',data:state.metas.map(m=>m.atual),backgroundColor:state.metas.map((_,i)=>`rgba(${hexToRgb(palette[i%palette.length])},0.85)`),borderRadius:6},
        {label:'Meta',data:state.metas.map(m=>m.alvo),backgroundColor:state.metas.map((_,i)=>`rgba(${hexToRgb(palette[i%palette.length])},0.2)`),borderRadius:6},
      ]
    },
    options:{plugins:{legend:{labels:{color:d.color,font:{family:'Sora',size:11}}}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora',size:10}}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}}},responsive:true,maintainAspectRatio:false}
  });
}

function openMetaModal() { openModal('modal-meta'); }
function saveMeta() {
  const nome = document.getElementById('meta-nome').value.trim();
  const alvo = parseFloat(document.getElementById('meta-alvo').value);
  const atual = parseFloat(document.getElementById('meta-atual').value)||0;
  const prazo = document.getElementById('meta-prazo').value;
  const icon = document.getElementById('meta-icon').value.trim()||'🎯';
  if (!nome||!alvo) { showToast('⚠️ Preencha nome e valor alvo'); return; }
  state.metas.push({id:'m'+Date.now(), nome, alvo, atual, prazo, icon});
  saveState(); closeModal('modal-meta'); renderAll(); showToast('🏆 Meta criada!');
  ['meta-nome','meta-alvo','meta-atual','meta-prazo','meta-icon'].forEach(id=>document.getElementById(id).value='');
}

function deleteMeta(id) {
  state.metas = state.metas.filter(m=>m.id!==id);
  saveState(); renderAll(); showToast('🗑 Meta removida');
}

function addToMeta(id) {
  const inp = document.getElementById('meta-add-'+id);
  const v = parseFloat(inp?.value);
  if (!v||v<=0) return;
  const m = state.metas.find(m=>m.id===id);
  if (m) { m.atual=Math.min(m.atual+v,m.alvo); saveState(); renderAll(); showToast('💰 Valor adicionado!'); }
}

function updateDica() {
  const el = document.getElementById('dica-texto');
  if (!el) return;
  const txs = monthTx();
  const totalG = txs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const totalR = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const taxa = totalR>0?(totalG/totalR*100):0;
  let dica = '';
  if (!txs.length) dica = 'Comece lançando suas receitas e gastos para receber dicas personalizadas! 🚀';
  else if (taxa>90) dica = `Atenção! Vocês gastaram ${Math.round(taxa)}% da renda este mês. Tente reduzir gastos em lazer e moradia para ampliar a margem de poupança.`;
  else if (taxa>70) dica = `Vocês usaram ${Math.round(taxa)}% da renda. Está razoável, mas há espaço para guardar mais. Experimente a regra 50-30-20: 50% para necessidades, 30% para desejos, 20% para poupança.`;
  else if (taxa<50) dica = `Excelente! Vocês estão gastando apenas ${Math.round(taxa)}% da renda. Aproveite para acelerar alguma meta do casal! 🎉`;
  else dica = `Vocês estão com um equilíbrio saudável. ${Math.round(100-taxa)}% da renda está livre — considere direcionar parte para metas e investimentos.`;
  el.textContent = dica;
}

// ══════════════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════════════


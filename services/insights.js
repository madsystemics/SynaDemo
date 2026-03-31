// ============================================================
//  INSIGHTS SERVICE  — spending analysis, health score, forecast
// ============================================================
import { fmt } from '../utils/format.js';

// ── Financial Health Score (0–100) ────────────────────────
export function calcHealthScore(txs, budgets, goals) {
  if (!txs.length) return { score: 0, grade: 'F', breakdown: [] };

  const gastos   = txs.filter(t => t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
  const receitas = txs.filter(t => t.type==='receita').reduce((a,t)=>a+t.valor,0);

  let score = 0;
  const breakdown = [];

  // 1. Savings rate (30pts)
  const rate = receitas > 0 ? (receitas - gastos) / receitas : 0;
  const pts1 = Math.min(30, Math.round(rate * 60));
  score += pts1;
  breakdown.push({ label:'Poupança', icon:'💰', pts:pts1, max:30,
    detail: rate >= 0 ? `Poupando ${(rate*100).toFixed(0)}% da renda` : 'Gastos acima da renda' });

  // 2. Budget adherence (25pts)
  const bKeys = Object.keys(budgets).filter(k=>budgets[k]>0);
  let pts2 = 25;
  if (bKeys.length) {
    const spent = {};
    txs.filter(t=>t.type==='gasto').forEach(t=>{ spent[t.cat]=(spent[t.cat]||0)+t.valor; });
    const over = bKeys.filter(k=>(spent[k]||0)>budgets[k]).length;
    pts2 = Math.round(25*(1-over/bKeys.length));
  }
  score += pts2;
  breakdown.push({ label:'Orçamento', icon:'🎯', pts:pts2, max:25,
    detail: bKeys.length ? `${bKeys.length} categorias monitoradas` : 'Configure limites' });

  // 3. Goals (20pts)
  const pts3 = goals.length
    ? Math.round(20 * goals.reduce((a,g)=>a+Math.min(g.atual/g.alvo,1),0)/goals.length)
    : 0;
  score += pts3;
  breakdown.push({ label:'Metas', icon:'🏆', pts:pts3, max:20,
    detail: goals.length ? `${goals.length} meta(s) ativa(s)` : 'Crie metas' });

  // 4. Diversity (15pts)
  const catT = {};
  txs.filter(t=>t.type==='gasto').forEach(t=>{ catT[t.cat]=(catT[t.cat]||0)+t.valor; });
  const totalG = Object.values(catT).reduce((a,b)=>a+b,0);
  const maxShare = totalG > 0 ? Math.max(...Object.values(catT))/totalG : 1;
  const pts4 = Math.round(15*(1-Math.max(0,maxShare-0.5)));
  score += pts4;
  breakdown.push({ label:'Diversificação', icon:'📊', pts:pts4, max:15,
    detail: `Categoria principal: ${(maxShare*100).toFixed(0)}%` });

  // 5. Consistency (10pts)
  const pts5 = Math.min(10, Math.round(txs.length/5));
  score += pts5;
  breakdown.push({ label:'Consistência', icon:'📅', pts:pts5, max:10,
    detail: `${txs.length} lançamentos` });

  const s = Math.min(100, score);
  const grade = s>=80?'A':s>=65?'B':s>=50?'C':s>=35?'D':'F';
  return { score: s, grade, breakdown };
}

// ── Pattern analysis ───────────────────────────────────────
export function analyzePatterns(allTxs, budgets) {
  const warnings = [];
  const insights = [];
  if (!allTxs.length) return { warnings, insights };

  // Group last 2 months
  const now = new Date();
  const byMonth = (m, y) => allTxs.filter(t=>{
    const d=new Date(t.data+'T12:00'); return d.getMonth()===m&&d.getFullYear()===y;
  });
  const thisM = now.getMonth(), thisY = now.getFullYear();
  const prevM = thisM===0?11:thisM-1, prevY = thisM===0?thisY-1:thisY;

  const cur  = byMonth(thisM, thisY);
  const prev = byMonth(prevM, prevY);

  const gCur  = cur.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const gPrev = prev.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const rCur  = cur.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);

  if (gPrev > 0 && gCur > gPrev * 1.2) {
    warnings.push({ level:'high', icon:'📈', title:'Gastos em alta',
      text:`Gastos subiram ${((gCur/gPrev-1)*100).toFixed(0)}% em relação ao mês anterior.` });
  } else if (gPrev > 0 && gCur < gPrev * 0.8) {
    insights.push({ type:'success', icon:'📉',
      text:`Gastos caíram ${((1-gCur/gPrev)*100).toFixed(0)}% — ótima evolução!` });
  }

  // Budget violations
  const spent = {};
  cur.filter(t=>t.type==='gasto').forEach(t=>{ spent[t.cat]=(spent[t.cat]||0)+t.valor; });
  Object.entries(budgets).forEach(([cat,lim])=>{
    if (lim>0 && (spent[cat]||0)>lim) {
      warnings.push({ level:'medium', icon:'⚠️', title:'Limite ultrapassado',
        text:`Categoria excedeu em ${fmt.currency((spent[cat]||0)-lim)}.` });
    }
  });

  // Savings rate insight
  if (rCur > 0) {
    const rate = rCur>0?(rCur-gCur)/rCur*100:0;
    if (rate < -5) {
      warnings.push({ level:'high', icon:'🚨', title:'Saldo negativo',
        text:`Gastos ${(-rate).toFixed(0)}% acima da renda este mês.` });
    } else if (rate > 30) {
      insights.push({ type:'success', icon:'🌟',
        text:`Poupando ${rate.toFixed(0)}% da renda. Excelente mês!` });
    }
  }

  // Recurring detection
  const desc = {};
  allTxs.forEach(t=>{ const k=t.desc?.toLowerCase()?.trim()||''; desc[k]=(desc[k]||0)+1; });
  const recCount = Object.values(desc).filter(v=>v>=2).length;
  if (recCount > 0) {
    insights.push({ type:'info', icon:'🔄',
      text:`${recCount} transação(ões) recorrente(s) detectada(s).` });
  }

  if (!warnings.length && !insights.length) {
    insights.push({ type:'success', icon:'✨', text:'Tudo certo! Nenhum alerta este mês.' });
  }

  return { warnings, insights };
}

// ── Balance forecast (3 months) ────────────────────────────
export function forecast(allTxs) {
  const now = new Date();
  const history = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const txs = allTxs.filter(t=>{
      const dt = new Date(t.data+'T12:00');
      return dt.getMonth()===m && dt.getFullYear()===y;
    });
    const r = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
    const g = txs.filter(t=>t.type==='gasto'  ).reduce((a,t)=>a+t.valor,0);
    history.push({ label: fmt.monthShort(m, y), net: r-g, r, g });
  }

  const nets  = history.map(h=>h.net);
  const avg   = nets.reduce((a,b)=>a+b,0)/nets.length;
  const trend = nets.length>=2 ? (nets.at(-1)-nets[0])/(nets.length-1) : 0;

  const projected = [];
  for (let i=1; i<=3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    projected.push({
      label: fmt.monthShort(d.getMonth(), d.getFullYear()),
      net:   Math.round((avg + trend*i) * 100) / 100,
    });
  }

  return { history, projected, avg, trend };
}

// ── Recurring transactions ─────────────────────────────────
export function detectRecurring(allTxs) {
  const groups = {};
  allTxs.forEach(t=>{
    const k = (t.desc||'').toLowerCase().trim();
    if (!groups[k]) groups[k]=[];
    groups[k].push(t);
  });
  return Object.entries(groups)
    .filter(([,txs])=>txs.length>=2)
    .map(([,txs])=>{
      const avg = txs.reduce((a,t)=>a+t.valor,0)/txs.length;
      const sorted = [...txs].sort((a,b)=>new Date(a.data)-new Date(b.data));
      const diffs = sorted.slice(1).map((t,i)=>
        (new Date(t.data)-new Date(sorted[i].data))/86400000
      );
      const avgDiff = diffs.reduce((a,b)=>a+b,0)/diffs.length;
      return {
        desc: txs[0].desc,
        cat:  txs[0].cat,
        type: txs[0].type,
        avgValor: Math.round(avg*100)/100,
        pattern: avgDiff<=8?'semanal':avgDiff<=35?'mensal':'irregular',
        count:   txs.length,
        lastDate:sorted.at(-1).data,
      };
    })
    .sort((a,b)=>b.avgValor-a.avgValor);
}

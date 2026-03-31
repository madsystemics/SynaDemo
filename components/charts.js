/**
 * components/charts.js — All Chart.js renders (donut, line, bar, etc.)
 * Depends on: state.js, utils/format.js, Chart.js CDN
 */
'use strict';

function chartDefaults() {
  const isDark = state.theme !== 'light';
  return {
    color: isDark ? '#a8a89e' : '#5a5a52',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

function renderChartDonut() {
  destroyChart('donut');
  const ctx = document.getElementById('chart-donut');
  if (!ctx) return;
  const txs = monthTx().filter(t=>t.type==='gasto');
  const cats = {};
  txs.forEach(t => cats[t.cat]=(cats[t.cat]||0)+t.valor);
  const labels = Object.keys(cats).map(id=>catById(id).name);
  const data = Object.values(cats);
  if (!data.length) return;
  const palette = ['#e8c97a','#7ab8e8','#5cb88a','#e05555','#e0a040','#a880e0','#e87070','#50c8c0','#90b060'];
  charts.donut = new Chart(ctx, {
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:palette.slice(0,data.length),borderWidth:0,hoverOffset:4}]},
    options:{plugins:{legend:{position:'bottom',labels:{color:chartDefaults().color,font:{family:'Sora',size:11},padding:12,boxWidth:12,boxHeight:12}}},cutout:'68%',responsive:true,maintainAspectRatio:false}
  });
}

function renderChartBarDash() {
  destroyChart('barDash');
  const ctx = document.getElementById('chart-bar-dash');
  if (!ctx) return;
  const txs = monthTx();
  const p1r=txs.filter(t=>t.person===1&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p1g=txs.filter(t=>t.person===1&&t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const p2r=txs.filter(t=>t.person===2&&t.type==='receita').reduce((a,t)=>a+t.valor,0);
  const p2g=txs.filter(t=>t.person===2&&t.type==='gasto').reduce((a,t)=>a+t.valor,0);
  const d = chartDefaults();
  charts.barDash = new Chart(ctx,{
    type:'bar',
    data:{
      labels:[state.names[0],state.names[1]],
      datasets:[
        {label:'Receitas',data:[p1r,p2r],backgroundColor:[`rgba(${hexToRgb(state.p1Color)},0.4)`,`rgba(${hexToRgb(state.p2Color)},0.4)`],borderRadius:6},
        {label:'Gastos',data:[p1g,p2g],backgroundColor:[`rgba(${hexToRgb(state.p1Color)},0.8)`,`rgba(${hexToRgb(state.p2Color)},0.8)`],borderRadius:6},
      ]
    },
    options:{plugins:{legend:{labels:{color:d.color,font:{family:'Sora',size:11}}}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'}}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}}},responsive:true,maintainAspectRatio:false}
  });
}

function renderChartEvolucao() {
  destroyChart('evolucao');
  const ctx = document.getElementById('chart-evolucao');
  if (!ctx) return;
  const d = chartDefaults();
  const labels = MONTHS.slice(0,12);
  const receitas = [], gastos = [];
  for (let m=0;m<12;m++) {
    const txs = state.transactions.filter(t=>{const dt=new Date(t.data+'T12:00:00'); return dt.getMonth()===m&&dt.getFullYear()===currentYear;});
    receitas.push(txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0));
    gastos.push(txs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0));
  }
  charts.evolucao = new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[
      {label:'Receitas',data:receitas,borderColor:state.p1Color,backgroundColor:`rgba(${hexToRgb(state.p1Color)},0.1)`,tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:state.p1Color},
      {label:'Gastos',data:gastos,borderColor:state.p2Color,backgroundColor:`rgba(${hexToRgb(state.p2Color)},0.1)`,tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:state.p2Color},
    ]},
    options:{plugins:{legend:{labels:{color:d.color,font:{family:'Sora',size:11}}}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora',size:10},maxRotation:45}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}}},responsive:true,maintainAspectRatio:false}
  });
}

function renderChartCats() {
  destroyChart('cats');
  const ctx = document.getElementById('chart-cats');
  if (!ctx) return;
  const txs = monthTx().filter(t=>t.type==='gasto');
  const cats = {};
  txs.forEach(t=>cats[t.cat]=(cats[t.cat]||0)+t.valor);
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const d = chartDefaults();
  const palette=['#e8c97a','#7ab8e8','#5cb88a','#e05555','#e0a040','#a880e0','#e87070','#50c8c0'];
  charts.cats = new Chart(ctx,{
    type:'bar',
    data:{
      labels:sorted.map(([id])=>catById(id).icon+' '+catById(id).name),
      datasets:[{data:sorted.map(e=>e[1]),backgroundColor:sorted.map((_,i)=>palette[i%palette.length]),borderRadius:6,borderWidth:0}]
    },
    options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora',size:11}}}},responsive:true,maintainAspectRatio:false}
  });
}

function renderChartPerson(p) {
  const key = 'cp'+p;
  destroyChart(key);
  const ctx = document.getElementById('chart-p'+p);
  if (!ctx) return;
  const txs = monthTx().filter(t=>t.person===p&&t.type==='gasto');
  const cats={};
  txs.forEach(t=>cats[t.cat]=(cats[t.cat]||0)+t.valor);
  const labels=Object.keys(cats).map(id=>catById(id).icon+' '+catById(id).name);
  const data=Object.values(cats);
  const d = chartDefaults();
  const palette=['#e8c97a','#7ab8e8','#5cb88a','#e05555','#e0a040','#a880e0','#e87070','#50c8c0'];
  charts[key] = new Chart(ctx,{
    type:'pie',
    data:{labels,datasets:[{data,backgroundColor:palette.slice(0,data.length),borderWidth:0}]},
    options:{plugins:{legend:{position:'right',labels:{color:d.color,font:{family:'Sora',size:10},padding:8,boxWidth:10,boxHeight:10}}},responsive:true,maintainAspectRatio:false}
  });
}

function renderChartAcumulado() {
  destroyChart('acumulado');
  const ctx = document.getElementById('chart-acumulado');
  if (!ctx) return;
  const d = chartDefaults();
  let acc = 0;
  const data = MONTHS.map((_,m)=>{
    const txs = state.transactions.filter(t=>{const dt=new Date(t.data+'T12:00:00'); return dt.getMonth()===m&&dt.getFullYear()===currentYear;});
    const r = txs.filter(t=>t.type==='receita').reduce((a,t)=>a+t.valor,0);
    const g = txs.filter(t=>t.type==='gasto').reduce((a,t)=>a+t.valor,0);
    acc += r-g; return acc;
  });
  charts.acumulado = new Chart(ctx,{
    type:'line',
    data:{labels:MONTHS,datasets:[{label:'Saldo acumulado',data,borderColor:state.p1Color,backgroundColor:`rgba(${hexToRgb(state.p1Color)},0.08)`,tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:data.map(v=>v>=0?state.p1Color:state.p2Color)}]},
    options:{plugins:{legend:{display:false}},scales:{x:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora',size:10},maxRotation:45}},y:{grid:{color:d.grid},ticks:{color:d.color,font:{family:'Sora'},callback:v=>fmtShort(v)}}},responsive:true,maintainAspectRatio:false}
  });
}

// ══════════════════════════════════════════════════
//  BUDGET
// ══════════════════════════════════════════════════


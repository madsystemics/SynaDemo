/**
 * utils/format.js — Formatting helpers + data accessors
 * Depends on: state.js, config.js
 */
'use strict';

function fmt(n) {
  return 'R$ ' + Number(Math.abs(n)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function fmtShort(n) {
  if (Math.abs(n) >= 1000) return 'R$ ' + (Math.abs(n)/1000).toFixed(1).replace('.',',') + 'k';
  return fmt(n);
}
function monthTx() {
  return state.transactions.filter(t => {
    const d = new Date(t.data + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
}
function yearTx() {
  return state.transactions.filter(t => new Date(t.data + 'T12:00:00').getFullYear() === currentYear);
}
function catById(id) { return state.cats.find(c => c.id === id) || {name:id,icon:'📦'}; }
function showToast(msg, type='', dur=2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => { t.classList.remove('show'); }, dur);
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ══════════════════════════════════════════════════
//  COLORS & THEME
// ══════════════════════════════════════════════════


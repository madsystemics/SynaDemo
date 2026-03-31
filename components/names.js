/**
 * components/names.js — Partner names, emojis, sync to DOM
 * Depends on: state.js, config.js
 */
'use strict';

function syncNames() {
  const n1 = state.names[0], n2 = state.names[1];
  const e1 = state.emojis[0], e2 = state.emojis[1];
  ['chip-name1','cfg-n1-label','cfg-color1-label'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=n1; });
  ['chip-name2','cfg-n2-label','cfg-color2-label'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=n2; });
  ['tb-p1','filter-p1-btn'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=`${e1} ${n1}`; });
  ['tb-p2','filter-p2-btn'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=`${e2} ${n2}`; });
  const i1=document.getElementById('cfg-name1'); if(i1) i1.value=n1;
  const i2=document.getElementById('cfg-name2'); if(i2) i2.value=n2;
  const eb1=document.getElementById('emoji1-btn'); if(eb1) eb1.textContent=e1;
  const eb2=document.getElementById('emoji2-btn'); if(eb2) eb2.textContent=e2;
  const tf1=document.getElementById('tf-p1'); if(tf1) tf1.textContent=`${e1} ${n1}`;
  const tf2=document.getElementById('tf-p2'); if(tf2) tf2.textContent=`${e2} ${n2}`;
  const gt1=document.getElementById('g-name1-title'); if(gt1) gt1.textContent=n1;
  const gt2=document.getElementById('g-name2-title'); if(gt2) gt2.textContent=n2;
  document.getElementById('month-label').textContent = MONTHS[currentMonth] + ' ' + currentYear;
  document.getElementById('dash-period').textContent = MONTHS[currentMonth] + ' ' + currentYear;
  // Keep avatar name labels in settings in sync
  const lbl1 = document.getElementById('av1-name-lbl'); if(lbl1) lbl1.textContent = n1;
  const lbl2 = document.getElementById('av2-name-lbl'); if(lbl2) lbl2.textContent = n2;
  // Keep color section labels in sync
  const cl1 = document.getElementById('cfg-color1-label'); if(cl1) cl1.textContent = n1;
  const cl2 = document.getElementById('cfg-color2-label'); if(cl2) cl2.textContent = n2;
  // Refresh topbar chips with updated emoji
  syncAvatarsInTopbar();
}

function updateConfig() {
  const n1 = document.getElementById('cfg-name1').value.trim() || 'Pessoa 1';
  const n2 = document.getElementById('cfg-name2').value.trim() || 'Pessoa 2';
  state.names[0] = n1; state.names[1] = n2;
  saveState(); syncNames();
  const cn1=document.getElementById('cfg-n1-label'); if(cn1) cn1.textContent=n1;
  const cn2=document.getElementById('cfg-n2-label'); if(cn2) cn2.textContent=n2;
}

function populateEmojiPickers() {
  [1,2].forEach(p => {
    const el = document.getElementById(`emoji-picker-${p}`);
    if (!el) return;
    el.innerHTML = EMOJIS.map(e => `<div class="emoji-opt" onclick="selectEmoji(${p},'${e}')">${e}</div>`).join('');
  });
}

function toggleEmojiPicker(p) {
  const el = document.getElementById(`emoji-picker-${p}`);
  el.classList.toggle('open');
}

function selectEmoji(p, e) {
  state.emojis[p-1] = e;
  saveState(); syncNames();
  document.getElementById(`emoji-picker-${p}`).classList.remove('open');
}

// ══════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════


/**
 * store/state.js — App state + localStorage persistence
 * Depends on: auth.js (Auth.currentUser)
 */
'use strict';

let state = {
  names: ['Pessoa 1','Pessoa 2'],
  emojis: ['💛','💙'],
  p1Color: '#e8c97a',
  p2Color: '#7ab8e8',
  theme: 'dark',
  avatar1: null,
  avatar2: null,
  bgUrl: null,
  bgBlur: 4,
  bgOpacity: 0.35,
  bgBrightness: 0.6,
  bgContrast: 1.0,
  cats: [
    {id:'moradia', name:'Moradia', icon:'🏠'},
    {id:'alimentacao', name:'Alimentação', icon:'🍽️'},
    {id:'transporte', name:'Transporte', icon:'🚗'},
    {id:'lazer', name:'Lazer', icon:'🎉'},
    {id:'saude', name:'Saúde', icon:'❤️'},
    {id:'investimentos', name:'Investimentos', icon:'📈'},
    {id:'educacao', name:'Educação', icon:'📚'},
    {id:'vestuario', name:'Vestuário', icon:'👗'},
    {id:'outros', name:'Outros', icon:'📦'},
  ],
  budgets: {},
  metas: [],
  transactions: [],
  font: 'sora',
  fontDisplay: 'serif',
  textColor: '#f0efe8',
  challenge: null,
  lastReportMonth: -1,
};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentPage = 'dashboard';
let txFilter = 'todos';
let editingId = null;
let selectedPerson = 1;
let selectedType = 'gasto';

const charts = {};

// ══════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════


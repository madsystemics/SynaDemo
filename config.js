/**
 * config.js — App constants: themes, colors, fonts, categories
 * No dependencies. Loaded first.
 */
'use strict';

const THEMES = [
  { id:'dark',          label:'🌑 Escuro',        bg:'#0c0c0f', surface:'#1a1a20', a:'#e8c97a', b:'#7ab8e8' },
  { id:'light',         label:'☀️ Claro',          bg:'#f4f3ef', surface:'#ffffff', a:'#e8a030', b:'#3080e0' },
  { id:'ocean',         label:'🌊 Ocean',          bg:'#080f1a', surface:'#122035', a:'#60c0ff', b:'#40e0c0' },
  { id:'forest',        label:'🌿 Floresta',       bg:'#080f0a', surface:'#122018', a:'#60d080', b:'#80c060' },
  { id:'rose',          label:'🌹 Rose',           bg:'#1a0d10', surface:'#341820', a:'#e880a0', b:'#c060c0' },
  { id:'cyberpunk',     label:'⚡ Cyberpunk',      bg:'#020408', surface:'#07101e', a:'#00ffb0', b:'#ff2d78' },
  { id:'kawaii',        label:'🌸 Kawaii',         bg:'#fff0f5', surface:'#ffffff', a:'#ff6eb4', b:'#c77dff' },
  { id:'latte',         label:'☕ Café',           bg:'#1a1008', surface:'#321e0e', a:'#d4944a', b:'#a87850' },
  { id:'aurora',        label:'🌌 Aurora',         bg:'#030810', surface:'#0a1424', a:'#50e0b0', b:'#b060f0' },
  { id:'synthwave',     label:'🎹 Synthwave',      bg:'#0d001a', surface:'#1e0030', a:'#ff6ec7', b:'#00e5ff' },
  { id:'mint',          label:'🫧 Mint',           bg:'#f0fff8', surface:'#ffffff', a:'#00b87a', b:'#0090e0' },
  { id:'midnight-gold', label:'✨ Midnight Gold',  bg:'#060400', surface:'#140e00', a:'#d4a800', b:'#e8c84a' },
  { id:'nord',          label:'🧊 Nord',           bg:'#1e2430', surface:'#2e3747', a:'#88c0d0', b:'#81a1c1' },
  { id:'sakura',        label:'🌸 Sakura',         bg:'#1a0810', surface:'#30141e', a:'#ff8fab', b:'#ffc8d8' },
  { id:'hacker',        label:'💻 Hacker',         bg:'#000000', surface:'#080f08', a:'#00ff41', b:'#00c8ff' },
  { id:'lavender',      label:'💜 Lavanda',        bg:'#f5f0ff', surface:'#ffffff', a:'#8060e0', b:'#e080c0' },
  { id:'dusk',          label:'🌇 Crepúsculo',     bg:'#0e0610', surface:'#200e26', a:'#ff7040', b:'#c060e0' },
  { id:'arctic',        label:'❄️ Gelo',           bg:'#f0f8ff', surface:'#ffffff', a:'#0080e0', b:'#00c0e8' },
  { id:'tokyo',         label:'🏙️ Neon Tokyo',     bg:'#0a0010', surface:'#180020', a:'#e040fb', b:'#40c4ff' },
  { id:'choco',         label:'🍫 Chocolate',      bg:'#0f0800', surface:'#241400', a:'#c87840', b:'#e8a860' },
];
function renderThemeGrid() {
  const el = document.getElementById('theme-grid');
  if (!el) return;
  el.innerHTML = THEMES.map(t => {
    const isActive = (state.theme || 'dark') === t.id;
    return `
      <div class="theme-card ${isActive ? 'active' : ''}" onclick="setTheme('${t.id}',this)" title="${t.label}">
        <div class="theme-preview" style="background:${t.bg}">
          <div class="theme-preview-bar" style="background:${t.surface};height:60%"></div>
          <div class="theme-preview-bar" style="background:${t.a};height:100%"></div>
          <div class="theme-preview-bar" style="background:${t.b};height:75%"></div>
          <div class="theme-preview-bar" style="background:${t.surface};height:45%"></div>
          <div class="theme-preview-bar" style="background:${t.a};opacity:.6;height:80%"></div>
        </div>
        <div class="theme-label">${t.label}</div>
      </div>
    `;
  }).join('');
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const P1_COLORS = [
  // Golds & Ambers
  '#e8c97a','#f5b942','#e89a30','#d4a017',
  // Oranges & Corals
  '#f0a060','#f07850','#e85540','#ff6b6b',
  // Pinks & Roses
  '#e8a0b8','#f472b6','#ec4899','#db2777',
  // Purples & Violets
  '#c07de8','#a855f7','#9333ea','#7c3aed',
  // Greens & Teals
  '#78c8a0','#34d399','#10b981','#059669',
  // Warm whites & creams
  '#f8f0e0','#e8e0d0','#d4c8b0','#c8b898',
];
const P2_COLORS = [
  // Blues
  '#7ab8e8','#60a5fa','#3b82f6','#2563eb',
  // Sky & Cyan
  '#6090e0','#38bdf8','#0ea5e9','#0284c7',
  // Teals
  '#50c8c0','#2dd4bf','#14b8a6','#0d9488',
  // Greens
  '#90b060','#86efac','#4ade80','#22c55e',
  // Indigos & Slates
  '#818cf8','#6366f1','#4f46e5','#4338ca',
  // Purples
  '#a880e0','#c084fc','#a855f7','#9333ea',
];
const EMOJIS = ['😊','😍','🥰','😎','🤩','🦋','🌸','🌺','⭐','💫','🔥','💎','🌙','☀️','🍀','🎯','🚀','🏆','💪','🎨'];

const FONTS = [
  { id:'sora',     name:'Sora',          stack:"'Sora',sans-serif",          preview:'Aa Bb Cc 123' },
  { id:'inter',    name:'Inter',         stack:"'Inter',sans-serif",          preview:'Aa Bb Cc 123' },
  { id:'dm-sans',  name:'DM Sans',       stack:"'DM Sans',sans-serif",        preview:'Aa Bb Cc 123' },
  { id:'nunito',   name:'Nunito',        stack:"'Nunito',sans-serif",          preview:'Aa Bb Cc 123' },
  { id:'space',    name:'Space Grotesk', stack:"'Space Grotesk',sans-serif",  preview:'Aa Bb Cc 123' },
  { id:'fira',     name:'Fira Code',     stack:"'Fira Code',monospace",       preview:'Aa Bb 01 23' },
  { id:'playfair', name:'Playfair',      stack:"'Playfair Display',serif",    preview:'Aa Bb Cc 123' },
];

const QA_CATS = [
  { id:'alimentacao', icon:'🍽️', label:'Mercado'   },
  { id:'transporte',  icon:'🚗', label:'Transporte' },
  { id:'lazer',       icon:'🎉', label:'Lazer'      },
  { id:'moradia',     icon:'🏠', label:'Moradia'    },
  { id:'saude',       icon:'❤️', label:'Saúde'      },
  { id:'outros',      icon:'📦', label:'Outros'     },
];

const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];



# Syna — Finanças do Casal

> Controle financeiro inteligente para casais. Multi-usuário, temas, animações spring, relatórios, desafios e muito mais.

---

## 📁 Estrutura

```
/syna
├── /frontend                  ← Todo o código front-end
│   ├── index.html             ← Entry point (referencía todos os scripts)
│   ├── styles.css             ← Todos os estilos (variáveis, temas, componentes)
│   ├── app.js                 ← Bootstrap: init() + goPage() router
│   │
│   ├── /config.js             ← Constantes globais (THEMES, FONTS, COLORS, CATS)
│   │
│   ├── /store
│   │   └── state.js           ← Estado reativo + loadState/saveState
│   │
│   ├── /services
│   │   ├── auth.js            ← Engine de autenticação (localStorage → Firebase-ready)
│   │   └── sync.js            ← Sincronização entre abas + pair code
│   │
│   ├── /utils
│   │   ├── format.js          ← fmt(), fmtShort(), catById(), monthTx()
│   │   └── animations.js      ← Ripple, jellyWobble, stagger, counter
│   │
│   ├── /components
│   │   ├── theme.js           ← Temas, cores, fontes, background
│   │   ├── avatar.js          ← Upload de foto + background
│   │   ├── names.js           ← Nomes, emojis, sync ao DOM
│   │   ├── categories.js      ← Categorias personalizadas
│   │   ├── transactions.js    ← CRUD + tabela de lançamentos
│   │   ├── dashboard.js       ← Cards de resumo + categorias
│   │   ├── charts.js          ← Todos os gráficos Chart.js
│   │   ├── budget.js          ← Orçamento por categoria
│   │   ├── goals.js           ← Metas financeiras
│   │   ├── quick-add.js       ← Lançamento rápido (numpad)
│   │   ├── challenge.js       ← Desafio do casal
│   │   ├── report.js          ← Relatório mensal automático
│   │   └── logo.js            ← Animações da logo Syna
│   │
│   └── /pages
│       ├── render.js          ← renderAll() + openModal + exportData
│       └── auth-ui.js         ← UI de login/cadastro/reset
│
└── /public
    └── logo.png               ← Logo Syna (fundo transparente)
```

---

## 🚀 Rodar localmente

### Opção 1 — Live Server (recomendado)
```bash
# VS Code → instale extensão "Live Server"
# Clique em "Go Live" com index.html aberto
```

### Opção 2 — Python
```bash
cd syna/frontend
python3 -m http.server 3000
# Abra http://localhost:3000
```

### Opção 3 — Node http-server
```bash
npx http-server syna/frontend -p 3000 -o
```

---

## 🏗️ Deploy (Netlify — mais fácil)

1. Acesse [netlify.com/drop](https://netlify.com/drop)
2. Arraste a pasta `/frontend` inteira
3. Seu app estará online em segundos com URL pública

### Deploy via CLI
```bash
npm install -g netlify-cli
netlify deploy --dir=syna/frontend --prod
```

---

## 🔌 Migrar para Firebase (próximo passo)

O arquivo `services/auth.js` foi projetado para ser substituído:

```js
// services/auth.js — troque os métodos:
const Auth = {
  async signUp(name, email, password) {
    // Substituir por: createUserWithEmailAndPassword(auth, email, password)
  },
  async login(email, password) {
    // Substituir por: signInWithEmailAndPassword(auth, email, password)
  },
  // ...
}
```

`store/state.js` — troque `localStorage` por Firestore:
```js
function saveState() {
  // localStorage.setItem(...) → doc(db, 'users', uid).set(state)
}
```

---

## 🎨 Adicionar novo tema

Em `config.js`:
```js
const THEMES = [
  // ...
  { id:'meutema', label:'🌺 Meu Tema', bg:'#...', surface:'#...', a:'#...', b:'#...' },
];
```

Em `styles.css`:
```css
[data-theme="meutema"] {
  --bg: #...;  --bg2: #...;  --surface: #...;
  --text: #...; --p1: #...; --p2: #...;
}
```

---

## 📦 Variáveis de ambiente (para Firebase)

Crie um arquivo `.env` na raiz:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🔒 Segurança

- Dados isolados por usuário via `localStorage` key prefixada com UID
- Auth local não é segura para produção — migre para Firebase Auth
- Em produção: use HTTPS, Firebase Security Rules e tokens JWT

---

## 📄 Licença

MIT — use, modifique e distribua livremente.

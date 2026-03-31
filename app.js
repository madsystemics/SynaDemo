console.log("APP RODOU");

// IMPORTS
import "./config.js";
import "./services/auth.js";
import "./store/state.js";
import "./utils/format.js";
import "./utils/animations.js";
import "./services/sync.js";

import "./components/theme.js";
import "./components/avatar.js";
import "./components/names.js";
import "./components/categories.js";
import "./components/transactions.js";
import "./components/dashboard.js";
import "./components/charts.js";
import "./components/budget.js";
import "./components/goals.js";
import "./components/quick-add.js";
import "./components/challenge.js";
import "./components/report.js";
import "./components/logo.js";

import "./pages/render.js";
import "./pages/auth-ui.js";

// 🔥 FUNÇÃO GLOBAL
function goPage(page) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.remove("active"));

  const target = document.querySelector(`[data-page="${page}"]`);
  if (target) target.classList.add("active");
}

// 🔥 EXPOR GLOBAL
window.goPage = goPage;

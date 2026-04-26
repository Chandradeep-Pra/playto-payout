import { formatCurrency } from "../utils/formatters.js";

function renderMetricCard({ label, value, tone = "" }) {
  return `
    <article class="metric ${tone}">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </article>
  `;
}

function renderStatCard({ label, value, copy }) {
  return `
    <article class="stat-card">
      <div class="label">${label}</div>
      <div class="stat-value">${value}</div>
      <p class="stat-copy">${copy}</p>
    </article>
  `;
}

function renderBankCard(account) {
  return `
    <article class="bank-card">
      <div class="status-row">
        <strong>${account.account_holder_name}</strong>
        ${account.is_default ? '<span class="badge">Default account</span>' : ""}
      </div>
      <div class="inline-meta">
        <span class="label">A/C ending</span>
        <span class="mono">•••• ${account.account_number_last4}</span>
      </div>
      <div class="inline-meta">
        <span class="label">IFSC</span>
        <span class="mono">${account.ifsc}</span>
      </div>
    </article>
  `;
}

function renderHeroSummary(balance) {
  return `
    <div class="hero-summary surface">
      <div class="hero-summary-grid">
        ${renderMetricCard({
          label: "Available balance",
          value: formatCurrency(balance?.available_balance_paise || 0),
        })}
        ${renderMetricCard({
          label: "Held balance",
          value: formatCurrency(balance?.held_balance_paise || 0),
        })}
      </div>
    </div>
  `;
}

export { renderBankCard, renderHeroSummary, renderStatCard };

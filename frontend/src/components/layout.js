import { renderBankCard, renderHeroSummary, renderStatCard } from "./cards.js";
import { renderPayoutForm } from "./forms.js";
import { renderLedgerTable, renderPayoutTable } from "./tables.js";
import { formatCount } from "../utils/formatters.js";

function renderApp(state) {
  const selectedMerchant = state.merchants.find(
    (merchant) => String(merchant.id) === String(state.selectedMerchantId)
  );

  const bankCards = state.bankAccounts.length
    ? state.bankAccounts.map(renderBankCard).join("")
    : '<div class="empty-state"><h3>No bank accounts</h3><p>This merchant does not have a connected destination account yet.</p></div>';

  const completedCount = state.payouts.filter((item) => item.status === "completed").length;
  const processingCount = state.payouts.filter((item) => item.status === "processing").length;

  return `
    <main class="page-shell">
      <section class="hero">
        <div class="hero-top">
          <div>
            <span class="eyebrow">Playto Pay dashboard</span>
            <h1>Payout operations with a clean control surface.</h1>
            <p>
              This frontend mirrors the backend’s ledger-driven model with a light, Stripe-inspired layout:
              merchant context, reserve-and-settle visibility, and quick access to payout history.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary" type="button" data-action="focus-form">New payout</button>
              <button class="btn btn-ghost" type="button" data-action="refresh-all">Sync status</button>
            </div>
          </div>
          ${renderHeroSummary(state.balance)}
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="stack">
          <section class="card surface">
            <div class="table-header">
              <div>
                <h2 class="section-title">Merchant overview</h2>
                <p class="section-copy">
                  ${selectedMerchant ? `${selectedMerchant.name} · ${selectedMerchant.email}` : "Loading merchant context..."}
                </p>
              </div>
              <div class="pill-row">
                <span class="badge">${formatCount(state.payouts.length, "payout")}</span>
                <span class="badge">${formatCount(state.ledger.length, "ledger entry")}</span>
              </div>
            </div>
            <div class="stats-grid">
              ${renderStatCard({
                label: "Settled payouts",
                value: String(completedCount),
                copy: "Completed debits that have exited the held balance.",
              })}
              ${renderStatCard({
                label: "Processing now",
                value: String(processingCount),
                copy: "Payouts currently waiting on asynchronous worker completion.",
              })}
              ${renderStatCard({
                label: "Destination accounts",
                value: String(state.bankAccounts.length),
                copy: "Merchant-linked payout accounts validated by the service layer.",
              })}
            </div>
          </section>

          <section class="panel surface" id="payout-form-panel">
            <div>
              <h2 class="section-title">Create a payout</h2>
              <p class="section-copy">
                Funds are held immediately, then moved to completed or released later by the background worker.
              </p>
            </div>
            ${renderPayoutForm({
              merchants: state.merchants,
              selectedMerchantId: state.selectedMerchantId,
              bankAccounts: state.bankAccounts,
              selectedBankAccountId: state.selectedBankAccountId,
              availableBalance: state.balance?.available_balance_paise || 0,
              createLoading: state.loading.createPayout,
            })}
            <div class="inline-feedback ${state.feedback.type ? `feedback-${state.feedback.type}` : ""}">
              ${state.feedback.message}
            </div>
          </section>

          <section class="card surface">
            <div class="table-header">
              <div>
                <h2 class="table-title">Recent payouts</h2>
                <p class="table-subtitle">Timeline of pending, processing, completed, and failed payouts.</p>
              </div>
            </div>
            ${renderPayoutTable(state.payouts)}
          </section>
        </div>

        <div class="stack">
          <section class="card surface">
            <div class="table-header">
              <div>
                <h2 class="table-title">Connected bank accounts</h2>
                <p class="table-subtitle">Merchant-owned destinations available for payout requests.</p>
              </div>
            </div>
            <div class="list-grid">${bankCards}</div>
          </section>

          <section class="card surface">
            <div class="table-header">
              <div>
                <h2 class="table-title">Ledger activity</h2>
                <p class="table-subtitle">Credits, holds, debits, and releases powering balance calculations.</p>
              </div>
            </div>
            ${renderLedgerTable(state.ledger)}
          </section>
        </div>
      </section>
    </main>
  `;
}

export { renderApp };

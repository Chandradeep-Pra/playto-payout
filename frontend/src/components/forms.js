import { formatCurrency } from "../utils/formatters.js";

function renderMerchantOptions(merchants, selectedMerchantId) {
  return merchants
    .map(
      (merchant) => `
        <option value="${merchant.id}" ${String(merchant.id) === String(selectedMerchantId) ? "selected" : ""}>
          ${merchant.name}
        </option>
      `
    )
    .join("");
}

function renderBankOptions(bankAccounts, selectedBankAccountId) {
  return bankAccounts
    .map(
      (account) => `
        <option value="${account.id}" ${String(account.id) === String(selectedBankAccountId) ? "selected" : ""}>
          ${account.account_holder_name} •••• ${account.account_number_last4}${account.is_default ? " (Default)" : ""}
        </option>
      `
    )
    .join("");
}

function renderPayoutForm({
  merchants,
  selectedMerchantId,
  bankAccounts,
  selectedBankAccountId,
  availableBalance,
  createLoading,
}) {
  return `
    <form id="payout-form" class="stack">
      <div class="panel-grid">
        <div class="field">
          <label for="merchant-select">Merchant</label>
          <select id="merchant-select" name="merchant_id">
            ${renderMerchantOptions(merchants, selectedMerchantId)}
          </select>
          <p class="field-note">Pick a seeded merchant to inspect balances, history, and payout flow.</p>
        </div>
        <div class="field">
          <label for="bank-account-select">Destination bank account</label>
          <select id="bank-account-select" name="bank_account_id">
            ${renderBankOptions(bankAccounts, selectedBankAccountId)}
          </select>
          <p class="field-note">The backend validates merchant ownership before reserving funds.</p>
        </div>
      </div>
      <div class="panel-grid">
        <div class="field">
          <label for="amount-input">Amount in rupees</label>
          <input id="amount-input" name="amount_rupees" type="number" min="1" step="1" placeholder="2500" />
          <p class="field-note">Available now: ${formatCurrency(availableBalance)}</p>
        </div>
        <div class="field">
          <label for="idempotency-preview">Request behavior</label>
          <input id="idempotency-preview" value="Every submit uses a fresh Idempotency-Key automatically." readonly />
          <p class="field-note">Duplicate button taps stay safe because the backend stores the original response.</p>
        </div>
      </div>
      <div class="toolbar">
        <button class="btn btn-primary" type="submit" ${createLoading ? "disabled" : ""}>
          ${createLoading ? '<span class="spinner"></span>Submitting payout' : "Create payout"}
        </button>
        <button class="btn btn-secondary" type="button" data-action="refresh-all">Refresh data</button>
      </div>
    </form>
  `;
}

export { renderPayoutForm };

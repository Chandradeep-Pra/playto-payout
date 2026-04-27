import { useState } from "react";
import { Button } from "../ui/Button.jsx";
import { Panel } from "../ui/Panel.jsx";
import { formatCurrency } from "../../utils/formatters.js";

export function PayoutForm({
  availableBalance,
  bankAccounts,
  feedback,
  isSubmitting,
  merchants,
  onMerchantChange,
  onRefresh,
  onSubmit,
  selectedBankAccountId,
  selectedMerchantId,
  setSelectedBankAccountId,
}) {
  const [amountRupees, setAmountRupees] = useState("");
  const hasMerchants = merchants.length > 0;
  const hasBankAccounts = bankAccounts.length > 0;
  const canSubmit =
    hasMerchants &&
    hasBankAccounts &&
    Number.isFinite(Number(amountRupees)) &&
    Number(amountRupees) > 0 &&
    !isSubmitting;

  async function handleSubmit(event) {
    event.preventDefault();

    const numericAmount = Number(amountRupees);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const submitted = await onSubmit(numericAmount);
    if (submitted) {
      setAmountRupees("");
    }
  }

  return (
    <Panel className="panel" id="payout-form-panel">
      <div>
        <h2 className="section-title">New payout</h2>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="panel-grid">
          <div className="field">
            <label htmlFor="merchant-select">Merchant</label>
            <select
              id="merchant-select"
              disabled={!hasMerchants}
              onChange={(event) => onMerchantChange(event.target.value)}
              value={selectedMerchantId}
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="bank-account-select">Bank account</label>
            <select
              id="bank-account-select"
              disabled={!hasBankAccounts}
              onChange={(event) => setSelectedBankAccountId(event.target.value)}
              value={selectedBankAccountId}
            >
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_holder_name} - XXXX {account.account_number_last4}
                  {account.is_default ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel-grid">
          <div className="field">
            <label htmlFor="amount-input">Amount (INR)</label>
            <input
              disabled={!hasBankAccounts}
              id="amount-input"
              min="1"
              onChange={(event) => setAmountRupees(event.target.value)}
              placeholder="2500"
              step="1"
              type="number"
              value={amountRupees}
            />
            <p className="field-note">Available: {formatCurrency(availableBalance)}</p>
          </div>

          <div className="field">
            <label htmlFor="request-behavior">Reference</label>
            <input
              id="request-behavior"
              readOnly
              type="text"
              value="Auto-generated request key"
            />
          </div>
        </div>

        <div className="toolbar">
          <Button className="btn-primary" disabled={!canSubmit} type="submit">
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Processing
              </>
            ) : (
              "Submit"
            )}
          </Button>
          <Button className="btn-secondary" onClick={onRefresh} type="button">
            Refresh
          </Button>
        </div>
      </form>

      <div className={`inline-feedback ${feedback.type ? `feedback-${feedback.type}` : ""}`}>
        {feedback.message}
      </div>
    </Panel>
  );
}

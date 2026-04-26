import { renderStatus } from "./status.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

function renderEmptyState(title, copy) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${copy}</p>
    </div>
  `;
}

function renderPayoutTable(payouts) {
  if (!payouts.length) {
    return renderEmptyState(
      "No payouts yet",
      "Create the first payout to see holds, processing, and settlement outcomes appear here."
    );
  }

  const rows = payouts
    .map(
      (payout) => `
        <tr>
          <td>#${payout.id}</td>
          <td>${formatCurrency(payout.amount_paise)}</td>
          <td>${renderStatus(payout.status)}</td>
          <td>${payout.attempts}</td>
          <td>${formatDate(payout.created_at)}</td>
          <td>${formatDate(payout.last_processed_at)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-shell">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Payout</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created</th>
              <th>Last processed</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderLedgerTable(entries) {
  if (!entries.length) {
    return renderEmptyState(
      "Ledger is empty",
      "Credits, holds, debits, and releases will show here as the merchant balance changes."
    );
  }

  const rows = entries
    .map(
      (entry) => `
        <tr>
          <td><span class="mono">#${entry.id}</span></td>
          <td><span class="status-pill status-${entry.entry_type}">${entry.entry_type}</span></td>
          <td class="amount-${entry.entry_type}">${formatCurrency(entry.amount_paise)}</td>
          <td>${entry.description || "No description"}</td>
          <td>${formatDate(entry.created_at)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-shell">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export { renderLedgerTable, renderPayoutTable };

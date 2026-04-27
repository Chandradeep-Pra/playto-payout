import { EmptyState } from "../ui/EmptyState.jsx";
import { Panel } from "../ui/Panel.jsx";
import { StatusPill } from "../ui/StatusPill.jsx";
import { TableShell } from "../ui/TableShell.jsx";
import { formatCurrency, formatDate, formatShortDate } from "../../utils/formatters.js";

function getFlowCopy(payout) {
  if (payout.status === "completed") {
    return "Hold released to debit";
  }

  if (payout.status === "failed") {
    return "Funds returned";
  }

  if (payout.status === "processing") {
    return `Attempt ${payout.attempts}${payout.next_retry_at ? ` · Retry ${formatShortDate(payout.next_retry_at)}` : ""}`;
  }

  return "Funds on hold";
}

export function PayoutTable({ payouts }) {
  return (
    <Panel className="card">
      <div className="table-header">
        <div>
          <h2 className="table-title">Payouts</h2>
        </div>
      </div>

      {payouts.length ? (
        <TableShell>
          <table>
            <thead>
              <tr>
                <th>Payout</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Flow</th>
                <th>Created</th>
                <th>Last processed</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>#{payout.id}</td>
                  <td>{formatCurrency(payout.amount_paise)}</td>
                  <td>
                    <StatusPill status={payout.status} />
                  </td>
                  <td className="flow-cell">
                    <div className="flow-title">{getFlowCopy(payout)}</div>
                    <div className="flow-meta">Attempts: {payout.attempts}</div>
                  </td>
                  <td>{formatDate(payout.created_at)}</td>
                  <td>{formatDate(payout.last_processed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : (
        <EmptyState title="No payouts" />
      )}
    </Panel>
  );
}

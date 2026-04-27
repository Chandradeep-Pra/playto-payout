import { EmptyState } from "../ui/EmptyState.jsx";
import { Panel } from "../ui/Panel.jsx";
import { StatusPill } from "../ui/StatusPill.jsx";
import { TableShell } from "../ui/TableShell.jsx";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function LedgerTable({ ledger }) {
  return (
    <Panel className="card">
      <div className="table-header">
        <div>
          <h2 className="table-title">Ledger</h2>
        </div>
      </div>

      {ledger.length ? (
        <TableShell>
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
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className="mono">#{entry.id}</td>
                  <td>
                    <StatusPill status={entry.entry_type} />
                  </td>
                  <td className={`amount-${entry.entry_type}`}>{formatCurrency(entry.amount_paise)}</td>
                  <td>{entry.description || "No description"}</td>
                  <td>{formatDate(entry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : (
        <EmptyState title="No ledger entries" />
      )}
    </Panel>
  );
}

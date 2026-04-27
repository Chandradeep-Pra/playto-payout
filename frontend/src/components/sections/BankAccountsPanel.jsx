import { EmptyState } from "../ui/EmptyState.jsx";
import { Panel } from "../ui/Panel.jsx";

function BankCard({ account }) {
  return (
    <article className="bank-card">
      <div className="status-row">
        <strong>{account.account_holder_name}</strong>
        {account.is_default ? <span className="badge">Primary</span> : null}
      </div>
      <div className="inline-meta">
        <span className="label">Account</span>
        <span className="mono">XXXX {account.account_number_last4}</span>
      </div>
      <div className="inline-meta">
        <span className="label">IFSC</span>
        <span className="mono">{account.ifsc}</span>
      </div>
    </article>
  );
}

export function BankAccountsPanel({ bankAccounts }) {
  return (
    <Panel className="card">
      <div className="table-header">
        <div>
          <h2 className="table-title">Bank accounts</h2>
        </div>
      </div>

      {bankAccounts.length ? (
        <div className="list-grid">
          {bankAccounts.map((account) => (
            <BankCard account={account} key={account.id} />
          ))}
        </div>
      ) : (
        <EmptyState title="No bank accounts" />
      )}
    </Panel>
  );
}

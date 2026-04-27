import { Panel } from "../ui/Panel.jsx";
import { pluralize } from "../../utils/formatters.js";

function StatCard({ label, value, copy }) {
  return (
    <article className="stat-card">
      <div className="label">{label}</div>
      <div className="stat-value">{value}</div>
      {copy ? <p className="stat-copy">{copy}</p> : null}
    </article>
  );
}

export function OverviewStats({ bankAccounts, ledger, payouts, selectedMerchant }) {
  const completedCount = payouts.filter((item) => item.status === "completed").length;
  const processingCount = payouts.filter((item) => item.status === "processing").length;

  return (
    <Panel className="card">
      <div className="table-header">
        <div>
          <h2 className="section-title">Merchant</h2>
          <p className="section-copy">
            {selectedMerchant
              ? `${selectedMerchant.name} - ${selectedMerchant.email}`
              : "No merchant selected"}
          </p>
        </div>
        <div className="pill-row">
          <span className="badge">{pluralize(payouts.length, "payout")}</span>
          <span className="badge">{pluralize(ledger.length, "ledger entry")}</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Completed"
          value={String(completedCount)}
        />
        <StatCard
          label="Processing"
          value={String(processingCount)}
        />
        <StatCard
          label="Accounts"
          value={String(bankAccounts.length)}
        />
      </div>
    </Panel>
  );
}

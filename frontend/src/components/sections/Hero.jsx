import { Button } from "../ui/Button.jsx";
import { formatCurrency } from "../../utils/formatters.js";

function MetricCard({ label, value }) {
  return (
    <article className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

export function Hero({ balance, isRefreshing, lastUpdatedLabel, onFocusForm, onRefresh }) {
  return (
    <section className="hero">
      <div className="hero-top">
        <div>
          <span className="eyebrow">Payout Console</span>
          <h1>Merchant Payouts</h1>
          <div className="hero-note-row">
            <span className="hero-note">Held funds stay reserved until worker settlement.</span>
            <span className="hero-sync">{isRefreshing ? "Refreshing" : `Updated ${lastUpdatedLabel}`}</span>
          </div>
          <div className="hero-actions">
            <Button className="btn-primary" onClick={onFocusForm} type="button">
              Create payout
            </Button>
            <Button className="btn-ghost" onClick={onRefresh} type="button">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="hero-summary surface">
          <div className="hero-summary-grid">
            <MetricCard
              label="Available"
              value={formatCurrency(balance?.available_balance_paise || 0)}
            />
            <MetricCard
              label="On hold"
              value={formatCurrency(balance?.held_balance_paise || 0)}
            />
          </div>
          <div className="hold-strip">
            <span className="hold-dot" />
            <span>New payouts move funds from Available to On hold immediately.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

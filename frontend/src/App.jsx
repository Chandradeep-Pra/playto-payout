import { useEffect, useState } from "react";
import { createPayout, getBalance, getBankAccounts, getLedger, getMerchants, getPayouts } from "./services/payouts.js";
import { generateIdempotencyKey } from "./utils/idempotency.js";
import { formatCurrency, formatShortDate } from "./utils/formatters.js";
import { Shell } from "./components/layout/Shell.jsx";
import { Hero } from "./components/sections/Hero.jsx";
import { OverviewStats } from "./components/sections/OverviewStats.jsx";
import { PayoutForm } from "./components/sections/PayoutForm.jsx";
import { PayoutTable } from "./components/sections/PayoutTable.jsx";
import { LedgerTable } from "./components/sections/LedgerTable.jsx";
import { BankAccountsPanel } from "./components/sections/BankAccountsPanel.jsx";

const initialFeedback = {
  type: "",
  message: "",
};

function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [balance, setBalance] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const selectedMerchant = merchants.find(
    (merchant) => String(merchant.id) === String(selectedMerchantId)
  );

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedMerchantId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadMerchantData(selectedMerchantId, { silent: true });
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [selectedMerchantId]);

  async function bootstrap() {
    try {
      setIsBootstrapping(true);
      const merchantList = await getMerchants();
      setMerchants(merchantList);

      const defaultMerchantId = merchantList[0]?.id ? String(merchantList[0].id) : "";
      setSelectedMerchantId(defaultMerchantId);

      if (defaultMerchantId) {
        await loadMerchantData(defaultMerchantId);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function loadMerchantData(merchantId, options = {}) {
    const { silent = false } = options;

    if (!merchantId) {
      setBankAccounts([]);
      setSelectedBankAccountId("");
      setBalance(null);
      setLedger([]);
      setPayouts([]);
      return;
    }

    try {
      setIsRefreshing(true);
      if (!silent) {
        setFeedback(initialFeedback);
      }

      const [accountList, balanceData, ledgerData, payoutsData] = await Promise.all([
        getBankAccounts(merchantId),
        getBalance(merchantId),
        getLedger(merchantId),
        getPayouts(merchantId),
      ]);

      setBankAccounts(accountList);
      setSelectedBankAccountId(
        String(accountList.find((account) => account.is_default)?.id || accountList[0]?.id || "")
      );
      setBalance(balanceData);
      setLedger(ledgerData);
      setPayouts(payoutsData);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      if (!silent) {
        setFeedback({
          type: "error",
          message: error.message,
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleMerchantChange(merchantId) {
    setSelectedMerchantId(merchantId);
    await loadMerchantData(merchantId);
  }

  async function handleRefresh() {
    await loadMerchantData(selectedMerchantId);
  }

  async function handleSubmitPayout(amountRupees) {
    if (!selectedMerchantId || !selectedBankAccountId) {
      setFeedback({
        type: "error",
        message: "Select a merchant and connected bank account before creating a payout.",
      });
      return false;
    }

    try {
      setIsSubmitting(true);
      setFeedback(initialFeedback);

      const payout = await createPayout(
        {
          merchant_id: Number(selectedMerchantId),
          bank_account_id: Number(selectedBankAccountId),
          amount_paise: Math.round(amountRupees * 100),
        },
        generateIdempotencyKey()
      );

      setFeedback({
        type: "success",
        message: `Payout #${payout.id} submitted for ${formatCurrency(payout.amount_paise)}.`,
      });

      await loadMerchantData(selectedMerchantId);
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Shell>
      <Hero
        balance={balance}
        isRefreshing={isRefreshing}
        lastUpdatedLabel={lastUpdatedAt ? formatShortDate(lastUpdatedAt) : "just now"}
        onFocusForm={() => {
          document.getElementById("payout-form-panel")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
        onRefresh={handleRefresh}
      />

      <div className="dashboard-grid">
        <div className="stack">
          <OverviewStats
            bankAccounts={bankAccounts}
            ledger={ledger}
            payouts={payouts}
            selectedMerchant={selectedMerchant}
          />

          <PayoutForm
            availableBalance={balance?.available_balance_paise || 0}
            bankAccounts={bankAccounts}
            feedback={feedback}
            isSubmitting={isSubmitting}
            merchants={merchants}
            onMerchantChange={handleMerchantChange}
            onRefresh={handleRefresh}
            onSubmit={handleSubmitPayout}
            selectedBankAccountId={selectedBankAccountId}
            selectedMerchantId={selectedMerchantId}
            setSelectedBankAccountId={setSelectedBankAccountId}
          />

          <PayoutTable payouts={payouts} />
        </div>

        <div className="stack">
          <BankAccountsPanel bankAccounts={bankAccounts} />
          <LedgerTable ledger={ledger} />
        </div>
      </div>

      {isBootstrapping ? (
        <div className="app-overlay">
          <div className="surface loading-card">
            <div className="spinner spinner-dark" />
            <p>Loading</p>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

export default App;

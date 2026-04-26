import {
  createPayout,
  getBalance,
  getBankAccounts,
  getLedger,
  getMerchants,
  getPayouts,
} from "./api/payouts.js";
import { renderApp } from "./components/layout.js";
import { clearFeedback, setFeedback, setLoading, setState, state } from "./state/store.js";
import { generateIdempotencyKey } from "./utils/idempotency.js";

const root = document.querySelector("#app");

function render() {
  root.innerHTML = renderApp(state);
  bindEvents();
}

async function bootstrap() {
  try {
    setLoading("bootstrap", true);
    const merchants = await getMerchants();
    const defaultMerchant = merchants[0];

    setState({
      merchants,
      selectedMerchantId: defaultMerchant ? String(defaultMerchant.id) : "",
    });

    await loadMerchantData(state.selectedMerchantId);
  } catch (error) {
    setFeedback("error", error.message);
  } finally {
    setLoading("bootstrap", false);
    render();
  }
}

async function loadMerchantData(merchantId) {
  if (!merchantId) {
    setState({
      bankAccounts: [],
      selectedBankAccountId: "",
      balance: null,
      ledger: [],
      payouts: [],
    });
    render();
    return;
  }

  try {
    setLoading("merchantData", true);
    clearFeedback();
    render();

    const [bankAccounts, balance, ledger, payouts] = await Promise.all([
      getBankAccounts(merchantId),
      getBalance(merchantId),
      getLedger(merchantId),
      getPayouts(merchantId),
    ]);

    const selectedBankAccountId =
      bankAccounts.find((account) => account.is_default)?.id || bankAccounts[0]?.id || "";

    setState({
      bankAccounts,
      selectedBankAccountId: String(selectedBankAccountId),
      balance,
      ledger,
      payouts,
    });
  } catch (error) {
    setFeedback("error", error.message);
  } finally {
    setLoading("merchantData", false);
    render();
  }
}

async function handleMerchantChange(event) {
  const merchantId = event.target.value;
  setState({ selectedMerchantId: merchantId });
  await loadMerchantData(merchantId);
}

function handleBankChange(event) {
  setState({ selectedBankAccountId: event.target.value });
}

async function handlePayoutSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const amountRupees = Number(formData.get("amount_rupees"));
  const merchantId = Number(state.selectedMerchantId);
  const bankAccountId = Number(state.selectedBankAccountId);

  if (!merchantId || !bankAccountId) {
    setFeedback("error", "Select a merchant and bank account before creating a payout.");
    render();
    return;
  }

  if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
    setFeedback("error", "Enter a valid payout amount in rupees.");
    render();
    return;
  }

  try {
    setLoading("createPayout", true);
    clearFeedback();
    render();

    const idempotencyKey = generateIdempotencyKey();
    const payout = await createPayout(
      {
        merchant_id: merchantId,
        amount_paise: Math.round(amountRupees * 100),
        bank_account_id: bankAccountId,
      },
      idempotencyKey
    );

    setFeedback(
      "success",
      `Payout #${payout.id} created with status ${payout.status}. Funds are now held and will be processed asynchronously.`
    );

    event.currentTarget.reset();
    await loadMerchantData(state.selectedMerchantId);
  } catch (error) {
    setFeedback("error", error.message);
  } finally {
    setLoading("createPayout", false);
    render();
  }
}

async function handleRefresh() {
  await loadMerchantData(state.selectedMerchantId);
}

function handleFocusForm() {
  document.querySelector("#payout-form-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function bindEvents() {
  document
    .querySelector("#merchant-select")
    ?.addEventListener("change", handleMerchantChange);

  document
    .querySelector("#bank-account-select")
    ?.addEventListener("change", handleBankChange);

  document
    .querySelector("#payout-form")
    ?.addEventListener("submit", handlePayoutSubmit);

  document.querySelectorAll('[data-action="refresh-all"]').forEach((button) => {
    button.addEventListener("click", handleRefresh);
  });

  document
    .querySelector('[data-action="focus-form"]')
    ?.addEventListener("click", handleFocusForm);
}

bootstrap();

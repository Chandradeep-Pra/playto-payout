const state = {
  merchants: [],
  bankAccounts: [],
  selectedMerchantId: "",
  selectedBankAccountId: "",
  balance: null,
  ledger: [],
  payouts: [],
  loading: {
    bootstrap: true,
    merchantData: false,
    createPayout: false,
  },
  feedback: {
    type: "",
    message: "",
  },
};

function setState(patch) {
  Object.assign(state, patch);
}

function setLoading(key, value) {
  state.loading[key] = value;
}

function setFeedback(type, message) {
  state.feedback = { type, message };
}

function clearFeedback() {
  setFeedback("", "");
}

export { clearFeedback, setFeedback, setLoading, setState, state };

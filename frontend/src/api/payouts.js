import { request } from "./client.js";

function getMerchants() {
  return request("/merchants/");
}

function getBankAccounts(merchantId) {
  return request(`/bank-accounts/?merchant_id=${merchantId}`);
}

function getBalance(merchantId) {
  return request(`/balance/?merchant_id=${merchantId}`);
}

function getLedger(merchantId) {
  return request(`/ledger/?merchant_id=${merchantId}`);
}

function getPayouts(merchantId) {
  return request(`/payouts/?merchant_id=${merchantId}`);
}

function createPayout(payload, idempotencyKey) {
  return request("/payouts/", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export {
  createPayout,
  getBalance,
  getBankAccounts,
  getLedger,
  getMerchants,
  getPayouts,
};

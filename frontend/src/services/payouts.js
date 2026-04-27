import { request } from "./client.js";

export function getMerchants() {
  return request("/merchants/");
}

export function getBankAccounts(merchantId) {
  return request(`/bank-accounts/?merchant_id=${merchantId}`);
}

export function getBalance(merchantId) {
  return request(`/balance/?merchant_id=${merchantId}`);
}

export function getLedger(merchantId) {
  return request(`/ledger/?merchant_id=${merchantId}`);
}

export function getPayouts(merchantId) {
  return request(`/payouts/?merchant_id=${merchantId}`);
}

export function createPayout(payload, idempotencyKey) {
  return request("/payouts/", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

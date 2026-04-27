from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

from django.test import TestCase, TransactionTestCase

from django.db import connection
from unittest import skipIf
from rest_framework.test import APIClient

from core.models import BankAccount, LedgerEntry, Merchant, Payout
from core.selectors import get_available_balance
from core.services import (
    InsufficientFundsError,
    create_credit_entry,
    request_payout,
)


class IdempotencyTest(TestCase):
    def setUp(self):
        self.merchant = Merchant.objects.create(
            name="Idempotency Merchant",
            email="idempotency@example.com",
        )

        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="Idempotency Merchant",
            account_number_last4="1234",
            ifsc="HDFC0001234",
            is_default=True,
        )

        create_credit_entry(
            merchant=self.merchant,
            amount_paise=10000,
            description="Initial credit",
        )

    def test_same_idempotency_key_returns_same_response(self):
        key = uuid4()

        first_response = request_payout(
            merchant_id=self.merchant.id,
            amount_paise=5000,
            bank_account_id=self.bank.id,
            idempotency_key=key,
        )

        second_response = request_payout(
            merchant_id=self.merchant.id,
            amount_paise=5000,
            bank_account_id=self.bank.id,
            idempotency_key=key,
        )

        self.assertEqual(first_response["id"], second_response["id"])
        self.assertEqual(Payout.objects.count(), 1)
        self.assertEqual(
            LedgerEntry.objects.filter(entry_type=LedgerEntry.EntryType.HOLD).count(),
            1,
        )


class PayoutApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(
            name="API Merchant",
            email="api@example.com",
        )
        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="API Merchant",
            account_number_last4="4321",
            ifsc="HDFC0004321",
            is_default=True,
        )

        create_credit_entry(
            merchant=self.merchant,
            amount_paise=10000,
            description="Initial credit",
        )

    def test_create_payout_returns_consistent_response_shape(self):
        response = self.client.post(
            "/api/v1/payouts/",
            {
                "merchant_id": self.merchant.id,
                "amount_paise": 5000,
                "bank_account_id": self.bank.id,
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid4()),
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("next_retry_at", response.data)
        self.assertIn("last_processed_at", response.data)
        self.assertEqual(response.data["status"], "pending")

    def test_create_payout_returns_404_for_unknown_merchant(self):
        response = self.client.post(
            "/api/v1/payouts/",
            {
                "merchant_id": 999999,
                "amount_paise": 5000,
                "bank_account_id": self.bank.id,
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid4()),
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["detail"], "Merchant not found.")

    def test_reused_idempotency_key_with_different_payload_returns_400(self):
        key = str(uuid4())

        first_response = self.client.post(
            "/api/v1/payouts/",
            {
                "merchant_id": self.merchant.id,
                "amount_paise": 5000,
                "bank_account_id": self.bank.id,
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=key,
        )

        second_response = self.client.post(
            "/api/v1/payouts/",
            {
                "merchant_id": self.merchant.id,
                "amount_paise": 3000,
                "bank_account_id": self.bank.id,
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=key,
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 400)
        self.assertIn("different request body", second_response.data["detail"])


@skipIf(
    connection.vendor == "sqlite",
    "SQLite does not support proper row-level locking for this concurrency test.",
)
class ConcurrencyTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.merchant = Merchant.objects.create(
            name="Concurrency Merchant",
            email="concurrency@example.com",
        )

        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="Concurrency Merchant",
            account_number_last4="5678",
            ifsc="HDFC0005678",
            is_default=True,
        )

        create_credit_entry(
            merchant=self.merchant,
            amount_paise=10000,
            description="Initial credit",
        )

    def _attempt_payout(self):
        try:
            return request_payout(
                merchant_id=self.merchant.id,
                amount_paise=6000,
                bank_account_id=self.bank.id,
                idempotency_key=uuid4(),
            )
        except InsufficientFundsError:
            return "insufficient_funds"

    def test_two_concurrent_payouts_do_not_overdraw_balance(self):
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: self._attempt_payout(), range(2)))

        successful_results = [result for result in results if isinstance(result, dict)]
        failed_results = [result for result in results if result == "insufficient_funds"]

        self.assertEqual(len(successful_results), 1)
        self.assertEqual(len(failed_results), 1)
        self.assertEqual(Payout.objects.count(), 1)
        self.assertEqual(get_available_balance(self.merchant), 4000)

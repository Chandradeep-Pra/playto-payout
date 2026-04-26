from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

from django.test import TestCase, TransactionTestCase

from django.db import connection
from unittest import skipIf

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
            results = list(
                executor.map(
                    lambda _: self._attempt_payout(),
                    range(2),
                )
            )

        successful_results = [
            result for result in results if isinstance(result, dict)
        ]

        failed_results = [
            result for result in results if result == "insufficient_funds"
        ]

        self.assertEqual(len(successful_results), 1)
        self.assertEqual(len(failed_results), 1)
        self.assertEqual(Payout.objects.count(), 1)

        self.merchant.refresh_from_db()
        self.assertEqual(get_available_balance(self.merchant), 4000)
import hashlib
import json
from datetime import timedelta

from django.utils import timezone
from django.db import IntegrityError

from django.db import transaction
from django.core.exceptions import ValidationError

from django.utils import timezone
from core.state_machine import validate_payout_transition

from core.models import BankAccount, IdempotencyRecord, LedgerEntry, Merchant, Payout
from core.selectors import get_available_balance


class InsufficientFundsError(Exception):
    pass


class InvalidBankAccountError(Exception):
    pass


def create_credit_entry(*, merchant, amount_paise, description=""):
    return LedgerEntry.objects.create(
        merchant=merchant,
        entry_type=LedgerEntry.EntryType.CREDIT,
        amount_paise=amount_paise,
        description=description,
    )


def create_hold_entry(*, merchant, payout, amount_paise, description=""):
    return LedgerEntry.objects.create(
        merchant=merchant,
        payout=payout,
        entry_type=LedgerEntry.EntryType.HOLD,
        amount_paise=amount_paise,
        description=description,
    )


def create_debit_entry(*, merchant, payout, amount_paise, description=""):
    return LedgerEntry.objects.create(
        merchant=merchant,
        payout=payout,
        entry_type=LedgerEntry.EntryType.DEBIT,
        amount_paise=amount_paise,
        description=description,
    )


def create_release_entry(*, merchant, payout, amount_paise, description=""):
    return LedgerEntry.objects.create(
        merchant=merchant,
        payout=payout,
        entry_type=LedgerEntry.EntryType.RELEASE,
        amount_paise=amount_paise,
        description=description,
    )


def build_request_hash(*, amount_paise, bank_account_id):
    payload = {
        "amount_paise": amount_paise,
        "bank_account_id": bank_account_id,
    }

    encoded_payload = json.dumps(payload, sort_keys=True).encode("utf-8")

    return hashlib.sha256(encoded_payload).hexdigest()


def build_payout_response(payout):
    return {
        "id": payout.id,
        "merchant": payout.merchant_id,
        "bank_account": payout.bank_account_id,
        "amount_paise": payout.amount_paise,
        "status": payout.status,
        "idempotency_key": str(payout.idempotency_key),
        "attempts": payout.attempts,
        "created_at": payout.created_at.isoformat(),
        "updated_at": payout.updated_at.isoformat(),
    }

@transaction.atomic
def request_payout(*, merchant_id, amount_paise, bank_account_id, idempotency_key):
    """
    Create a payout request and hold merchant funds safely.

    Guarantees:
    1. Locks merchant row using select_for_update().
    2. Uses IdempotencyRecord to safely handle duplicate requests.
    3. Calculates balance from ledger entries.
    4. Creates payout and hold entry in same DB transaction.
    """

    if amount_paise <= 0:
        raise ValidationError("Payout amount must be greater than zero.")

    request_hash = build_request_hash(
        amount_paise=amount_paise,
        bank_account_id=bank_account_id,
    )

    merchant = (
        Merchant.objects
        .select_for_update()
        .get(id=merchant_id)
    )

    expires_at = timezone.now() + timedelta(hours=24)

    idempotency_record, created = IdempotencyRecord.objects.select_for_update().get_or_create(
        merchant=merchant,
        key=idempotency_key,
        defaults={
            "request_hash": request_hash,
            "expires_at": expires_at,
        },
    )

    if not created:
        if idempotency_record.request_hash != request_hash:
            raise ValidationError(
                "Idempotency-Key was already used with a different request body."
            )

        if idempotency_record.response_body:
            return idempotency_record.response_body

        existing_payout = Payout.objects.filter(
            merchant=merchant,
            idempotency_key=idempotency_key,
        ).first()

        if existing_payout:
            return build_payout_response(existing_payout)

    bank_account = BankAccount.objects.filter(
        id=bank_account_id,
        merchant=merchant,
    ).first()

    if bank_account is None:
        raise InvalidBankAccountError("Bank account does not belong to this merchant.")

    available_balance = get_available_balance(merchant)

    if available_balance < amount_paise:
        raise InsufficientFundsError(
            f"Insufficient funds. Available: {available_balance}, requested: {amount_paise}"
        )

    payout = Payout.objects.create(
        merchant=merchant,
        bank_account=bank_account,
        amount_paise=amount_paise,
        status=Payout.Status.PENDING,
        idempotency_key=idempotency_key,
    )

    create_hold_entry(
        merchant=merchant,
        payout=payout,
        amount_paise=amount_paise,
        description=f"Funds held for payout {payout.id}",
    )

    response_body = build_payout_response(payout)

    idempotency_record.response_body = response_body
    idempotency_record.status_code = 201
    idempotency_record.save(
        update_fields=[
            "response_body",
            "status_code",
        ]
    )

    return response_body

@transaction.atomic
def mark_payout_processing(*, payout_id):
    payout = (
        Payout.objects
        .select_for_update()
        .get(id=payout_id)
    )

    validate_payout_transition(
        payout.status,
        Payout.Status.PROCESSING,
    )

    payout.status = Payout.Status.PROCESSING
    payout.attempts += 1
    payout.last_processed_at = timezone.now()
    payout.save(
        update_fields=[
            "status",
            "attempts",
            "last_processed_at",
            "updated_at",
        ]
    )

    return payout


@transaction.atomic
def mark_payout_completed(*, payout_id):
    payout = (
        Payout.objects
        .select_for_update()
        .get(id=payout_id)
    )

    validate_payout_transition(
        payout.status,
        Payout.Status.COMPLETED,
    )

    payout.status = Payout.Status.COMPLETED
    payout.save(update_fields=["status", "updated_at"])

    create_debit_entry(
        merchant=payout.merchant,
        payout=payout,
        amount_paise=payout.amount_paise,
        description=f"Payout {payout.id} completed",
    )

    return payout


@transaction.atomic
def mark_payout_failed(*, payout_id):
    payout = (
        Payout.objects
        .select_for_update()
        .get(id=payout_id)
    )

    validate_payout_transition(
        payout.status,
        Payout.Status.FAILED,
    )

    payout.status = Payout.Status.FAILED
    payout.save(update_fields=["status", "updated_at"])

    create_release_entry(
        merchant=payout.merchant,
        payout=payout,
        amount_paise=payout.amount_paise,
        description=f"Payout {payout.id} failed, funds released",
    )

    return payout
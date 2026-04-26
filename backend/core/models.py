from django.db import models
from django.core.validators import MinValueValidator


class Merchant(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="bank_accounts",
    )

    account_holder_name = models.CharField(max_length=255)
    account_number_last4 = models.CharField(max_length=4)
    ifsc = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.account_holder_name} ••••{self.account_number_last4}"


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = "credit", "Credit"
        HOLD = "hold", "Hold"
        DEBIT = "debit", "Debit"
        RELEASE = "release", "Release"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )

    payout = models.ForeignKey(
        "Payout",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )

    entry_type = models.CharField(
        max_length=20,
        choices=EntryType.choices,
    )

    amount_paise = models.BigIntegerField(
        validators=[MinValueValidator(1)]
    )

    description = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.merchant.name} - {self.entry_type} - {self.amount_paise}"


class Payout(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="payouts",
    )

    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name="payouts",
    )

    amount_paise = models.BigIntegerField(
        validators=[MinValueValidator(1)]
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    idempotency_key = models.UUIDField()

    attempts = models.PositiveIntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    last_processed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["merchant", "idempotency_key"],
                name="unique_payout_idempotency_key_per_merchant",
            )
        ]

    def __str__(self):
        return f"Payout {self.id} - {self.status} - {self.amount_paise}"


class IdempotencyRecord(models.Model):
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="idempotency_records",
    )

    key = models.UUIDField()
    request_hash = models.CharField(max_length=255)

    response_body = models.JSONField(null=True, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True)

    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["merchant", "key"],
                name="unique_idempotency_key_per_merchant",
            )
        ]

    def __str__(self):
        return f"{self.merchant.name} - {self.key}"
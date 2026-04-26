from rest_framework import serializers

from core.models import BankAccount, LedgerEntry, Merchant, Payout


class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ["id", "name", "email"]


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            "id",
            "merchant",
            "account_holder_name",
            "account_number_last4",
            "ifsc",
            "is_default",
        ]


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "merchant",
            "payout",
            "entry_type",
            "amount_paise",
            "description",
            "created_at",
        ]


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            "id",
            "merchant",
            "bank_account",
            "amount_paise",
            "status",
            "idempotency_key",
            "attempts",
            "next_retry_at",
            "last_processed_at",
            "created_at",
            "updated_at",
        ]


class PayoutRequestSerializer(serializers.Serializer):
    merchant_id = serializers.IntegerField()
    amount_paise = serializers.IntegerField(min_value=1)
    bank_account_id = serializers.IntegerField()
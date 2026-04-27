from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from core.models import BankAccount, LedgerEntry, Merchant, Payout
from core.selectors import get_available_balance, get_held_balance
from core.serializers import (
    BankAccountSerializer,
    LedgerEntrySerializer,
    MerchantSerializer,
    PayoutRequestSerializer,
    PayoutSerializer,
)
from core.services import (
    InsufficientFundsError,
    InvalidBankAccountError,
    request_payout,
)


@api_view(["GET"])
def merchant_list_view(request):
    merchants = Merchant.objects.all().order_by("name")
    serializer = MerchantSerializer(merchants, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def bank_account_list_view(request):
    merchant_id = request.query_params.get("merchant_id")

    if not merchant_id:
        return Response(
            {"detail": "merchant_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bank_accounts = BankAccount.objects.filter(
        merchant_id=merchant_id
    ).order_by("-is_default", "id")
    serializer = BankAccountSerializer(bank_accounts, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def balance_view(request):
    merchant_id = request.query_params.get("merchant_id")

    if not merchant_id:
        return Response(
            {"detail": "merchant_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        merchant = Merchant.objects.get(id=merchant_id)
    except Merchant.DoesNotExist:
        return Response(
            {"detail": "Merchant not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "merchant_id": merchant.id,
            "available_balance_paise": get_available_balance(merchant),
            "held_balance_paise": get_held_balance(merchant),
        }
    )


@api_view(["GET"])
def ledger_list_view(request):
    merchant_id = request.query_params.get("merchant_id")

    if not merchant_id:
        return Response(
            {"detail": "merchant_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entries = LedgerEntry.objects.filter(merchant_id=merchant_id).order_by("-created_at")[:20]
    serializer = LedgerEntrySerializer(entries, many=True)

    return Response(serializer.data)


@api_view(["GET", "POST"])
def payout_list_create_view(request):
    if request.method == "GET":
        merchant_id = request.query_params.get("merchant_id")

        if not merchant_id:
            return Response(
                {"detail": "merchant_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payouts = Payout.objects.filter(merchant_id=merchant_id).order_by("-created_at")
        serializer = PayoutSerializer(payouts, many=True)

        return Response(serializer.data)

    serializer = PayoutRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    idempotency_key = request.headers.get("Idempotency-Key")

    if not idempotency_key:
        return Response(
            {"detail": "Idempotency-Key header is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        payout = request_payout(
            merchant_id=serializer.validated_data["merchant_id"],
            amount_paise=serializer.validated_data["amount_paise"],
            bank_account_id=serializer.validated_data["bank_account_id"],
            idempotency_key=idempotency_key,
        )
    except Merchant.DoesNotExist:
        return Response(
            {"detail": "Merchant not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValidationError as exc:
        message = exc.message if hasattr(exc, "message") else str(exc)
        return Response(
            {"detail": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except InsufficientFundsError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except InvalidBankAccountError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        payout,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def payout_detail_view(request, payout_id):
    try:
        payout = Payout.objects.get(id=payout_id)
    except Payout.DoesNotExist:
        return Response(
            {"detail": "Payout not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = PayoutSerializer(payout)
    return Response(serializer.data)

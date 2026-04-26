from django.db.models import Sum, Case, When, F, Value, BigIntegerField
from django.db.models.functions import Coalesce

from core.models import LedgerEntry


def get_available_balance(merchant):
    """
    available_balance =
        credits + releases - holds
    """

    balance = (
        LedgerEntry.objects.filter(merchant=merchant)
        .aggregate(
            balance=Coalesce(
                Sum(
                    Case(
                        When(
                            entry_type__in=[
                                LedgerEntry.EntryType.CREDIT,
                                LedgerEntry.EntryType.RELEASE,
                            ],
                            then=F("amount_paise"),
                        ),
                        When(
                            entry_type=LedgerEntry.EntryType.HOLD,
                            then=-F("amount_paise"),
                        ),
                        default=Value(0),
                        output_field=BigIntegerField(),
                    )
                ),
                0,
            )
        )["balance"]
    )

    return balance

def get_held_balance(merchant):
    """
    held_balance =
        holds - debits - releases
    """

    held = (
        LedgerEntry.objects.filter(merchant=merchant)
        .aggregate(
            held=Coalesce(
                Sum(
                    Case(
                        When(
                            entry_type=LedgerEntry.EntryType.HOLD,
                            then=F("amount_paise"),
                        ),
                        When(
                            entry_type__in=[
                                LedgerEntry.EntryType.DEBIT,
                                LedgerEntry.EntryType.RELEASE,
                            ],
                            then=-F("amount_paise"),
                        ),
                        default=Value(0),
                        output_field=BigIntegerField(),
                    )
                ),
                0,
            )
        )["held"]
    )

    return held
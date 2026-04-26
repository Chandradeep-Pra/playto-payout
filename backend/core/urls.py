from django.urls import path

from core import views

urlpatterns = [
    path("merchants/", views.merchant_list_view, name="merchant-list"),
    path("bank-accounts/", views.bank_account_list_view, name="bank-account-list"),
    path("balance/", views.balance_view, name="balance"),
    path("ledger/", views.ledger_list_view, name="ledger-list"),
    path("payouts/", views.payout_list_create_view, name="payout-list-create"),
    path("payouts/<int:payout_id>/", views.payout_detail_view, name="payout-detail"),
]

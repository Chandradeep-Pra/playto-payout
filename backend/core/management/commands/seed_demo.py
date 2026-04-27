from django.core.management.base import BaseCommand

from core.models import BankAccount, LedgerEntry, Merchant, Payout
from core.services import create_credit_entry


class Command(BaseCommand):
    help = "Seed demo merchants, bank accounts, and ledger credit history."

    def handle(self, *args, **options):
        LedgerEntry.objects.all().delete()
        Payout.objects.all().delete()
        BankAccount.objects.all().delete()
        Merchant.objects.all().delete()

        merchants_data = [
            {
                "name": "Tata Retail Services",
                "email": "finance@tataretail.in",
                "credits": [50000, 25000, 10000],
            },
            {
                "name": "Rupa Fashions Private Limited",
                "email": "ops@rupafashions.in",
                "credits": [75000, 15000],
            },
            {
                "name": "Mahindra Digital Commerce",
                "email": "settlements@mahindradigital.in",
                "credits": [120000, 30000],
            },
            {
                "name": "Infosys Business Solutions",
                "email": "treasury@infosysbiz.in",
                "credits": [95000, 45000],
            },
        ]

        for index, data in enumerate(merchants_data, start=1):
            merchant = Merchant.objects.create(
                name=data["name"],
                email=data["email"],
            )

            BankAccount.objects.create(
                merchant=merchant,
                account_holder_name=data["name"],
                account_number_last4=f"{1000 + index}",
                ifsc=f"HDFC000{index}234",
                is_default=True,
            )

            for amount in data["credits"]:
                create_credit_entry(
                    merchant=merchant,
                    amount_paise=amount,
                    description="Seed customer payment",
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created merchant {merchant.name} with demo credit history."
                )
            )

        self.stdout.write(self.style.SUCCESS("Demo seed completed."))

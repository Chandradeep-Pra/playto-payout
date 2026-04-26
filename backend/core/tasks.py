import random

from datetime import timedelta

from django.utils import timezone

from celery import shared_task

from core.models import Payout
from core.services import (
    mark_payout_processing,
    mark_payout_completed,
    mark_payout_failed,
)


@shared_task
def process_pending_payouts():
    pending_payouts = Payout.objects.filter(
        status=Payout.Status.PENDING
    ).order_by("created_at")[:10]

    processed = 0

    for payout in pending_payouts:
        try:
            payout = mark_payout_processing(payout_id=payout.id)

            result = random.choices(
                ["success", "failure", "hang"],
                weights=[70, 20, 10],
                k=1,
            )[0]

            if result == "success":
                mark_payout_completed(payout_id=payout.id)

            elif result == "failure":
                mark_payout_failed(payout_id=payout.id)

            # hang means leave it in processing
            processed += 1

        except Exception:
            continue

    return {"processed": processed}

@shared_task
def retry_stuck_processing_payouts():
    cutoff_time = timezone.now() - timedelta(seconds=30)

    stuck_payouts = Payout.objects.filter(
        status=Payout.Status.PROCESSING,
        last_processed_at__lt=cutoff_time,
        attempts__lt=3,
    ).order_by("last_processed_at")[:10]

    retried = 0

    for payout in stuck_payouts:
        try:
            result = random.choices(
                ["success", "failure", "hang"],
                weights=[70, 20, 10],
                k=1,
            )[0]

            if result == "success":
                mark_payout_completed(payout_id=payout.id)

            elif result == "failure":
                mark_payout_failed(payout_id=payout.id)

            else:
                payout.attempts += 1
                payout.last_processed_at = timezone.now()
                payout.save(
                    update_fields=[
                        "attempts",
                        "last_processed_at",
                        "updated_at",
                    ]
                )

            retried += 1

        except Exception:
            continue

    exhausted_payouts = Payout.objects.filter(
        status=Payout.Status.PROCESSING,
        attempts__gte=3,
    )

    failed = 0

    for payout in exhausted_payouts:
        try:
            mark_payout_failed(payout_id=payout.id)
            failed += 1
        except Exception:
            continue

    return {
        "retried": retried,
        "failed_after_max_attempts": failed,
    }
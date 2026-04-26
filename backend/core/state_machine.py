from core.models import Payout


class InvalidPayoutStateTransition(Exception):
    pass


ALLOWED_TRANSITIONS = {
    Payout.Status.PENDING: [
        Payout.Status.PROCESSING,
    ],
    Payout.Status.PROCESSING: [
        Payout.Status.COMPLETED,
        Payout.Status.FAILED,
    ],
    Payout.Status.COMPLETED: [],
    Payout.Status.FAILED: [],
}


def validate_payout_transition(current_status, next_status):
    allowed_next_statuses = ALLOWED_TRANSITIONS.get(current_status, [])

    if next_status not in allowed_next_statuses:
        raise InvalidPayoutStateTransition(
            f"Invalid payout status transition: {current_status} → {next_status}"
        )

    return True
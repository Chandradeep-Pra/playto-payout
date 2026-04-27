# Payout Engine – System Explainer

## Overview

This project implements a simplified payout engine

The system supports:

- merchant balance tracking
- payout requests
- retry logic for failed payouts
- idempotent API behavior
- concurrency-safe withdrawal handling
- background payout processing using Celery workers

Instead of storing balances directly, the system follows a **ledger-based accounting model**, which improves correctness and reliability.

---

# Core Design

Instead of storing balances like:

merchant.balance = 100

the system calculates balances from ledger entries:

credit  
hold  
debit  
release  

This ensures:

- auditability
- safety during concurrent requests
- easy rollback support
- correct retry behavior
- no floating balance corruption

---

# Ledger Model

Each money movement creates a ledger entry.

Entry types:

| type | meaning |
|------|--------|
| credit | money added to merchant |
| hold | payout requested (funds reserved) |
| debit | payout completed |
| release | payout failed → funds returned |

Balances are calculated dynamically:

available_balance = credits + releases − holds  
held_balance = holds − debits − releases

This prevents double-counting during payout lifecycle transitions.

---

# Payout Lifecycle

Each payout follows a strict state machine:

pending → processing → completed  
pending → processing → failed

Invalid transitions are blocked intentionally.

Example:

completed → pending ❌  
failed → completed ❌  

This protects payout integrity.

---

# Concurrency Protection

Multiple payout requests arriving at the same time can create overdraft bugs if not handled properly.

Example problem:

balance = ₹100  

request A withdraws ₹60  
request B withdraws ₹60  

Without locking:

both succeed ❌  

Solution used:

transaction.atomic()  
select_for_update()

This locks the merchant row during payout creation and ensures only one request succeeds.

---

# Idempotency Handling

Real-world payment APIs must handle duplicate requests safely.

Example:

User clicks payout button twice.

Expected behavior:

only one payout created  
second request returns same response  

Implemented using:

IdempotencyRecord model  
request hash validation  
stored response replay  

If the same key is reused with a different request body:

request rejected

---

# Background Processing (Celery + Redis)

Payout execution happens asynchronously.

Flow:

POST /payouts  
→ create payout (pending)  
→ hold funds  
→ return response immediately  

Then Celery worker processes:

pending → processing → completed / failed  

This simulates real bank settlement behavior.

---

# Retry Strategy

Sometimes bank responses are delayed or stuck.

System handles this using retry logic:

processing > 30 seconds  
→ retry  
max retries = 3  
→ mark failed  
→ release funds  

This ensures payouts never remain stuck indefinitely.

---

# Why Ledger Instead of Stored Balance?

Stored balances create risks like:

balance mismatch  
race conditions  
lost updates  
double spend  

Ledger-based systems provide:

audit trail  
replayability  
safety  
correct retry behavior  
production reliability  

Most payment processors follow this pattern.

---

# API Endpoints

Supported APIs:

GET  /api/v1/balance/?merchant_id=  
GET  /api/v1/ledger/?merchant_id=  
GET  /api/v1/payouts/?merchant_id=  
POST /api/v1/payouts/  
GET  /api/v1/payouts/{id}/  

Payout creation requires:

Idempotency-Key header

to prevent duplicate requests.

---

# Background Worker Responsibilities

Celery worker handles:

processing pending payouts  
retrying stuck payouts  
finalizing payout states  
releasing held funds when necessary  

This keeps request-response API fast and reliable.

---

# Summary

This payout engine demonstrates:

- ledger-based accounting model
- concurrency-safe payout creation
- idempotent API design
- retry-safe background workers
- state-machine-based payout lifecycle
- production-style architecture separation

The goal was to build something close to how real payout infrastructure behaves internally while keeping the implementation readable and testable.

The concurrency test is intended to run on PostgreSQL because the implementation relies on row-level locking using `select_for_update()`. SQLite does not support the same row-level locking behavior and may throw database table lock errors during local concurrent test runs.

#! IMPORTANT  
## Please refer to [START.md](../START.md)

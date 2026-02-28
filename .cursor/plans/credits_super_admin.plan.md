# Credits & Super Admin Dashboard

## Goal

Introduce a credit system (15m=1, 30m=2, 45m=3) and a super admin dashboard to manage credits, institutions, members, and usage.

## Scope

- Credit accounting and enforcement on interview start
- Super admin dashboard (overview, users, institutions, usage, bulk member upload)
- Role-based access (super_admin)
- Navigation link (visible to super admin) in lower nav/home

## Changes

1) Data model (Supabase)

- Tables:
- `user_credits`: user_id (pk, fk users.id), balance int, updated_at
- `credit_transactions`: id, user_id, delta, reason, metadata json, created_at
- `institution_usage`: id, institution_id, credits_used int, groq_calls int, period (date), created_at
- (If missing) ensure `institutions` and `institution_members` tables exist/used

2) Credit enforcement

- In `/api/interview/start`: compute cost by duration (15->1, 30->2, 45->3 else scale) and require sufficient balance; deduct atomically; log transaction.
- Optionally refund on immediate failure (simple: only deduct after creation succeeds).

3) Role-based access

- Add `role` (super_admin) in user metadata or a `user_roles` table; gate new admin API routes and pages.

4) Super admin dashboard (new route)

- Overview: total credits issued/remaining, total Groq calls, per-institution usage (credits + groq calls).
- Users: search/list, view/add credits, view transactions.
- Institutions: list institutions, members, member credits; add credits to members.
- Bulk upload members by email to an institution (CSV list of emails).

5) Navigation

- Add “Super Admin” link in lower nav (home) visible only to super_admin.

6) Config

- Credit pricing map configurable (constants or env).
- Usage tracking for Groq calls increments `institution_usage.groq_calls` (where applicable).

7) Safety

- Keep rate limiting and auth checks.
- Lint check after changes.

## Steps

1. Add DB layer (queries) for credits/transactions and usage helpers.
2. Update `/api/interview/start` to enforce/deduct credits and log transactions.
3. Add super admin pages/APIs for users, institutions, usage, bulk upload, credit adjustments.
4. Add role-gated nav link.
5. Track Groq usage where available.
6. Lint check.
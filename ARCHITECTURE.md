# Food Bank Platform — Architecture Reference

## The problem
Get surplus food from donors to people who need it — efficiently, without
waste, with enough tracking that donors trust the process (tax receipts,
impact reporting), volunteers can be coordinated (shifts, routes), inventory
doesn't spoil before use (expiration tracking), and everyone stays informed
(notifications).

## Core data model
See `foodbank-schema.sql` and `foodbank-er-diagram.mermaid` for the full
schema. Key entities: donors, donations, inventory_items, volunteers, shifts,
routes, route_stops, route_stop_items, recipients, notifications.

Notable design decisions:
- **Batch-level inventory**, not per-unit — matches how food banks actually
  receive and distribute goods.
- **Donations vs. inventory_items are separate tables** — one donation event
  can produce multiple inventory batches.
- **route_stop_items is the join table** between stops and inventory,
  tracking exactly what was delivered where — this powers both delivery
  logistics and donor impact reporting.
- **notifications uses polymorphic recipient_type + recipient_ref_id**
  instead of three separate FK columns. Simpler to extend, at the cost of no
  DB-level FK constraint on that link (enforced in application logic instead).
- **Inventory batch-splitting** is handled by treating `inventory_items.quantity`
  as the source batch size and letting `route_stop_items.quantity_delivered`
  represent partial allocations, rather than recursively splitting batches
  into child rows.

## Stack decisions and rationale

| Decision | Choice | Why |
|---|---|---|
| API framework | FastAPI | Async, strong typing via Pydantic, auto-generated OpenAPI docs, good fit for a relational schema like this |
| Database | PostgreSQL | Relational integrity matters here (FKs, constraints); UUID + JSON support if needed later |
| Hosting | AWS App Runner + RDS | Managed container hosting without ECS/Fargate config overhead; RDS handles backups/patching |
| Auth | JWT (access + refresh) | Stateless, no sticky sessions needed on App Runner; simple to reason about for a single role tier |
| Migrations | Alembic | Standard pairing with SQLAlchemy; schema is still evolving so version control on it starts now |
| Notifications | SendGrid (email) + Twilio (SMS) | Real sending from day one per requirements; both have generous free tiers for a project this size |
| Route sequencing | Google Maps / Mapbox API | Auto-optimized stop order rather than manual, per requirements |
| Scheduled jobs | EventBridge + Lambda | Nightly expiration checks and notification dispatch don't need a full queue (Celery/Redis) at this volume |
| Roles | Single tier: admin/staff | v1 scope — volunteer and donor self-service logins are a deliberate later phase |

## Upgrade paths (deliberately deferred, not forgotten)
- JWT → OAuth/multi-role when a donor or volunteer self-service portal is added
- EventBridge/Lambda → Celery + Redis if job volume or complexity grows
- Manual role tier → RBAC when volunteers/recipients need their own logins
- App Runner → ECS/Fargate if more infra control is needed later

## What's NOT in v1 (explicitly out of scope for now)
- Donor self-service portal
- Volunteer/recipient login accounts
- Demand forecasting or predictive inventory matching
- Multi-warehouse support
- Full audit/history trail beyond status fields + timestamps

## Immediate next steps (in priority order)
1. `donor_receipts` table — tax receipt generation, tied to `donations`
2. Enforce `sum(route_stop_items.quantity_delivered) <= inventory_items.quantity`
   (app-layer validation or Postgres trigger)
3. Build out remaining routers (inventory, volunteers, routes, recipients,
   notifications) following the `donors.py` router pattern
4. Wire up actual SendGrid/Twilio sending logic behind the `notifications` table
5. Scheduled Lambda for nightly expiration flagging
6. GitHub Actions CI (lint + pytest) — also closes a resume gap

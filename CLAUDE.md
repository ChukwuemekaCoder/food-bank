# Food Bank Platform — Backend

## What this is
Backend for a food bank platform: donors give food, it's tracked as inventory,
volunteers drive routes to deliver it to recipient orgs (pantries/shelters),
and notifications keep everyone informed. v1 scope only — see "Out of scope"
below before adding anything not listed there.

## Stack (do not deviate without asking first)
- FastAPI (Python)
- PostgreSQL via SQLAlchemy ORM
- Alembic for migrations
- JWT auth (access + refresh tokens) — admin/staff only in v1, single role tier
- SendGrid (email) + Twilio (SMS) for notifications
- Google Maps / Mapbox API for route stop sequencing
- Target hosting: AWS App Runner + RDS

## Project layout
```
app/
  core/config.py     # Settings, loaded from .env via pydantic-settings
  db/database.py     # SQLAlchemy engine, session, get_db() dependency
  models/             # SQLAlchemy ORM models, one file per entity group
  schemas/            # Pydantic request/response models, mirrors models/
  routers/            # API endpoints, one file per resource
  auth/               # security.py (hashing/JWT), dependencies.py (get_current_user)
  main.py             # FastAPI app, includes all routers
alembic/              # migration env + versioned scripts
```

## The pattern to follow for every new resource
`app/routers/donors.py` + `app/schemas/donor.py` are the reference implementation.
Every new router should match this shape:
1. Pydantic schemas in `app/schemas/<resource>.py`: `<X>Base`, `<X>Create`, `<X>Response`
2. Router in `app/routers/<resource>.py`, protected with
   `dependencies=[Depends(get_current_user)]` at the router level
3. Standard CRUD: POST (create), GET list (with skip/limit pagination), GET by id
4. Register the router in `app/main.py`
5. Models already exist for every entity in `app/models/` — do not redesign the
   schema without flagging why first (see "Schema decisions" below)

## Schema decisions already made — don't relitigate these
- **Batch-level inventory**, not per-unit tracking (`inventory_items.quantity` + `unit`)
- **Donations vs. inventory_items are separate tables** — one donation event can
  produce multiple inventory batches
- **route_stop_items** is the join table between route stops and inventory items,
  tracking `quantity_delivered` per stop — this is how partial batch allocation
  works. There is no batch-splitting/parent-child item hierarchy; enforce
  `sum(route_stop_items.quantity_delivered) <= inventory_items.quantity` in
  application logic (not yet implemented — see "Known gaps")
- **notifications** uses polymorphic `recipient_type` + `recipient_ref_id`
  instead of three separate FK columns. This is deliberate — no DB-level FK
  constraint on that link is expected, validate the type/id pairing in app code
- **Single role tier** (`staff_users.role`, currently always "admin") — no
  volunteer or donor self-service login in v1

## Known gaps (build these next, in roughly this order)
1. `donor_receipts` table — tax receipt generation, tied to `donations`
2. Batch-allocation validation described above
3. Remaining routers: inventory_items, volunteers/shifts, routes/route_stops,
   recipients, notifications — all following the donors.py pattern
4. Actual SendGrid/Twilio sending logic (the `notifications` table exists,
   nothing sends yet)
5. Scheduled job (EventBridge + Lambda, not Celery) for nightly expiration
   checks on `inventory_items`
6. Test suite (pytest is in requirements.txt, unused so far)
7. GitHub Actions CI (lint + pytest on push)

## Out of scope for v1 — do not build unless explicitly asked
- Donor or volunteer self-service portals / logins
- Multi-role RBAC
- Demand forecasting or predictive matching
- Multi-warehouse support
- Full audit/history trail beyond status fields + timestamps
- Celery/Redis or any job queue infra (scheduled Lambda is enough at this volume)

## Working style
- This is a learning project — after non-trivial logic (e.g. the batch
  allocation check, JWT refresh flow), briefly explain the approach before
  writing code rather than just producing the diff.
- Run and sanity-check each router via `/docs` before moving to the next one;
  don't batch multiple unverified routers together.
- Use plan mode for anything touching more than one router or the schema.

## Deliberate deferrals
- SMS sending (Twilio) is intentionally deferred — A2P 10DLC registration
  overhead isn't worth it for v1. Email (SendGrid) is the only active
  notification channel. Do not implement Twilio sending unless explicitly asked.

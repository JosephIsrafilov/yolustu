# Backend Development Notes

## Seed demo data

Development/demo seed uses the real SQLAlchemy models and current PostgreSQL schema.

Run from the repository root:

```powershell
cd backend
python scripts/seed_dev_data.py
```

Or through the local dev bootstrap:

```powershell
.\start-dev.ps1 -Seed
```

Requirements:
- `backend/.env` must contain a valid `DATABASE_URL`
- migrations must already be applied
- the target environment must be development/demo only

What the seed creates:
- demo users for passenger, driver, admin, and pending verification states
- vehicles for approved drivers
- active, completed, and cancelled rides across Azerbaijan routes
- bookings in pending, accepted, paid, rejected, cancelled, and completed states
- reviews, ride chat messages, and sample payments

Safety:
- seed is idempotent and uses deterministic IDs
- reruns update existing seed records instead of creating duplicates
- seed refuses to run when environment looks like production
- real secrets are read from env only and must never be committed

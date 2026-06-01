# Microservices Migration Path

## Current State

Yolmates now uses a modular monolith backend. The application still runs as one
FastAPI process and uses one PostgreSQL database, but backend code is grouped by
domain under `backend/app/domains`.

This keeps local development and booking transactions simple while making future
service extraction explicit.

## Domain Boundaries

- `identity`: authentication, users, JWT, OTP, current-user context.
- `trips`: rides, vehicles, route search, trip lifecycle.
- `bookings`: booking requests, acceptance, rejection, cancellation, seat counts.
- `engagement`: reviews, messages, WebSocket ride chat.
- `admin`: cross-domain administrative queries and actions.

Public API paths remain stable under `/api/*`; frontend configuration does not
need to change.

## Internal Contracts

- `CurrentUser` is the auth boundary object used by other domains.
- Domain services own business rules.
- Repositories own direct database access.
- Ports in `domains/*/ports.py` are the transition points for future
  cross-service calls.

When a domain is extracted into a service, replace its port implementation with
an HTTP or message-bus client and keep the calling domain unchanged.

## Extraction Order

1. Extract `identity` first, because it has the clearest boundary and issues JWTs.
2. Extract `trips` after stabilizing ride search and vehicle ownership contracts.
3. Extract `bookings` only after a seat-reservation strategy is defined, because
   it currently relies on a local database transaction with ride availability.
4. Extract `engagement` after booking/trip participant checks are available as
   service contracts.
5. Keep `admin` as an API gateway or back-office facade, not a data owner.

## Defaults

- Keep one database until service contracts and ownership boundaries are stable.
- Keep endpoint paths stable for the frontend.
- Do not add async messaging until there is a concrete workflow that needs it.

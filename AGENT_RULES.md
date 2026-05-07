# Yolüstü Agent Rules

## Product
Yolüstü is an Azerbaijani carpooling platform similar to BlaBlaCar.

The main product is a mobile app. In Sprint 0 we build a mobile-first web prototype with mock data and documentation.

## Sprint 0 Goal
Create:
- mobile-first UI prototype
- mock data
- mock state
- main user flows
- admin panel placeholder
- Scrum documentation
- API contract draft
- database schema draft
- demo scenario

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Mock data only
- No real backend in Sprint 0

## MVP Includes
- registration
- login
- profile
- driver/passenger role
- create trip
- search trips
- trip details
- booking request
- booking statuses
- driver accepts/rejects booking
- reviews and ratings
- basic admin panel

## MVP Excludes
- online payment
- train/bus tickets
- GPS tracking
- real maps
- automatic distance calculation
- real document verification
- complex dispute system
- real push notifications

## Business Rules
1. Only authenticated users can create trips.
2. One user can be both driver and passenger.
3. User cannot book their own trip.
4. Passenger sends booking request, not ticket purchase.
5. Driver accepts or rejects booking request.
6. Accepted booking reduces available seats.
7. Cancelled accepted booking restores seats.
8. Cancelled trips are not bookable.
9. Reviews are only allowed after completed trips.
10. Admin can block users and delete inappropriate trips.
11. Payment is outside the system in MVP.

## Design Rules
- Mobile-first
- Blue color system, not green
- Primary blue: #2563EB
- Dark navy: #0B1C30
- Background: #F8FAFC
- White cards
- Border: #D9E2EC
- Use ₼ for prices
- Use Azerbaijani cities
- No lorem ipsum
- No generic template look

## Quality Rules
- npm run build must pass
- no TypeScript errors
- no broken routes
- no broken imports
- reusable components required
- documentation must be updated
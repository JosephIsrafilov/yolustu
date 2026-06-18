# Mobile Real Backend Integration Errors

Date: 2026-06-18

This document lists the current mobile issues that must be fixed before mobile can be treated as connected to the real Yolmates product. Do not treat these as isolated UI bugs only; most of them come from mobile still using mock/local data where it should use the same backend data as the web app.

## Required Mock Boundaries

Only these mobile features should remain mocked for now:

- Driver verification approval button can remain a mock/dev action.
- Verification document upload itself must be real: the uploaded document must reach the backend/admin flow and be visible to admins.
- Payment operations can remain mocked internally, but the wallet/payment state must behave consistently in mobile.
- Driving animation can remain mocked/simulated.
- OTP SMS can remain mocked with code `123456`.

Everything else should be real:

- Rides shown in mobile must be backend rides, same as web.
- Accounts/users in mobile must be backend users, same as web.
- Bookings/reservations must be backend bookings.
- Chats/messages must be backend chats/messages.
- Drivers/passengers shown in mobile must be real users with real names.

## Ride Search Issues

### Any City Search Creates Fake Route Text

Current behavior:

- Searching `Baku -> Any City` for tomorrow shows rides with route text like `Baku -> Any City`.
- Searching `Any City -> Any City` can show ride cards/details that still contain `Any City`.

Expected behavior:

- `Any City` is only a search filter value, never a ride route value.
- Query should mean:
  - `from_city = Baku`
  - `to_city = any`
- Results must be real rides with concrete route values, for example:
  - `Baku -> Ganja`
  - `Baku -> Lankaran`
  - `Baku -> Quba`
- A ride card/detail must always display two specific cities.
- A ride must never have the same origin and destination.

Likely cause:

- Mobile fallback/mock ride generation is still generating rides from the search parameters instead of consuming backend ride route fields.
- The `Any City` sentinel is leaking into ride models/cards/details.

### No-Date Search Still Fails

Current behavior:

- Searching without selecting a date often shows no rides.
- Selecting a specific date can show rides.

Expected behavior:

- No selected date should mean all upcoming rides.
- Mobile should call backend search without `departure_date`.
- Backend should return upcoming active rides.
- Mobile should not add an accidental today-only filter.

### This Week Date Option Not Working

Current behavior:

- Selecting `This week` does not return expected rides.

Expected behavior:

- `This week` should query a real date range or use a backend-supported range filter.
- If backend has no range parameter yet, mobile and backend need an agreed contract.

Open decision:

- Add backend `departure_date_from` / `departure_date_to`, or define `departure_date` as start date plus range mode.

### City List Cleanup

Required change:

- Remove `Nakhchivan / Naxçıvan` from the mobile city list.

Reason:

- It should not be offered as a selectable city in the current app flow.

## Ride Data Is Fake / Not Same As Web

Current behavior:

- Mobile shows fake rides and fake drivers.
- Web shows different drivers/rides.

Expected behavior:

- Mobile ride search must use the same backend endpoints/data as web.
- Mobile and web should show the same ride inventory for the same query.
- Driver names, route, price, seats, date/time, and preferences must come from backend.

Required verification:

- Compare web search result and mobile search result for the same account/query.
- Confirm mobile is not using `MockData.ridesFor` in API mode.
- Confirm `AuthMode` / API mode defaults are correct for production/dev usage.

## Ride Detail Issues

Current behavior:

- Ride detail can show route text like `Baku -> Any City` or `Any -> Any`.
- Opening a ride can load very slowly and then show errors/noisy terminal output.

Expected behavior:

- Ride detail must fetch the ride by backend ride id.
- Ride detail must show concrete route:
  - real origin city
  - real destination city
- Ride detail must not resolve API rides from mock data.
- Map rendering should not spam Flutter terminal logs.

Likely cause:

- Mobile detail flow may still fall back to mock ride lookup or Google Maps preview errors.

## Booking / Reservation / Payment Issues

### Booking Does Not Check Balance

Current behavior:

- User can reserve/book a ride with zero wallet balance.

Expected behavior:

- Booking requires payment authorization/reservation.
- User must have enough balance before booking.
- If balance is insufficient, mobile should redirect/show top-up flow.

### Payment Should Be Reserved Before Ride Completion

Expected behavior:

- When passenger books a ride, funds are reserved/held.
- Funds are not paid out to the driver immediately.
- After ride completion, reserved funds are captured/released to driver.
- Wallet transactions should show:
  - reservation/hold when booking is made
  - capture/payment after ride completes
  - refund/release if ride is cancelled before completion

Current mock allowance:

- Actual payment provider operations may remain mocked.
- But state transitions and wallet transaction history must behave like real payment reservation flow.

## Chat Issues

### Chat Opens With Driver Named `User`

Current behavior:

- After reservation, app opens chat with driver.
- Driver name is shown as `User`.

Expected behavior:

- Chat header/contact must show real driver first name and surname from backend.
- If the booked ride driver is `John Smith`, chat should show `John Smith`, not `User`.

### Chat Is Not Real Across Accounts

Current behavior:

- Passenger can open a chat after reservation, but driver account does not reliably see the reservation/chat.
- Messages are not clearly shared between passenger and driver accounts.

Expected behavior:

- Booking should create or reuse a real conversation between passenger and driver.
- Passenger and driver should both see the same conversation.
- Messages should persist through backend.
- Logging into the driver account should show:
  - reservation/request for the ride
  - related conversation
  - real messages sent by the passenger

## Driver Account / Reservation Visibility

Current behavior:

- Driver account does not reliably show passenger reservation created from mobile.

Expected behavior:

- Driver account in mobile should show real backend booking/reservation requests.
- This must match the web driver's booking/request data.
- Driver should be able to open reservation details and related chat.

## Account Integration Issues

Current behavior:

- Mobile users/rides/chats feel disconnected from web.

Expected behavior:

- Mobile login must authenticate against the same backend users as web.
- Mobile account data must match web account data.
- Mobile should not create isolated mock users except for explicitly mocked OTP behavior.

Required checks:

- Confirm mobile API base URL points to the same backend as web.
- Confirm auth tokens/session storage are used for all ride/booking/chat/wallet calls.
- Confirm mobile repositories use API implementations in real mode.
- Remove silent fallback to mock data for real flows.

## Priority Fix Order

1. Enforce real API mode for rides/accounts/bookings/chats in mobile.
2. Fix ride search contract for `Any City`, no-date, and this-week queries.
3. Ensure ride cards/details always display concrete backend origin/destination.
4. Remove `Nakhchivan / Naxçıvan` from mobile city list.
5. Replace mock ride detail lookup with backend ride detail lookup.
6. Wire booking to backend reservation/payment-hold flow.
7. Wire chat creation/list/messages to backend conversations.
8. Ensure driver account sees real reservations and real chats.
9. Keep only the approved mock boundaries listed at the top of this document.

## Acceptance Criteria

- Searching `Baku -> Any City` shows only concrete routes from Baku to specific cities.
- Searching without date shows upcoming backend rides.
- `This week` returns rides in the correct week window.
- Mobile and web show the same rides for the same query.
- Ride detail opens quickly and shows real backend ride data.
- Booking fails with insufficient balance.
- Booking with sufficient balance creates a payment hold/reservation transaction.
- Driver sees passenger reservation after passenger books.
- Passenger and driver see the same real chat conversation and messages.
- Basic/unverified passenger wallet shows only `Balance`, not driver balance.
- Only explicitly approved mock features remain mocked.

# Mobile / Web Reservation, Chat, Map, and Ride Flow Handoff

Date: 2026-06-18

This document is a handoff for another agent to implement. Do not treat it as a request to redesign the product from scratch. The work should focus on fixing broken real flows first, then adding the missing ride-management pieces that are still absent in mobile.

This document does not replace [MOBILE_REAL_BACKEND_ERRORS.md](D:/Repositories/yolustu/mobile/MOBILE_REAL_BACKEND_ERRORS.md). It extends it with the current user-reported failures and implementation requirements across both mobile and web.

## Main Goal

Fix the real product-critical ride flow, especially reservation, chats, and maps.

Priority order:

1. Find the exact root cause of reservation failure in both web and mobile.
2. Fix chat list/detail flow in mobile.
3. Fix ride-detail chat target so it opens the driver conversation, not support.
4. Fix bugged map behavior in both web and mobile.
5. Add missing driver/passenger ride-flow features in mobile:
   - full car logic
   - seat/place selection for passengers
   - car add/edit for drivers
   - mock car document upload
   - separate ride detail screens for passenger and driver
   - explicit driver `Start ride` button

## Hard Constraints

- Only add real fixes for flows that should already be real.
- Keep these items mocked for now where requested:
  - payment operations can still be internally mocked, but reservation state must work correctly
  - car document upload can be mock from business-validation perspective, but the UI and data flow must exist
  - ride progression itself does not need to be truly real-time yet, but it must not auto-start accidentally
- Do not auto-start a ride just because a ride detail page was opened.
- Driver and passenger must not see the same ride detail screen.

## Reported Failures

## 1. Mobile Chats Page Is Broken

Current behavior:

- Mobile chats page shows an error instead of the chat list.

Expected behavior:

- Chat list should load successfully for the authenticated user.
- Existing backend conversations should appear in mobile.
- Tapping a conversation should open chat detail normally.

Implementation notes:

- Verify mobile is using the real chat repository and correct auth token.
- Check whether the chat list endpoint contract changed and mobile deserialization is now broken.
- Check whether the mobile app is still assuming support-chat-first behavior instead of backend conversation data.

## 2. Ride Detail Chat Button Opens Support Instead Of Driver

Current behavior:

- Chat icon near the driver on the ride details page opens a conversation labeled `Destek` instead of the ride driver's chat.

Expected behavior:

- Tapping the chat icon should open a chat with the specific driver of that ride.
- Chat header should show:
  - driver name
  - driver surname
  - hardcoded online status
- It should not open support unless the user explicitly opens support.

Implementation notes:

- The ride detail screen likely routes to a generic support conversation entry point instead of creating/finding a ride-linked driver conversation.
- Use ride driver identity from backend ride data.
- If a direct conversation does not exist yet, create or fetch one via backend using passenger id + driver id.

## 3. Reservation Fails In Web And Mobile

Current behavior:

- Pressing `Reserve` and paying does not complete the reservation.
- In mobile, it loads briefly and returns to the same ride details screen.
- Web reservation is also reported as failing.

Expected behavior:

- Reservation should create a booking successfully.
- The user should get a clear success or failure state.
- Failure should never silently bounce the user back to the same state with no result.

Required investigation:

- Trace the full reservation flow in both clients:
  - ride detail action
  - wallet/payment pre-check
  - booking creation request
  - backend booking response
  - conversation creation if required
  - transaction/reservation state update
- Identify the exact failure point instead of patching the symptom.

Likely root-cause areas:

- client sends wrong ride id or payload shape
- booking endpoint contract mismatch between web/mobile and backend
- reservation requires wallet state that the client is not providing
- backend rejects duplicate/self/invalid bookings
- success response is returned but client state handling discards it

Acceptance criteria:

- Reservation succeeds from web.
- Reservation succeeds from mobile.
- The created booking is visible in relevant user flows.
- The user sees a stable success state after reserving.

## 4. Reservation Must Be Tied To Payment Reservation Logic

Current behavior:

- The user reported that reserve/pay action is broken.
- Previous reports also stated booking could proceed without proper balance checks.

Expected behavior:

- Reservation requires payment authorization or mocked funds hold behavior.
- Booking should not succeed if the user lacks sufficient passenger balance.
- Reservation transaction should appear in wallet history as a hold/reserved amount.
- Final payout can remain mocked, but the reservation state must exist correctly.

Implementation notes:

- Keep provider/payment processing mocked if needed.
- Do not keep booking logic fake.
- The state machine must still exist:
  - reserve funds
  - booking created
  - later capture/release logic placeholder

## 5. Maps Are Bugged In Web And Mobile

Current behavior:

- Maps are reported as bugged in both web and mobile.
- Prior context also mentioned provider instability around Google Maps and fallback behavior.

Expected behavior:

- Web ride detail map should render correctly and consistently.
- Mobile ride detail map should render correctly and consistently.
- Route visualization should match the ride route without noisy errors or broken tiles.

Implementation notes:

- Re-check current Google Maps integration in frontend and mobile.
- Confirm environment keys/config are actually present in the deployed/frontend runtime and mobile runtime.
- Ensure fallback behavior exists but does not hijack the normal happy path.
- If web uses a fallback renderer, it should only activate on real provider failure.

Required outcome:

- Another agent should document the exact map failure cause while fixing it:
  - provider config
  - key restriction issue
  - route data issue
  - rendering lifecycle issue

## 6. Full Car Logic Must Exist In Mobile

Required additions:

- Add car management in mobile for drivers.
- Driver must be able to add a car.
- Driver must be able to edit a car.
- Car document uploading should exist as a mock flow for now.

Expected fields/behavior:

- Car brand/model
- plate number
- color
- seat count / available seats basis
- document upload UI and storage flow placeholder

Notes:

- If backend already has car entities, use them.
- If backend does not fully support this yet, mobile should still structure itself toward the real model rather than pure local fake widgets.

## 7. Passenger Must Be Able To Select Places/Seats

Required additions:

- Passenger reservation flow in mobile must include place/seat selection.

Expected behavior:

- Available seats should come from ride/car capacity.
- Passenger chooses seat/place count or seat assignment according to the current product model.
- Full car logic must prevent overbooking.

Open implementation choice:

- If the current backend only supports seat count, use seat count.
- If there is already a seat-map concept, mobile should follow it.

## 8. Ride Should Not Start When Opening Ride Page

Current behavior:

- The current ride starts the second the ride page is opened.

Expected behavior:

- Opening the page must be a passive detail view.
- Ride should only start when the driver explicitly presses `Start ride`.

Implementation notes:

- Look for any lifecycle-triggered state mutation in ride detail/init logic.
- Remove auto-start side effects from page load or stream subscription setup.

## 9. Driver And Passenger Ride Screens Must Be Different

Current behavior:

- Ride pages are the same for driver and passenger.
- Current screen is effectively passenger-oriented and includes controls that do not belong in the driver experience.

Expected behavior:

- Passenger ride detail screen:
  - booking/reserve actions
  - passenger-appropriate status/actions
  - no driver-only control surface
- Driver ride detail screen:
  - ride management actions
  - `Start ride` button
  - no passenger SOS/reservation-oriented controls

Implementation notes:

- Split the screen at route level or conditional composition level.
- Avoid scattering role checks across a single giant widget if the screen is already hard to maintain.

## 10. Chats, Reservations, And Ride State Need To Exist Cohesively

Requirement:

- These ride-related behaviors can still be partly mocked internally, but they must exist as a coherent system:
  - reservation exists
  - driver can see it
  - passenger can chat with driver
  - ride state transitions exist
  - wallet/reserved funds state exists

This means:

- no fake support chat substitute for driver chat
- no auto-started ride state
- no reservation flow that pretends to pay but creates nothing

## Backend Alignment Checklist

Another agent implementing this should verify all of the following before changing UI behavior:

- mobile and web point to the same backend base URL/environment
- reservation endpoints are identical across clients
- auth headers are attached on booking/chat/wallet requests
- ride detail uses real backend ride ids
- chat lookup/creation uses real backend user ids
- wallet balance is loaded before booking
- seat availability is derived from real ride/car data
- driver ride actions are not exposed to passengers

## Suggested Implementation Order

1. Reproduce reservation failure in backend logs and client logs.
2. Fix backend/client contract mismatch for booking creation.
3. Fix mobile chat list error.
4. Fix ride-detail chat button to target driver conversation.
5. Stabilize web and mobile maps.
6. Stop ride auto-start on detail open.
7. Split driver/passenger ride detail screens.
8. Add mobile car add/edit flow and mock document upload.
9. Add passenger seat/place selection and full-car booking checks.

## Done Criteria

The work should only be considered complete when all of the following are true:

- Mobile chats page loads without error.
- Ride-detail chat button opens the driver's chat, not support.
- Chat header shows driver name, surname, and hardcoded online status.
- Reservation succeeds in web.
- Reservation succeeds in mobile.
- Reservation enforces balance/hold behavior consistently.
- Wallet shows reservation-related transaction state.
- Maps work in both web and mobile.
- Opening a ride page does not start the ride.
- Driver and passenger ride detail screens are different.
- Driver can start a ride explicitly.
- Mobile includes car add/edit flow.
- Mobile includes seat/place selection for passengers.
- Overbooking/full-car logic is enforced in mobile flow.

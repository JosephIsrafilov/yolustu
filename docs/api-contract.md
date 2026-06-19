# API Kontraktı — Yolmates

Bu sənəd sistemin backend API endpointlərinin real strukturunu, sorğu və cavab formalarını (request/response models) təsvir edir. Bütün endpointlər `/api/v1` prefiksi altındadır.

---

## 1. Authentication (Autentifikasiya)

### POST /api/v1/auth/request-otp

Purpose: generate and store OTP for phone verification.

Query parameters:
- `phone` (string)

Response (200):
```json
{
  "message": "OTP sent successfully",
  "phone": "+994501234567"
}
```

---

### POST /api/v1/auth/verify-otp

Purpose: verify OTP and mark existing user as verified.

Query parameters:
- `phone` (string)
- `otp` (string, 6 digits)

Response (200):
```json
{
  "message": "Account verified successfully"
}
```

Error notes:
- invalid/expired OTP -> `400`
- user not found -> `404`

---

### POST /api/v1/auth/register

Purpose: create user account and immediately create auth session.

Request body:
```json
{
  "phone": "+994501234567",
  "first_name": "Elvin",
  "last_name": "Mammadov",
  "password": "securepass123",
  "avatar_url": null,
  "language": "az",
  "role": "passenger",
  "city": "Baku",
  "bio": "Yeni istifadeci"
}
```

Response (200):
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "phone": "+994501234567",
    "first_name": "Elvin",
    "last_name": "Mammadov",
    "role": "passenger",
    "is_verified": false,
    "verification_status": "none",
    "created_at": "2026-05-23T10:00:00Z"
  }
}
```

---

### POST /api/v1/auth/login

Purpose: authenticate existing user by phone/password and return auth session.

Request body:
```json
{
  "phone": "+994501234567",
  "password": "securepass123"
}
```

Response (200):
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "phone": "+994501234567",
    "first_name": "Elvin",
    "last_name": "Mammadov",
    "role": "passenger",
    "is_verified": true,
    "verification_status": "verified",
    "created_at": "2026-05-23T10:00:00Z"
  }
}
```

---

### POST /api/v1/auth/refresh

Purpose: rotate refresh token and return a new auth session.

Request source:
- `refresh_token` HttpOnly cookie (set by login/register/refresh).
- If cookie is missing, backend returns `401` (`Refresh token missing`).

Response (200):
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "phone": "+994501234567",
    "first_name": "Elvin",
    "last_name": "Mammadov",
    "is_verified": true,
    "verification_status": "none",
    "created_at": "2026-05-23T10:00:00Z"
  }
}
```

---
## 2. Users & Profile (İstifadəçi Profilləri)

### GET /api/v1/users/me

**Məqsəd:** Cari giriş etmiş istifadəçinin profil məlumatlarını gətirir.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** [İstifadəçi Obyekti]

---

### PUT /api/v1/users/me

**Məqsəd:** Cari istifadəçinin məlumatlarını yeniləyir.

**Request Body (bütün sahələr optionaldır):**
```json
{
  "first_name": "Tural",
  "last_name": "İsgəndərov",
  "city": "Sumqayıt",
  "bio": "Yenilənmiş bioqrafiya"
}
```

**Response (200):** Yenilənmiş [İstifadəçi Obyekti]

---

### POST /api/v1/users/me/verify

**Məqsəd:** Sürücü sənədini (vəsiqəsini) serverə yükləyir və verifikasiya statusunu `pending` edir.

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (UploadFile) — Sənədin şəkli/faylı

**Response (200):**
```json
{
  "id": "7a26f04c-83b3-4f27-8025-01e4a3b7c02b",
  "phone": "+994501234567",
  "first_name": "Elvin",
  "last_name": "Məmmədov",
  "is_verified": false,
  "verification_status": "pending",
  "document_url": "/uploads/unique_filename.jpg",
  "created_at": "2026-05-21T20:00:00Z"
}
```

---

## 3. Rides & Vehicles (Gedişlər və Nəqliyyat)

### POST /api/v1/rides/

**Məqsəd:** Sürücü tərəfindən yeni gediş elan edilməsi.

**Request Body:**
```json
{
  "vehicle_id": "8b0821fb-0fe2-4be7-ba48-910bb97b25ad",
  "origin_lat": 40.4093,
  "origin_lon": 49.8671,
  "origin_city": "Bakı",
  "destination_lat": 40.6828,
  "destination_lon": 46.3606,
  "destination_city": "Gəncə",
  "intermediate_cities": "Kürdəmir, Yevlax",
  "departure_time": "2026-05-22T08:00:00Z",
  "total_seats": 3,
  "price_per_seat": 15.0,
  "description": "Prius ilə rahat səfər. AC var.",
  "smoking_allowed": false,
  "pets_allowed": true,
  "music_allowed": true,
  "female_only": false
}
```

**Response (200):**
```json
{
  "id": "c138d21a-ef1a-4712-9c3f-c6ef8481eb08",
  "driver_id": "7a26f04c-83b3-4f27-8025-01e4a3b7c02b",
  "vehicle_id": "8b0821fb-0fe2-4be7-ba48-910bb97b25ad",
  "origin_city": "Bakı",
  "destination_city": "Gəncə",
  "departure_time": "2026-05-22T08:00:00Z",
  "available_seats": 3,
  "price_per_seat": 15.0,
  "status": "active"
}
```

---

### GET /api/v1/rides/search

**Məqsəd:** Koordinatlar və ya şəhər adı ilə gedişlərin PostGIS vasitəsilə axtarılması.

**Query Parameters:**
- `origin_lat`, `origin_lon` (float) — Başlanğıc nöqtənin koordinatları
- `dest_lat`, `dest_lon` (float) — Son nöqtənin koordinatları
- `origin_city`, `dest_city` (str) — Şəhər adları
- `departure_date` (date) — Səfər tarixi (`YYYY-MM-DD`)
- `min_seats` (int, default 1) — Minimum tələb olunan yer
- `radius_meters` (float, default 10000) — Axtarış radiusu

**Smoke test example (geo):**
`GET /api/v1/rides/search?min_seats=1&origin_lat=40.4093&origin_lon=49.8671&dest_lat=40.6828&dest_lon=46.3606`

**Response (200):** [Gediş Obyektlərinin siyahısı]

---

### PATCH /api/v1/rides/{ride_id}/cancel

**Məqsəd:** Sürücü tərəfindən gedişin ləğv edilməsi.

**Response (200):**
```json
{
  "id": "c138d21a-ef1a-4712-9c3f-c6ef8481eb08",
  "status": "cancelled"
}
```

---

### Vehicle lifecycle

All vehicle endpoints require authentication.

- `POST /api/v1/vehicles` creates an active vehicle. The owner's first active
  vehicle becomes the default.
- `GET /api/v1/vehicles/my` returns active and inactive owned vehicles with
  `is_active`, `is_default`, and `normalized_plate`.
- `GET /api/v1/vehicles/{vehicle_id}` is restricted to the owner or an admin.
- `PATCH /api/v1/vehicles/{vehicle_id}` is preferred for partial updates.
  `PUT` remains supported with the same partial-update behavior.
- `POST /api/v1/vehicles/{vehicle_id}/set-default` selects an active default.
- `DELETE /api/v1/vehicles/{vehicle_id}` deactivates the vehicle. It returns
  `409` while active or future rides reference it. If it was the default, the
  oldest remaining active vehicle becomes default.

Vehicle responses include:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "brand": "Toyota",
  "model": "Prius",
  "year": 2022,
  "color": "White",
  "plate_number": "99-AB-123",
  "normalized_plate": "99AB123",
  "seats_count": 4,
  "variations": null,
  "is_active": true,
  "is_default": true,
  "created_at": "2026-06-19T20:00:00Z"
}
```

Plate comparison ignores case and non-alphanumeric separators. Active plates
are globally unique. Capacity is 1 through 4; API model years are 1886 through
next year.

Ride creation requires an explicit `vehicle_id`. It must identify an active
vehicle owned by the authenticated driver, and `total_seats` cannot exceed
that vehicle's `seats_count`. Placeholder vehicles are not created.

---

## 4. Bookings & Payments (Rezervasiya və Ödənişlər)

### POST /api/v1/bookings/

**Məqsəd:** Sərnişin tərəfindən gedişdə yer rezerv etmək üçün müraciət göndərilməsi. Ödəniş ayrıca `/api/v1/payments/create` endpoint-i ilə başlanır.

**Request Body:**
```json
{
  "ride_id": "c138d21a-ef1a-4712-9c3f-c6ef8481eb08",
  "seats_booked": 1
}
```

**Response (200):**
```json
{
  "id": "d50a232f-bc3f-4e0a-b28e-5b12ee9c7821",
  "ride_id": "c138d21a-ef1a-4712-9c3f-c6ef8481eb08",
  "passenger_id": "e81d774a-1a22-491c-99d8-910ee2ba8e22",
  "seats_booked": 1,
  "total_price": 15.0,
  "status": "pending"
}
```

---

### POST /api/v1/payments/create

**Məqsəd:** Mövcud booking üçün payment yaradır və aktiv `pending` payment varsa onu qaytarır.

**Request Body:**
```json
{
  "booking_id": "d50a232f-bc3f-4e0a-b28e-5b12ee9c7821"
}
```

**Response (200):**
```json
{
  "payment_id": "4adf6e5d-7d87-4b6e-a1f6-13b4f688f6ae",
  "booking_id": "d50a232f-bc3f-4e0a-b28e-5b12ee9c7821",
  "amount": 15.0,
  "service_fee": 1.5,
  "driver_amount": 13.5,
  "currency": "AZN",
  "provider": "mock",
  "status": "pending",
  "checkout_url": "http://localhost:3000/mock-payments/4adf6e5d-7d87-4b6e-a1f6-13b4f688f6ae",
  "transaction_id": "mock_4adf6e5d7d874b6ea1f613b4f688f6ae"
}
```

---

### POST /api/v1/payments/webhook/{provider}

**Məqsəd:** Provider webhook/callback qəbulu. Uğurlu ödənişdən sonra payment `succeeded`, booking isə `paid` olur; təkrar webhook balansı və ledger-i dublikat etmir.

---

## 5. WebSockets & Chat (Canlı Çat və Bildirişlər)

### WebSocket /api/v1/messages/ws/{ride_id}

**Məqsəd:** Gediş üzrə sürücü və təsdiqlənmiş sərnişinlər arasında real-time mesajlaşma.

---

## 6. AI Smart Pricing (NVIDIA NIM İİ Qiymət Hesablanması)

### POST /api/v1/ai/pricing-suggestion

**Məqsəd:** NVIDIA NIM (LLaMA-3.1) modelindən istifadə etməklə təklif olunan gediş qiymətinin və əsaslandırmasının gətirilməsi.

**Request Body:**
```json
{
  "origin": "Bakı",
  "destination": "Gəncə",
  "departure_time": "Friday 18:00"
}
```

**Response (200):**
```json
{
  "suggested_price": 18.0,
  "reasoning": "Cümə günü axşam saatlarında Bakıdan Gəncəyə tələbat çox olduğu üçün qiymətin bir qədər yüksək (18 AZN) təyin edilməsi tövsiyə olunur."
}
```

---

## 7. Contract Alignment (2026-05-23)

This section reflects the effective frontend/backend contract used by the current web app.

### POST /api/v1/auth/refresh

Request source:
- `refresh_token` HttpOnly cookie.

Response body:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "phone": "+994501234567",
    "first_name": "Elvin",
    "last_name": "Mammadov",
    "is_blocked": false,
    "is_verified": true,
    "verification_status": "none",
    "rating": 4.8,
    "total_rides": 12,
    "created_at": "2026-05-23T10:00:00Z"
  }
}
```

### BookingStatus enum

Unified booking statuses used by frontend and backend:

```text
pending | accepted | paid | rejected | cancelled | completed
```

Notes:
- `paid` is set after successful payment webhook processing.
- `accepted` remains the pre-payment confirmed-by-driver status.

### Ride/Trip response DTO used by frontend mapper

Backend ride response fields used by frontend:

```json
{
  "id": "uuid",
  "driver_id": "uuid",
  "origin_city": "Baku",
  "destination_city": "Ganja",
  "departure_time": "2026-05-23T15:30:00Z",
  "total_seats": 4,
  "available_seats": 3,
  "price_per_seat": 15,
  "status": "active",
  "meeting_point": "optional string",
  "dropoff_point": "optional string",
  "origin_location": { "lat": 40.4093, "lon": 49.8671 },
  "destination_location": { "lat": 40.6828, "lon": 46.3606 },
  "vehicle": {},
  "driver": {}
}
```

Frontend mapping rule:
- `meetingPoint = meeting_point || origin_city`
- `dropoffPoint = dropoff_point || destination_city`

### Auth session response (register/login)

Both endpoints return the same session envelope:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Response body:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "phone": "+994501234567",
    "first_name": "Elvin",
    "last_name": "Mammadov",
    "role": "passenger",
    "is_verified": false,
    "verification_status": "none",
    "created_at": "2026-05-23T10:00:00Z"
  }
}
```

---

## 8. Sprint 2 API-Mode Contract (Trips/Search/Bookings)

This is the effective contract used by the current frontend.

### Trips endpoints

- `GET /api/v1/rides/search`
  - Query: `origin_city`, `dest_city`, `departure_date`, `min_seats`
- `GET /api/v1/rides/{id}`
- `POST /api/v1/rides/`
- `GET /api/v1/rides/my`
- `PATCH /api/v1/rides/{id}/cancel`
- `PATCH /api/v1/rides/{id}/complete`

Create ride request body:

```json
{
  "departure_time": "2026-05-24T10:30:00",
  "total_seats": 3,
  "available_seats": 3,
  "price_per_seat": 15,
  "origin_city": "Baku",
  "destination_city": "Ganja",
  "vehicle_id": "uuid",
  "origin": { "lat": 40.4, "lon": 49.8 },
  "destination": { "lat": 40.7, "lon": 46.3 },
  "car_model": "Toyota Prius",
  "description": "No smoking"
}
```

### Bookings endpoints

- `POST /api/v1/bookings/`
- `GET /api/v1/bookings/my`
- `GET /api/v1/bookings/requests`
- `POST /api/v1/bookings/{id}/confirm`
- `POST /api/v1/bookings/{id}/reject`
- `POST /api/v1/bookings/{id}/cancel`

Create booking request body:

```json
{
  "ride_id": "uuid",
  "seats_booked": 2,
  "selected_spots": ["front_right", "back_left"]
}
```

Canonical seat identifiers for the four-seat MVP:

```text
front_right | back_left | back_middle | back_right
```

`selected_spots` is optional for backward compatibility. Count-only clients
receive deterministic automatic allocation. When supplied, its length must
equal `seats_booked`. A seat lost to a concurrent booking returns HTTP `409`.

Ride responses expose `available_spots`; booking responses expose
`selected_spots`.

### Status lifecycle

Booking statuses:

```text
pending -> accepted -> paid -> boarded -> completed
pending -> rejected
pending/accepted/paid -> cancelled
pending/accepted -> expired
paid -> no_show
```

Trip statuses:

```text
active -> cancelled
active -> completed
```

### Seat accounting rules

- Creating a `pending` booking atomically holds exact seats for 15 minutes.
- Driver confirmation changes the booking to `accepted` and starts the payment deadline.
- Rejection, cancellation, expiry, and refund release the exact held seats.
- `ride_seats` and `booking_seats` are authoritative; count/JSON fields remain compatibility projections.
- Wallet funds are not held at booking creation. They are debited only when wallet payment succeeds.
- Late payment callbacks cannot revive rejected, cancelled, or expired bookings.
- Passenger cannot book own ride.
- Duplicate active booking for same passenger+ride is forbidden.

---

## 9. Payment and Wallet Contract (2026-06-09)

The current payment flow is booking-first and wallet-backed:

```text
passenger creates booking -> pending
driver confirms booking -> accepted
passenger creates payment -> payment pending
mock/provider success -> payment succeeded, booking paid, wallet ledger posted
driver completes ride -> driver pending earning becomes available
refund -> payment refunded, booking cancelled, ledger reversal posted
```

Payment statuses:

```text
pending | succeeded | failed | cancelled | refunded
```

Wallet transaction types:

```text
passenger_payment | platform_fee | driver_pending_earning | driver_available_earning | refund | payout | adjustment
```

### POST /api/v1/payments/create

Request:

```json
{
  "booking_id": "uuid"
}
```

Response:

```json
{
  "payment_id": "uuid",
  "booking_id": "uuid",
  "amount": "25.00",
  "service_fee": "2.50",
  "driver_amount": "22.50",
  "currency": "AZN",
  "provider": "mock",
  "status": "pending",
  "checkout_url": "http://localhost:3000/bookings?mock_payment=...",
  "transaction_id": "mock_tx_..."
}
```

Rules:
- Only the booking passenger can create payment.
- Booking must be `accepted`.
- Own ride, rejected/cancelled booking, and already paid booking are rejected.
- Existing pending payment for the same booking is returned instead of creating a duplicate.

### GET /api/v1/payments/{payment_id}

Returns payment details. Accessible to passenger, driver, or admin.

### POST /api/v1/payments/mock/{payment_id}/succeed

Development/mock flow endpoint. Marks payment `succeeded`, booking `paid`, and creates idempotent ledger entries:

- passenger `passenger_payment` debit
- driver `driver_pending_earning` credit
- driver-visible `platform_fee` debit ledger record

### POST /api/v1/payments/mock/{payment_id}/fail

Marks pending mock payment as `failed`.

### POST /api/v1/payments/webhook/{provider}

Processes provider webhook. `mock` accepts JSON payload:

```json
{
  "transaction_id": "mock_tx_...",
  "status": "succeeded"
}
```

Webhook processing is idempotent by payment status and ledger idempotency keys.

### POST /api/v1/payments/{payment_id}/refund

Admin-only refund endpoint for `succeeded` payments. It marks payment `refunded`, cancels the booking, restores seats when the ride is not completed, credits passenger refund ledger, and reverses driver pending earning.

### GET /api/v1/wallet/me

Returns current user's balance:

```json
{
  "user_id": "uuid",
  "available_balance": "0.00",
  "pending_balance": "22.50",
  "currency": "AZN",
  "total_earned": "0.00",
  "total_spent": "25.00",
  "total_refunded": "0.00"
}
```

### GET /api/v1/wallet/me/transactions

Query: `page`, `limit`.

Returns paginated ledger history. Balances must only change through `wallet_transactions`; direct numeric balance changes without a ledger entry are invalid.

## Chats

Conversation chat replaces shared ride chat for new flows.

### Data model

- `Conversation`: `type` is `ride` or `support`; ride chats are scoped by `booking_id`.
- `ConversationParticipant`: unique `(conversation_id, user_id)`.
- `Message`: uses `conversation_id`; legacy `ride_id` remains nullable for backward compatibility.

### GET /api/v1/chats

Returns conversations visible to the current user. Admin users see all support conversations and their own participant conversations.

### POST /api/v1/chats/support

Returns the current user's open support conversation or creates one.

### POST /api/v1/chats/ride

Request:

```json
{
  "booking_id": "uuid"
}
```

Returns an existing or new passenger-driver conversation for that booking.

Access:
- passenger must own the booking;
- driver must own the ride for that booking;
- other users are rejected.

### GET /api/v1/chats/{conversation_id}

Returns a single authorized conversation.

### GET /api/v1/chats/{conversation_id}/messages

Query: `limit` up to 100, optional `before` datetime.

### POST /api/v1/chats/{conversation_id}/messages

Request:

```json
{
  "content": "Message text"
}
```

`content` must be non-empty and no longer than 2000 characters.

### PATCH /api/v1/chats/{conversation_id}/read

Marks messages from other participants as read for the current user.

### WebSocket /api/v1/chats/ws/{conversation_id}

Authenticated users can subscribe only to conversations they can access. Broadcast scope is `conversation_id`.

### Limitations

- No attachments.
- Admin users act as support agents for MVP.
- Existing `/api/v1/messages/*` ride chat endpoints remain for backward compatibility.

---

## 10. Vehicle Document Verification Contract (2026-06-19)

### Vehicle document statuses

```text
pending | approved | rejected
```

### Document types (all three required before a vehicle can create rides)

```text
registration | insurance | inspection
```

### Vehicle verification statuses

```text
none | pending | approved | rejected
```

`sync_vehicle_verification_status()` rule:
- all three current docs `approved` → vehicle `approved`
- any current doc `rejected` → vehicle `rejected`
- otherwise → vehicle `pending`

### POST /api/v1/vehicles/{vehicle_id}/documents?document_type=...

Upload a document for a vehicle. Authenticated driver only (must own vehicle).

- `document_type`: `registration` | `insurance` | `inspection`
- Body: `multipart/form-data` with field `file` (JPEG/PNG/PDF, max 10MB)
- Retires previous current doc of same type (`is_current=false`)
- SHA256 stored; AI pre-screen triggered in background for images

Response (201): `VehicleDocumentResponse`

```json
{
  "id": "uuid",
  "vehicle_id": "uuid",
  "document_type": "registration",
  "mime_type": "image/jpeg",
  "size_bytes": 204800,
  "sha256": "abc123...",
  "status": "pending",
  "processing_status": "pending",
  "expires_at": null,
  "ai_recommendation": null,
  "ai_confidence": null,
  "ai_issues": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "rejection_reason": null,
  "version": 1,
  "is_current": true,
  "created_at": "2026-06-19T10:00:00Z"
}
```

### GET /api/v1/vehicles/{vehicle_id}/documents

Returns list of current documents for the vehicle. Driver must own vehicle.

### GET /api/v1/vehicles/{vehicle_id}/verification

Returns verification status summary.

```json
{
  "vehicle_id": "uuid",
  "verification_status": "pending",
  "required_documents": ["registration", "insurance", "inspection"],
  "submitted": {
    "registration": { ...VehicleDocumentResponse }
  },
  "missing": ["insurance", "inspection"],
  "all_approved": false
}
```

### GET /api/v1/admin/vehicle-documents

Admin only. Returns paginated pending documents.

Query: `page`, `limit`

### GET /api/v1/admin/vehicle-documents/{id}

Admin only. Returns single document.

### GET /api/v1/admin/vehicle-documents/{id}/content

Admin only. Streams the raw file content with correct `Content-Type`.

### PATCH /api/v1/admin/vehicle-documents/{id}/decision

Admin only. Approve or reject a document.

Request:
```json
{
  "decision": "approved",
  "reason": null,
  "expected_version": 1
}
```

- `decision`: `approved` | `rejected`
- `reason`: required text when rejecting (optional string, stored as `rejection_reason`)
- `expected_version`: optimistic lock — returns `409` if `doc.version != expected_version`

On success: updates doc status, increments `version`, calls `sync_vehicle_verification_status()`, writes audit log with `resource_type=vehicle_document`.

### Ride creation enforcement

`POST /api/v1/rides/` returns `403` if `vehicle.verification_status != "approved"`.

### AI pre-screening

- NVIDIA VLM (`meta/llama-3.2-90b-vision-instruct`) runs as a background task after upload
- Advisory only — never auto-approves
- Degrades gracefully to `needs_review` on API unavailable or unsupported format (PDF)
- Result fields: `ai_recommendation` (`approve` | `needs_review` | `reject`), `ai_confidence` (0–1), `ai_issues` (string array)


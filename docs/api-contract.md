# API Kontraktı — Yolüstü

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

Request body:
```json
{
  "refreshToken": "string"
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

## 4. Bookings & Payments (Rezervasiya və Ödənişlər)

### POST /api/v1/bookings/

**Məqsəd:** Sərnişin tərəfindən gedişdə yer rezerv etmək üçün müraciət göndərilməsi. Həmçinin Stripe ödəmə sessiyasını yaradır.

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
  "booking": {
    "id": "d50a232f-bc3f-4e0a-b28e-5b12ee9c7821",
    "ride_id": "c138d21a-ef1a-4712-9c3f-c6ef8481eb08",
    "passenger_id": "e81d774a-1a22-491c-99d8-910ee2ba8e22",
    "seats_booked": 1,
    "total_price": 15.0,
    "status": "pending"
  },
  "stripe_session_id": "cs_test_a1b2c3d...",
  "stripe_session_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

### POST /api/v1/payments/webhook

**Məqsəd:** Stripe ödəmə statusunun dəyişməsi barədə bildirişlərin (webhooks) qəbulu. Uğurlu ödənişdən sonra müvafiq Booking `confirmed` statusuna keçir, gedişdəki yer sayı azaldılır.

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

This section reflects the effective frontend/backend contract used in `NEXT_PUBLIC_DATA_MODE=api`.

### POST /api/v1/auth/refresh

Request body:
```json
{
  "refreshToken": "string"
}
```

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

In API mode, both endpoints return the same session envelope:

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

This is the effective contract used by frontend when `NEXT_PUBLIC_DATA_MODE=api`.

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
  "seats_booked": 1
}
```

### Status lifecycle

Booking statuses:

```text
pending -> accepted -> paid
pending -> rejected
pending/accepted/paid -> cancelled
accepted/paid -> completed (later flow)
```

Trip statuses:

```text
active -> cancelled
active -> completed
```

### Seat accounting rules

- Creating `pending` booking does not decrement ride seats.
- Confirming booking decrements `available_seats`.
- Rejecting booking does not change seat counters.
- Cancelling `accepted`/`paid` booking restores seats (capped by `total_seats`) if ride is not completed.
- Confirm is forbidden when `available_seats < seats_booked`.
- Passenger cannot book own ride.
- Duplicate active booking for same passenger+ride is forbidden.

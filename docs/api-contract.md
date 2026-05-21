# API Kontraktı — Yolüstü

Bu sənəd sistemin backend API endpointlərinin real strukturunu, sorğu və cavab formalarını (request/response models) təsvir edir. Bütün endpointlər `/api/v1` prefiksi altındadır.

---

## 1. Authentication (Autentifikasiya)

### POST /api/v1/auth/request-otp

**Məqsəd:** İstifadəçinin telefon nömrəsinə OTP təsdiq kodu göndərilməsini simulyasiya edir və kodu Redis-də saxlayır (TTL 5 dəqiqə).

**Query Parameters:**
- `phone` (str) — Nömrə (məs. `+994501234567`)

**Response (200):**
```json
{
  "message": "OTP sent successfully (Simulated)",
  "otp": "123456"
}
```

---

### POST /api/v1/auth/verify-otp

**Məqsəd:** Daxil edilmiş OTP kodunu yoxlayır. Əgər nömrə qeydiyyatda yoxdursa, register etmək lazım olduğunu bildirir. Əgər nömrə varsa, birbaşa JWT tokenlərini qaytarır.

**Query Parameters:**
- `phone` (str) — Telefon nömrəsi
- `otp` (str) — 6 rəqəmli kod

**Response (200) - Qeydiyyatlı istifadəçi:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer"
}
```

**Response (200) - Yeni istifadəçi (Qeydiyyat lazımdır):**
```json
{
  "message": "OTP verified successfully. Registration required.",
  "phone": "+994501234567"
}
```

---

### POST /api/v1/auth/register

**Məqsəd:** OTP təsdiqindən sonra yeni istifadəçi yaradır və JWT tokenləri təqdim edir.

**Request Body:**
```json
{
  "phone": "+994501234567",
  "first_name": "Elvin",
  "last_name": "Məmmədov",
  "password": "securepass123",
  "avatar_url": null,
  "language": "az",
  "role": "passenger",
  "city": "Bakı",
  "bio": "Yeni istifadəçi"
}
```

**Response (200):**
```json
{
  "id": "7a26f04c-83b3-4f27-8025-01e4a3b7c02b",
  "phone": "+994501234567",
  "first_name": "Elvin",
  "last_name": "Məmmədov",
  "avatar_url": null,
  "language": "az",
  "role": "passenger",
  "city": "Bakı",
  "bio": "Yeni istifadəçi",
  "is_blocked": false,
  "is_verified": false,
  "verification_status": "none",
  "document_url": null,
  "rating": 0.0,
  "total_rides": 0,
  "created_at": "2026-05-21T20:00:00Z"
}
```

---

### POST /api/v1/auth/login

**Məqsəd:** Mövcud istifadəçinin telefon nömrəsi və şifrə ilə daxil olması.

**Request Body:**
```json
{
  "phone": "+994501234567",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer"
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

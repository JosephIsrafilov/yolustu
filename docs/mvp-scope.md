# MVP Scope — Yolüstü

## MVP-yə Daxil Olanlar

### Mobil-First Veb Tətbiqi (Next.js 16 + Zustand)
- Telefon nömrəsi ilə qeydiyyat və daxil olma.
- Simulyasiya edilmiş SMS OTP təsdiqi (Redis bazalı).
- Sürücü və Sərnişin rollarının bir profil daxilində idarə olunması.
- Gediş elan etmə forması (Addımlı sehrbaz / Multi-step form).
- İnteraktiv Leaflet Xəritəsi üzərində başlanğıc və son nöqtələrin kliklə seçilməsi.
- Seçilmiş koordinatların avtomatik olaraq "Meeting Point" və "Dropoff Point" sahələri ilə sinxronizasiyası.
- Gedişlərin PostGIS vasitəsilə axtarışı və filtrlənməsi (tarix, yer sayı, axtarış radiusu).
- Gedişin ətraflı məlumat səhifəsi, sürücü profili, avtomobil məlumatları və rəylər.
- Rezervasiya (Booking) və Stripe vasitəsilə ödəniş axını.
- Gözləyən (Pending), təsdiqlənmiş (Confirmed / Paid), rədd edilmiş (Rejected), ləğv edilmiş (Cancelled) və tamamlanmış (Completed) rezerv statusları.
- Hər gediş üzrə real-time WebSocket qrup çatı.
- Sürücü sənədinin yüklənilməsi və Admin Panel vasitəsilə sürücülük statusunun idarə edilməsi.
- Tamamlanmış gedişlər üzrə rəylər və reytinqlərin yazılması.

### Backend API (FastAPI + SQLAlchemy + PostgreSQL + Redis)
- Auth endpointləri (OTP sorğu, OTP yoxlanılması, login, register, refresh token).
- Profilin oxunması, yenilənməsi, sənədlərin yüklənilməsi.
- Rides CRUD və axtarış/süzgəc endpointləri (PostGIS).
- Bookings CRUD (yaradılması, təsdiqi, rəddi, ləğvi).
- Stripe Checkout sessiyalarının yaradılması və asinxron Stripe Webhooks idarəedilməsi.
- AI Smart Pricing (NVIDIA NIM LLaMA-3.1-8b-instruct) vasitəsilə marşrut və vaxta uyğun optimal qiymət məsləhətləri.
- WebSocket əlaqələri üçün FastAPI Lifespan idarəetməsi.

### Admin Panel
- Bütün istifadəçilərin siyahısı və onların bloklanması/blokdan çıxarılması.
- Sürücülük üçün yüklənmiş sənədlərin yoxlanılması və verifikasiya statusunun dəyişdirilməsi.
- Bütün gedişlərin və rezervasiyaların monitorinqi və moderasiyası.

---

## MVP-yə Daxil Olmayanlar (Gələcək Planlar)

| Xüsusiyyət | Səbəb |
|---|---|
| Avtobus/qatar bileti | MVP-də yalnız fərdi nəqliyyat vasitələrinə fokuslanırıq |
| GPS real-time izləmə | Mürəkkəblik əlavə edir, növbəti versiyalarda baxılacaq |
| Avtomatik məsafə/vaxt hesabı | Əlavə xarici API xərcləri |
| Dövlət Asan İmza inteqrasiyası| Real dövlət lisenziyaları və API icazələri tələb olunur |
| Avtomatik sərnişin sığortası | Sığorta şirkətləri ilə xüsusi müqavilələr tələb edir |

---

## Ödəniş Modeli

Ödəniş tam şəkildə Stripe sandboks (test rejimi) e-ticarət sistemi vasitəsilə inteqrasiya edilib. 
- Ödəniş zamanı sərnişin Stripe ödəniş səhifəsinə yönləndirilir.
- Uğurlu ödənişdən sonra Stripe backend-ə webhook göndərir və rezerv statusu `confirmed` (ödənildi) olaraq qeyd edilir, yerlər balansdan avtomatik silinir.

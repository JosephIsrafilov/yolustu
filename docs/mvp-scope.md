# MVP Scope — Yolüstü

## MVP-yə Daxil Olanlar

### Mobil Tətbiq
- Qeydiyyat
- Giriş
- Profil yaratma/redaktə
- Sürücü/Sərnişin rolu bir hesabda
- Gediş yaratma (multi-step)
- Gediş redaktə/ləğv etmə
- Gediş axtarışı
- Gediş filtrləmə
- Gediş detalları
- Rezerv sorğusu göndərmə
- Rezerv statusları
- Sərnişin rezervləri
- Sürücü rezerv sorğuları
- Rəy və reytinqlər
- Mobil naviqasiya

### Backend API
- Auth endpointləri (register, login)
- Users/Profile endpointləri
- Trips endpointləri (CRUD)
- Bookings endpointləri (create, accept, reject, cancel)
- Reviews endpointləri
- Admin endpointləri
- Verilənlər bazası sxemi

### Admin Panel
- İstifadəçiləri görmə
- Gedişləri görmə
- Rezervləri görmə
- Şübhəli istifadəçiləri bloklama
- Uyğunsuz gedişləri silmə
- Moderasiya panel

## MVP-yə Daxil Olmayanlar

| Xüsusiyyət | Səbəb |
|---|---|
| Online ödəniş | MVP-də ödəniş nağd və ya birbaşa razılaşma ilə olur |
| Avtobus/qatar bileti | Yalnız fərdi maşınlara fokuslanırıq |
| GPS izləmə | Mürəkkəblik əlavə edir |
| Xəritə inteqrasiyası | Sprint 0-da lazım deyil |
| Avtomatik məsafə/vaxt hesabı | Əlavə API xərcləri |
| Sürücü sənəd yoxlanışı | Real verifikasiya infrastrukturu lazımdır |
| Şikayət/mübahisə sistemi | MVP üçün çox mürəkkəb |
| Push bildirişlər | Real notification infrastrukturu lazımdır |

## Ödəniş Modeli

MVP-də ödəniş sistem xaricində baş verir:
- Nağd ödəniş sürücüyə
- Birbaşa razılaşma
- Real ödəniş inteqrasiyası yoxdur

## Verifikasiya

- Real sənəd verifikasiyası yoxdur
- Placeholder verifikasiya statusu UI göstərilə bilər
- Real verifikasiya logikası implementasiya edilmir

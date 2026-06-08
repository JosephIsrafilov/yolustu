# Acceptance Criteria — Yolmates MVP

## Əsas Qəbul Meyarları

### 1. Qeydiyyat və Giriş
- [x] İstifadəçi telefon nömrəsi ilə qeydiyyatdan keçə bilir
- [x] İstifadəçi SMS OTP və JWT tokenlər ilə təhlükəsiz daxil ola bilir
- [x] Giriş zamanı validasiya xətaları düzgün göstərilir
- [x] Uğurlu giriş və qeydiyyatdan sonra lazımi ekranlara yönləndirmə olur

### 2. Profil
- [x] Sürücü və sərnişin profili vahid Next.js profil səhifəsində idarə olunur
- [x] İstifadəçi profil məlumatlarını yeniləyə bilir (ad, soyad, şəhər, bio, sənəd yükləmə)
- [x] Profil səhifəsində orta rating ulduzları və ümumi tamamlanmış gediş sayı göstərilir
- [x] Şəhər seçimi işləyir və məlumatlar verilənlər bazasında saxlanılır

### 3. Gediş Yaratma (Trip Creation Wizard)
- [x] Sürücü 5 addımlı sehrbaz (multi-step form) vasitəsilə gediş yarada bilir
- [x] Qiymət təyin edərkən NVIDIA NIM (LLaMA-3.1) qiymət tövsiyələri alınır və avtomatik qiymət sahəsinə yazılır
- [x] Gedişin başlanğıc və son nöqtələri Leaflet map üzərinə klikləməklə seçilir və form sahələrinə ötürülür
- [x] Bütün tələb olunan sahələr backend (Pydantic) və frontend səviyyəsində validasiya olunur
- [x] Yer sayı 1-4 arası məhdudlaşdırılır və qiymətin müsbət olması yoxlanılır

### 4. Gediş Axtarışı
- [x] Sərnişin şəhər, tarix və PostGIS coğrafi koordinatları əsasında axtarış edə bilir
- [x] Yalnız aktiv statuslu gedişlər axtarışda çıxır
- [x] Tamamilə dolu olan gedişlər axtarış nəticəsində gizlədilir
- [x] Filtr düzgün işləyir (yer sayı və axtarış radiusu üzrə)
- [x] Axtarış nəticəsi boş olduqda müvafiq boş state (Empty State) mesajı göstərilir

### 5. Gediş Detalları
- [x] Gediş səhifəsində bütün detallar (marşrut, sürücü ratingi, avtomobil məlumatları, səyahət üstünlükləri) görünür
- [x] Sürücünün keçmiş rəyləri siyahı şəklində göstərilir
- [x] Rezervasiya et düyməsi klikləndikdə Stripe ödəniş axını başlanır

### 6. Rezerv Sorğusu və Stripe Ödənişi
- [x] Sərnişin yer sayı seçib Stripe Checkout vasitəsilə ödəniş edə bilir
- [x] İstifadəçi öz gedişinə rezervasiya sorğusu göndərə bilmir (xəta mesajı göstərilir)
- [x] Artıq rezerv edilmiş gediş üçün təkrarlanan sorğu göndərilmir
- [x] Uğurlu ödənişdən sonra Stripe Webhook vasitəsilə status avtomatik `confirmed` (paid) olaraq bazada yenilənir

### 7. Rezerv Qəbul/Rədd
- [x] Sürücü öz gedişlərinə gələn sorğuları qəbul edə bilir
- [x] Sürücü sorğuları rədd edə bilir
- [x] Qəbul edildikdə (ödənildikdə) rides mövcud boş yer sayı avtomatik azalır
- [x] Boş yer yoxdursa qəbul düyməsi deaktiv edilir

### 8. Rezerv Statusları
- [x] Pending, confirmed/paid, rejected, cancelled, completed statusları düzgün göstərilir
- [x] Statuslar müvafiq rənglərlə fərqləndirilir
- [x] Təsdiqlənmiş (confirmed) rezervasiya ləğv edildikdə gedişdəki yer sayı geri qaytarılır

### 9. Rəy və Reytinqlər
- [x] Rəy yalnız tamamlanmış (`completed`) statuslu gedişin sərnişinləri tərəfindən yazılır
- [x] Qiymətləndirmə üçün 1-5 ulduz seçimi təqdim olunur
- [x] Göndərilmiş qiymətləndirmə əsasında sürücünün orta reytinqi dərhal yenilənir

### 10. Admin Panel
- [x] Admin bütün istifadəçiləri siyahı şəklində görə bilir
- [x] Sürücülük sənədini yükləyən istifadəçilərin sənədlərinə baxıb verifikasiya edə bilir
- [x] Admin istifadəçiləri bloklaya və bloku aça bilir
- [x] Admin uyğunsuz gediş və rezervasiyaları silə/ləğv edə bilir
- [x] Əsas dashboard statistikaları (ümumi istifadəçi, gediş və booking sayı) düzgün göstərilir

### 11. Demo Ssenarisi
- [x] Demo ssenarisindəki bütün addımlar heç bir kritik xəta olmadan işləyir
- [x] Səhifələr və tablar arası keçidlər sürətlidir və state qorunur
- [x] Mobil və veb ölçülərdə elementlərin Leaflet xəritə tərəfindən örtülməsi problemi (z-index) tam aradan qaldırılıb

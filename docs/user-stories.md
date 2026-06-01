# User Stories — Yolmates

## US-01: İstifadəçi Qeydiyyatı

**Story:** Yeni istifadəçi olaraq, hesab yaratmaq istəyirəm ki, platforma xüsusiyyətlərindən istifadə edə bilim.

**Qəbul Meyarları:**
- [ ] İstifadəçi ad, email, telefon, şifrə daxil edə bilir
- [ ] Email formatı yoxlanılır
- [ ] Şifrə ən azı 6 simvol olmalıdır
- [ ] Şifrə təsdiqi uyğun olmalıdır
- [ ] Uğurlu qeydiyyatdan sonra profil qurulmasına yönləndirilir

**Prioritet:** Yüksək
**Ekranlar:** `/auth/register`, `/profile/setup`
**API:** `POST /api/auth/register/`

---

## US-02: İstifadəçi Girişi

**Story:** Mövcud istifadəçi olaraq, hesabıma daxil olmaq istəyirəm.

**Qəbul Meyarları:**
- [ ] İstifadəçi email və şifrə ilə daxil ola bilir
- [ ] Boş sahələr üçün xəta mesajı göstərilir
- [ ] Uğurlu girişdən sonra axtarış səhifəsinə yönləndirilir
- [ ] Yanlış məlumat üçün xəta göstərilir

**Prioritet:** Yüksək
**Ekranlar:** `/auth/login`
**API:** `POST /api/auth/login/`

---

## US-03: Profil Yaratma/Redaktə

**Story:** İstifadəçi olaraq, profilimi tamamlamaq və redaktə etmək istəyirəm.

**Qəbul Meyarları:**
- [ ] İstifadəçi ad, telefon, şəhər, bio daxil edə bilir
- [ ] Şəhər siyahısından seçilir
- [ ] Profil məlumatları yadda saxlanır
- [ ] Profil səhifəsində reytinq və gediş sayı görünür

**Prioritet:** Yüksək
**Ekranlar:** `/profile/setup`, `/profile`
**API:** `GET /api/profile/`, `PUT /api/profile/`

---

## US-04: Sürücü Gediş Yaradır

**Story:** Sürücü olaraq, gediş elan etmək istəyirəm ki, sərnişinlər tapa bilsin.

**Qəbul Meyarları:**
- [ ] Multi-step form: marşrut → tarix → yerlər → maşın → baxış
- [ ] Bütün tələb olunan sahələr validasiya olunur
- [ ] Yer sayı 1-4 arası olmalıdır
- [ ] Qiymət müsbət olmalıdır
- [ ] Gediş yaradıldıqdan sonra gedişlərim-ə yönləndirilir

**Prioritet:** Yüksək
**Ekranlar:** `/driver/create-trip`
**API:** `POST /api/trips/`

---

## US-05: Sürücü Gedişi Redaktə/Ləğv Edir

**Story:** Sürücü olaraq, öz gedişimi ləğv edə bilmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Sürücü yalnız öz gedişini ləğv edə bilir
- [ ] Ləğv edilmiş gediş artıq rezerv üçün açıq deyil
- [ ] Ləğv zamanı gözləyən/qəbul edilmiş rezervlər avtomatik ləğv olunur

**Prioritet:** Orta
**Ekranlar:** `/driver/my-trips`
**API:** `PATCH /api/trips/{id}/cancel/`

---

## US-06: Sərnişin Gediş Axtarır

**Story:** Sərnişin olaraq, mövcud gedişləri axtarmaq istəyirəm.

**Qəbul Meyarları:**
- [ ] Haradan/haraya/tarix ilə axtarış olunur
- [ ] Populyar marşrutlar göstərilir
- [ ] Yalnız aktiv və boş yeri olan gedişlər göstərilir
- [ ] Nəticə olmadıqda boş state göstərilir

**Prioritet:** Yüksək
**Ekranlar:** `/search`, `/trips`
**API:** `GET /api/trips/`

---

## US-07: Sərnişin Gediş Detallarını Görür

**Story:** Sərnişin olaraq, gediş haqqında ətraflı məlumat görmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Marşrut, görüş/eniş nöqtəsi, tarix, saat, qiymət görünür
- [ ] Sürücü profili və reytinqi görünür
- [ ] Maşın modeli görünür
- [ ] Sürücü rəyləri görünür
- [ ] Boş yer sayı görünür

**Prioritet:** Yüksək
**Ekranlar:** `/trips/[id]`
**API:** `GET /api/trips/{id}/`

---

## US-08: Sərnişin Rezerv Sorğusu Göndərir

**Story:** Sərnişin olaraq, gedişə rezerv sorğusu göndərmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Sərnişin yer sayı seçə bilir
- [ ] Sorğu göndərildikdə "pending" statusu ilə yaradılır
- [ ] İstifadəçi öz gedişinə rezerv edə bilmir (xəta mesajı)
- [ ] Artıq sorğu göndərilmişsə yenisi göndərilmir
- [ ] Göndərildikdən sonra rezervlər səhifəsinə yönləndirilir

**Prioritet:** Yüksək
**Ekranlar:** `/trips/[id]`
**API:** `POST /api/bookings/`

---

## US-09: Sürücü Sorğunu Qəbul/Rədd Edir

**Story:** Sürücü olaraq, gələn rezerv sorğularını qəbul və ya rədd etmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Gözləyən sorğular siyahı şəklində görünür
- [ ] Sərnişin məlumatları görünür
- [ ] Qəbul edildikdə boş yer sayı azalır
- [ ] Rədd edildikdə yer sayı dəyişmir
- [ ] Yer qalmayıbsa qəbul düyməsi deaktivdir

**Prioritet:** Yüksək
**Ekranlar:** `/bookings/requests`
**API:** `PATCH /api/bookings/{id}/accept/`, `PATCH /api/bookings/{id}/reject/`

---

## US-10: Sərnişin Rezervi Ləğv Edir

**Story:** Sərnişin olaraq, göndərdiyim və ya qəbul edilmiş rezervi ləğv edə bilmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Pending və ya accepted statuslu rezerv ləğv edilə bilir
- [ ] Qəbul edilmiş rezerv ləğv edildikdə boş yer sayı artır
- [ ] Ləğv edilmiş rezervin statusu "cancelled" olur

**Prioritet:** Orta
**Ekranlar:** `/bookings`
**API:** `PATCH /api/bookings/{id}/cancel/`

---

## US-11: İstifadəçi Rəy/Reytinq Yazır

**Story:** İstifadəçi olaraq, tamamlanmış gedişdən sonra rəy yazmaq istəyirəm.

**Qəbul Meyarları:**
- [ ] Yalnız tamamlanmış gediş üçün rəy yazıla bilir
- [ ] 1-5 ulduz reytinq seçilir
- [ ] İstəyə bağlı şərh yazılır
- [ ] Rəy göndərildikdə hədəf istifadəçinin orta reytinqi yenilənir

**Prioritet:** Orta
**Ekranlar:** `/reviews/create`
**API:** `POST /api/reviews/`

---

## US-12: Admin Moderasiya Edir

**Story:** Admin olaraq, istifadəçiləri və gedişləri moderasiya etmək istəyirəm.

**Qəbul Meyarları:**
- [ ] Admin bütün istifadəçiləri görə bilir
- [ ] Admin istifadəçini bloklaya/bloku aça bilir
- [ ] Admin bütün gedişləri görə bilir
- [ ] Admin uyğunsuz gedişi silə bilir
- [ ] Admin bütün rezervləri görə bilir
- [ ] Admin statistikaları görə bilir

**Prioritet:** Orta
**Ekranlar:** `/admin`, `/admin/users`, `/admin/trips`, `/admin/bookings`
**API:** `GET /api/admin/users/`, `PATCH /api/admin/users/{id}/block/`, `DELETE /api/admin/trips/{id}/`

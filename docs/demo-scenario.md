# Demo Scenario — Yolüstü

Bu ssenari diploma müdafiəsi və sprint review zamanı istifadə üçün nəzərdə tutulub.

---

## Demo Addımları

### 1. Tətbiqi Açın
- Brauzer: `http://localhost:3000`
- Onboarding ekranı göstərilir
- "Yolüstü" logosu, başlıq, faydalar görünür

### 2. Sürücü olaraq Qeydiyyat
- "Qeydiyyat" düyməsinə basın
- Form doldurun:
  - Ad: Tural İsgəndərov
  - Email: tural@example.com
  - Telefon: +994501112233
  - Şifrə: 123456
- "Qeydiyyatdan keç" basın

### 3. Sürücü Profilini Doldurun
- Profil qurulması səhifəsində:
  - Şəhər: Bakı
  - Bio: "Bakıdan Gəncəyə hər həftə gedirəm"
- "Yadda saxla" basın

### 4. Gediş Yaradın: Bakı → Gəncə
- Bottom nav-dan "Sür" seçin
- "Yeni gediş yarat" basın
- **Addım 1 (Marşrut):**
  - Haradan: Bakı
  - Haraya: Gəncə
  - Görüş: 28 May metro
  - Eniş: Gəncə avtovağzal
- **Addım 2 (Tarix):**
  - Tarix: yarınkı tarix
  - Saat: 08:00
- **Addım 3 (Yerlər):**
  - Yer sayı: 3
  - Qiymət: 15 ₼
- **Addım 4 (Maşın):**
  - Model: Toyota Prius
  - Qeyd: AC var, rahat maşın
- **Addım 5 (Baxış):**
  - Bütün məlumatları yoxlayın
  - "Gedişi dərc et" basın

### 5. Çıxış Edin
- Profil → "Çıxış" basın

### 6. Sərnişin olaraq Daxil Olun
- "Daxil ol" düyməsini basın
- Email: aysel@example.com
- Şifrə: istənilən
- "Daxil ol" basın

### 7. Gediş Axtarın: Bakı → Gəncə
- Axtarış ekranında:
  - Haradan: Bakı
  - Haraya: Gəncə
- "Axtar" basın

### 8. Gediş Detallarını Açın
- Siyahıdan yaradılmış gedişi tapın
- Kart üzərinə basın
- Marşrut, sürücü, qiymət, yerlər görünür

### 9. Rezerv Sorğusu Göndərin
- Yer sayı: 1
- "Rezerv sorğusu göndər" basın
- Təsdiq mesajı görünür

### 10. Sürücü olaraq Daxil Olun
- Çıxış edin
- Email: elvin@example.com (və ya yaradılan sürücü)
- Daxil olun

### 11. Rezerv Sorğularını Açın
- "Sür" → "Rezerv sorğuları"
- Aysel-in sorğusu görünür

### 12. Sorğunu Qəbul Edin
- "Qəbul et" basın
- Status "Qəbul edildi" olur

### 13. Boş Yerlərin Azaldığını Göstərin
- "Gedişlərim" açın
- Boş yer sayının azaldığını göstərin

### 14. Gedişi Tamamlayın
- Gedişi tapın
- "Tamamla" basın
- Status "Tamamlandı" olur

### 15. Sərnişin olaraq Rəy Yazın
- Aysel olaraq daxil olun
- "Rezervlər" → Keçmiş tab
- "Rəy yaz" basın
- 5 ulduz seçin
- Şərh: "Çox rahat gediş idi, təşəkkür!"
- "Rəy göndər" basın

### 16. Yenilənmiş Reytinqi Göstərin
- Sürücünün profilini açın
- Reytinqin yeniləndiyini göstərin

### 17. Admin Paneli
- sanan@example.com ilə daxil olun
- Profil → "Admin panel" basın
- **Dashboard:** statistikalar görünür
- **İstifadəçilər:** istifadəçi siyahısı, bloklama
- **Gedişlər:** gediş siyahısı, silmə
- **Rezervlər:** rezerv siyahısı, filtr

---

## Demo Qeydləri

- Bütün data in-memory saxlanılır (mock)
- Səhifəni yeniləyərkən state sıfırlanır
- Real backend Sprint 1-də əlavə olunacaq
- Ödəniş sistem xaricindədir (MVP)

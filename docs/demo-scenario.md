# Demo Ssenarisi — Yolüstü

Bu ssenari diplom müdafiəsi və sprint review zamanı real verilənlər bazası (PostgreSQL), Redis keş yaddaşı, Stripe ödənişləri və WebSocket real-time çatı ilə işləyən sistemi nümayiş etdirmək üçün nəzərdə tutulub.

---

## Demo Addımları

### 1. Tətbiqi Açın
- Brauzer: `http://localhost:3000`
- Əsas ana səhifə (landing page) göstərilir. Azərbaycan dilində dizayn, xidmətin təsviri və axtarış paneli görünür.

### 2. Sürücü olaraq Giriş / Qeydiyyat
- Giriş düyməsinə klikləyin.
- Telefon nömrəsini daxil edin (məs. `+994501112233`) və **"OTP Kodunu Göndər"** düyməsinə klikləyin.
- Sistem arxa fonda 6 rəqəmli OTP kodunu Redis yaddaşına yazır və simulyasiya edilmiş SMS cavabını brauzerə/loqlara qaytarır (məs. `123456`).
- OTP kodunu (`123456`) daxil edib təsdiqləyin.
- Əgər ilk dəfədirsə, Qeydiyyat forması açılacaq. Ad, Soyad daxil edib qeydiyyatı tamamlayın.
- Qeydiyyat tamamlandıqdan sonra sistem avtomatik olaraq JWT Access və Refresh tokenlərini generasiya edir.

### 3. Sürücü Profilini Doldurun və Maşın Əlavə Edin
- Profil səhifəsinə keçin.
- Yaşadığınız şəhəri seçin (məs. `Bakı`), bioqrafiyanı doldurun.
- **"Avtomobilim"** bölməsinə keçib markanı (`Toyota`), modeli (`Prius`), istehsal ilini (`2018`), rəngini (`Gümüşü`) və dövlət nömrə nişanını (`99-XX-999`) qeyd edin. Yadda saxlayın.

### 4. Gediş Yaradın: Bakı → Gəncə (Xəritə və İİ İnteqrasiyası ilə)
- Naviqasiyadan **"Sür" (Create Trip)** bölməsini seçin.
- **Addım 1 (Marşrut və Xəritə):**
  - Haradan: `Bakı`, Haraya: `Gəncə` seçin.
  - Ekranda **Leaflet interactive map** göstəriləcək.
  - Xəritə üzərində gedişin görüş nöqtəsini (Meeting Point) klikləyin. Koordinatlar qeyd olunacaq və avtomatik olaraq "Meeting Point" mətn qutusuna yazılacaq.
  - Eyni qaydada eniş nöqtəsini (Dropoff Point) də klikləyin, o da koordinatlarla "Dropoff Point" qutusuna yazılacaq.
- **Addım 2 (Tarix və Saat):**
  - Səyahət tarixini və vaxtını seçin (məs. sabah saat `08:00`).
- **Addım 3 (İİ Qiymət təklifi və Yer sayı):**
  - Boş yerlərin sayını təyin edin (`3`).
  - Qiymət daxil etmə hissəsində **"İİ köməkçisindən qiymət məsləhəti al"** düyməsinə klikləyin.
  - Sistem NVIDIA NIM (LLaMA-3.1) modelinə sorğu göndərəcək və bizə optimal qiyməti (məs. `15 AZN`) və səbəbini (məs. "Bakı-Gəncə marşrutunda həftəsonu tələbatın artması...") qaytaracaq. Qiymət avtomatik olaraq qutuya yazılacaq.
- **Addım 4 (Səfər üstünlükləri):**
  - Siqaret çəkmək olar (bəli/xeyr), ev heyvanı olar (bəli/xeyr), musiqiyə icazə (bəli/xeyr) seçimlərini edin. Avtomobili seçin.
- **Addım 5 (Preview & Dərc etmə):**
  - Məlumatların doğruluğunu yoxlayıb **"Gedişi Dərc Et"** düyməsini klikləyin.
  - Gediş verilənlər bazasına yazılır.

### 5. Sərnişin olaraq Sistemə daxil olun
- Sürücü hesabından çıxış edin.
- Sərnişin nömrəsi ilə daxil olun (məs. `+994552345678`) və OTP təsdiqini tamamlayın.

### 6. Gediş Axtarın və Rezerv edin
- Axtarış panelində Haradan: `Bakı`, Haraya: `Gəncə` seçin və Axtar düyməsinə klikləyin.
- PostGIS koordinat axtarışı sayəsində yenicə yaradılmış gediş siyahıda görünəcək.
- Gedişin üzərinə klikləyərək detalları açın.
- Yer sayını (`1`) seçib **"Забронировать и оплатить" (Rezerv et və Ödə)** düyməsinə klikləyin.

### 7. Stripe ilə Ödəniş edin
- Sistem sizi avtomatik olaraq **Stripe Sandbox Payment** səhifəsinə yönləndirəcək.
- Stripe test kartı məlumatlarını (`4242 4242 4242 4242`, tarix: gələcək, CVC: `123`) daxil edərək ödənişi təsdiqləyin.
- Uğurlu ödənişdən sonra Stripe webhook göndərəcək.
- Sistemdə rezerv statusu `confirmed` (paid) olacaq, gedişdəki mövcud yer 3-dən 2-yə düşəcək. Siz yenidən Yolüstü səhifəsinə qayıdacaqsınız.

### 8. WebSocket vasitəsilə Real-Time Çat
- Sərnişinin rezervləri səhifəsində həmin gediş üzrə **"Çata Keç"** düyməsi görünəcək.
- Çat pəncərəsini açın və mesaj yazın (məs. *"Salam, 28 May metrosunun hansı çıxışında görüşəcəyik?"*).
- Başqa bir brauzer pəncərəsində sürücü olaraq daxil olun. Sürücünün gediş çatı səhifəsinə keçin.
- Sərnişinin göndərdiyi mesajı heç bir səhifəni yeniləmədən dərhal ekranda görünəcək (WebSocket real-time).
- Sürücü cavab yazır (məs. *"Salam, metro çıxışındakı heykəlin yanında olacağam"*). Mesaj dərhal sərnişinin pəncərəsində əks olunur.

### 9. Gedişi Tamamlayın və Rəy Yazın
- Sürücü gediş detallarında **"Tamamla"** düyməsinə klikləyir. Gediş və rezervlər `completed` statusu alır.
- Sərnişin öz pəncərəsində tamamlanmış gedişə görə **"Rəy Yaz"** düyməsinə klikləyir.
- Reytinq olaraq `5 ulduz` və şərh yazaraq göndərir.
- Sürücünün profilini açdıqda reytinqin avtomatik olaraq hesablanıb yeniləndiyini nümayiş etdirin.

---

## Texniki Qeydlər

- Sistem artıq mock deyil, PostgreSQL, Redis, Stripe və WebSockets ilə tam inteqrasiyalıdır.
- Bütün tranzaksiyalar və data verilənlər bazasında saxlanılır, səhifə yenilənərkən məlumatlar itmir.

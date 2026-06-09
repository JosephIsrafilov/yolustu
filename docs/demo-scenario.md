# Historical note: this document is kept for project history. For current implementation status, use docs/PROJECT_STATE.md and docs/INDEX.md.
> Current status override: web auth now relies on cookie/session restore, and mobile scaffold exists. Use docs/PROJECT_STATE.md and docs/INDEX.md for current behavior.

# Demo Ssenarisi — Yolmates

Bu ssenari diplom müdafiəsi və sprint review zamanı real verilənlər bazası (PostgreSQL), Redis keş yaddaşı, mock/provider ödəniş axını və WebSocket real-time çatı ilə işləyən sistemi nümayiş etdirmək üçün nəzərdə tutulub.

---

## Demo Addımları

### 1. Tətbiqi Açın
- Brauzer: `http://localhost:3000`
- Əsas ana səhifə (landing page) göstərilir. Azərbaycan dilində dizayn, xidmətin təsviri və axtarış paneli görünür.

### 2. Surucu olaraq Qeydiyyat / Giris
- Register sehifesine kecin (`/auth/register`).
- Ad, telefon ve sifre daxil edin.
- `POST /api/v1/auth/register` cavabi olaraq `accessToken`, `refreshToken`, `user` qayidir.
- Frontend bu tokenleri `localStorage`-a (`token`, `refresh_token`) yazir ve sessiyani hemen aktiv edir.
- Qeydiyyatdan sonra profile setup sehifesine yonlendirilirsiniz.
- Isteye gore hesabin verifikasiyasi ucun `POST /api/v1/auth/request-otp` ve sonra `POST /api/v1/auth/verify-otp` istifade oluna biler.

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

### 5. Sernisin olaraq sisteme daxil olun
- Surucu hesabindan cixis edin.
- `/auth/login` sehifesinde telefon + sifre daxil edin.
- `POST /api/v1/auth/login` cavabi olaraq `accessToken`, `refreshToken`, `user` qayidir ve sessiya acilir.
- OTP bu login flow-da mecburi deyil; OTP endpointleri account verification ucundur.

### 6. Gediş Axtarın və Rezerv edin
- Axtarış panelində Haradan: `Bakı`, Haraya: `Gəncə` seçin və Axtar düyməsinə klikləyin.
- PostGIS koordinat axtarışı sayəsində yenicə yaradılmış gediş siyahıda görünəcək.
- Gedişin üzərinə klikləyərək detalları açın.
- Yer sayını (`1`) seçib **"Забронировать и оплатить" (Rezerv et və Ödə)** düyməsinə klikləyin.

### 7. Mock Checkout ilə Ödəniş edin
- Sistem sizi mock checkout ekranına və ya checkout URL-ə yönləndirəcək.
- Dev/test rejimində success action ilə ödənişi təsdiqləyin.
- Uğurlu ödənişdən sonra payment callback emalı işləyəcək.
- Sistemdə rezerv statusu `paid` olacaq, gedişdəki mövcud yer 3-dən 2-yə düşəcək və driver earning `pending balance`-da görünəcək.

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

- Sistem PostgreSQL, Redis, provider abstraction və WebSockets ilə inteqrasiyalıdır.
- Bütün tranzaksiyalar və data verilənlər bazasında saxlanılır, səhifə yenilənərkən məlumatlar itmir.

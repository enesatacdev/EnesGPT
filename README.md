# EnesGPT

EnesGPT, modern bir ChatGPT klonu olup, kullanıcıların yapay zekâ tabanlı sohbet deneyimini web ortamında güvenli şekilde yaşayabilmesi için geliştirilmiştir. Kayıt ve giriş işlemleri için **Clerk**, sohbet kayıtları için **MongoDB**, dosya yönetimi için **ImageKit** ve sohbet motoru olarak **Gemini** (Google) kullanılmıştır. Proje, yüksek performans için **Vite** ile hazırlanmış ve backend olarak **Express** + **Mongoose** kullanılmıştır.

---

## Özellikler

- **Yapay Zekâ Chat:** Google Gemini modeli ile gerçek zamanlı AI sohbet
- **Kullanıcı Girişi/Kayıt:** Clerk ile güvenli authentication
- **Sohbet Geçmişi:** Tüm sohbetler MongoDB’de saklanır
- **Dosya & Görsel Yönetimi:** ImageKit entegrasyonu
- **Hızlı & Modern:** Vite altyapısı, responsive ve sade arayüz
- **Güncel Kod Yapısı:** React + Express + Mongoose + Vite
- **Kolay kurulum, açık kaynak**

---

## Ekran Görüntüsü

<!-- Buraya kendi ekran görüntünü ekle:
![Ekran Görüntüsü](./docs/screenshot.png)
-->

---

## Kurulum

### Gereksinimler

- Node.js (18+ önerilir)
- MongoDB veritabanı (bulut veya local)
- Gemini API anahtarı (Google Cloud’dan alınmalı)
- ImageKit hesabı ve API bilgileri
- Clerk hesabı ve API anahtarları

### 1. Depoyu klonla

```bash
git clone https://github.com/kullaniciadi/enesgpt.git
cd enesgpt
```


### 2. Bağımlılıkları yükle
```bash
npm install
```
### 3. Ortam değişkenlerini ayarla
Proje kök dizininde bir .env dosyası oluştur ve aşağıdaki şekilde doldur:

```bash
MONGO=mongodb+srv://<user>:<pass>@<cluster-url>/<dbname>?retryWrites=true&w=majority
GEMINI_API_KEY=xxx-xxx-xxx
IMAGE_KIT_ENDPOINT=https://ik.imagekit.io/xxx
IMAGE_KIT_PUBLIC_KEY=your_public_key
IMAGE_KIT_PRIVATE_KEY=your_private_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```
Gerekli tüm anahtarları ilgili platformlardan almayı unutma.

### 4. Sunucuyu başlat
Geliştirme ortamı için:
```bash
npm run dev
```

Prodüksiyon ortamı için:
```bash
npm run build
npm start
```

## Kullanılan Teknolojiler
- React (Vite ile)
- Express.js
- MongoDB & Mongoose
- Gemini API (Google AI)
- Clerk (Authentication)
- ImageKit (Dosya/görsel yönetimi)

## Katkıda Bulunmak
- Katkı yapmak isterseniz pull request gönderebilir veya GitHub Issues kısmından bildirimde bulunabilirsiniz.

## Fork’layın
- Yeni bir dal oluşturun (git checkout -b feature/foo)
- Değişiklikleri yapıp commit edin (git commit -am 'Add foo')
- Dalınızı push’layın (git push origin feature/foo)
- Pull request açın


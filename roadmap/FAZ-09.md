# Faz 9 — Frontend UI & Tasarım Sistemi

> **Öncelik:** 🔴 P0  
> **Bağımlılık:** Faz 0 (altyapı), Faz 1 ile paralel geliştirilebilir  
> **Tahmini süre:** 3-4 gün (temel), diğer fazlarla birlikte iteratif büyüyecek

## Amaç

Temiz, modern, responsive bir kullanıcı arayüzü oluştur. Dark/Light mode, mülakat odası, dashboard ve temel bileşen sistemi. `apps/web` şu anda sadece basit HTML servisi yapıyor — bunu tam bir frontend uygulamasına dönüştür.

---

## Teknik Karar: Frontend Framework

**Mevcut durum:** `apps/web` → `Bun.serve()` ile statik HTML. Framework yok.

| Seçenek | Artı | Eksi |
|---------|------|------|
| **React + Vite** | En geniş ekosistem, Monaco Editor/tldraw entegrasyonu kolay | Bundle boyutu büyük |
| **SolidJS + Vite** | Küçük, hızlı, React benzeri syntax | Ekosistem daha dar |
| **Vanilla + HTMX** | Çok hafif, Bun.serve ile uyumlu | Karmaşık state yönetimi zor |

> **Tavsiye:** React + Vite — Monaco Editor (Faz 3) ve tldraw (Faz 4) entegrasyonu için en az sürtünme.

**CSS:** Tailwind CSS v4 + shadcn/ui (veya Radix primitives)

---

## Görevler

### 9.1 — Frontend Scaffold & Build Sistemi

`apps/web`'i bir React + Vite uygulamasına dönüştür.

- [ ] `apps/web` içinde Vite + React + TypeScript scaffold
- [ ] Tailwind CSS v4 kurulumu
- [ ] UI primitive kütüphanesi kurulumu (shadcn/ui veya Radix)
- [ ] `bun run dev:web` → Vite dev server (HMR)
- [ ] `bun run build:web` → Production build
- [ ] API URL'ini env'den oku (Vite'ın `import.meta.env`)
- [ ] Proxy config: Vite dev server → API (localhost:3001)

**Paketler:**
```
bun add react react-dom --filter @ffh/web
bun add -d vite @vitejs/plugin-react --filter @ffh/web
bun add tailwindcss @tailwindcss/vite --filter @ffh/web
```

---

### 9.2 — Tasarım Sistemi & Temel Bileşenler

Projenin tüm sayfalarında tutarlı UI için temel bileşen seti.

- [ ] **Tema sistemi:** Dark mode varsayılan, Light mode toggle
- [ ] **Renk paleti:** Primary, Secondary, Accent, Background, Surface, Text
- [ ] **Tipografi:** Inter (UI), JetBrains Mono (kod)
- [ ] **Temel bileşenler:**
  - `Button` — primary, secondary, ghost, danger varyantları
  - `Input` — text, password, search
  - `Card` — başlık, içerik, footer alanları
  - `Modal` / `Dialog` — overlay dialog
  - `Toast` — success, error, info bildirimleri
  - `Badge` — durum göstergesi (Easy/Medium/Hard, Hire/No Hire)
  - `Avatar` — kullanıcı ve AI avatar
  - `Spinner` / `Skeleton` — loading durumları
  - `Tabs` — sekme navigasyonu
  - `Dropdown` / `Select` — seçim menüleri

---

### 9.3 — Layout & Navigasyon

Uygulamanın genel iskelet yapısı.

- [ ] **App Shell:** Sidebar + Main content area
- [ ] **Sidebar navigasyon:**
  - Dashboard (ana sayfa)
  - Yeni Mülakat (başlat)
  - Geçmiş Mülakatlar
  - İlerleme (Faz 7'de doldurulacak)
  - Ayarlar
- [ ] **Top bar:** Kullanıcı avatar, bildirimler, tema toggle
- [ ] **Router:** React Router veya TanStack Router
- [ ] **Auth guard:** Giriş yapmamış kullanıcıyı login sayfasına yönlendir
- [ ] **Responsive:** Tablet ve mobil uyumlu (sidebar collapse)

---

### 9.4 — Auth Sayfaları

Login ve register sayfaları.

- [ ] `/login` — Email + Password giriş formu
- [ ] `/register` — Email + Password + İsim kayıt formu
- [ ] better-auth API'sine istek:
  - Register: `POST /api/auth/sign-up/email`
  - Login: `POST /api/auth/sign-in/email`
  - Session: `GET /api/auth/get-session` (cookie ile)
- [ ] Session yönetimi: Cookie-based, `convex_jwt` cookie'si ile Convex erişimi
- [ ] Auth context: `useAuth()` hook → `{ user, isLoading, login, logout, register }`
- [ ] Çıkış (logout) fonksiyonu

**Referans:** `tests/auth.test.ts` — Tüm auth akışları burada test edilmiş

---

### 9.5 — Dashboard Sayfası

Giriş sonrası karşılama sayfası.

- [ ] **Hoşgeldin kartı:** "Merhaba, {isim}" + motivasyon mesajı
- [ ] **Hızlı başlat butonları:**
  - 🖥️ Live Coding
  - 🏗️ System Design
  - 📞 Phone Screen
  - 🎯 Practice
- [ ] **Son mülakatlar listesi:** Tarih, tür, skor, durum badge'leri
- [ ] **İstatistik kartları:** Toplam mülakat, ortalama skor, streak
- [ ] Boş durum: "Henüz mülakat yapmadın, hemen başla!" mesajı

---

### 9.6 — Mülakat Odası Arayüzü (Temel)

Voice pipeline'ın çalışacağı ana ekran. Faz 1 ile paralel geliştir.

- [ ] **Üst bar:**
  - Mülakat türü etiketi
  - Timer (geçen süre)
  - "Mülakatı Bitir" butonu
- [ ] **Ana alan:** İçerik modüle göre değişecek (Faz 3, 4, 5'te doldurulacak)
  - Şimdilik: Boş alan + "AI ile konuş" mesajı
- [ ] **Alt bar — Ses kontrolleri:**
  - Mikrofon aç/kapat toggle butonu
  - Ses seviyesi göstergesi (volume meter)
  - AI konuşma durumu göstergesi (pulse animasyon)
- [ ] **AI Avatar paneli:**
  - AI'ın konuştuğunu gösteren animasyon (ses dalgası veya pulse)
  - State göstergesi: "Dinliyor...", "Düşünüyor...", "Konuşuyor..."
  - Son transkript balonu (ne dediğini göster)
- [ ] **WebSocket bağlantısı:**
  - `/ws/voice` endpoint'ine bağlan
  - `state_change` mesajlarını dinle → UI güncelle
  - `transcript` mesajlarını göster
  - `ai_text` mesajlarını göster (subtitle gibi)

---

### 9.7 — Mülakat Başlatma Akışı

Kullanıcının mülakat türü ve ayarlarını seçtiği wizard.

- [ ] **Adım 1:** Mülakat türü seçimi (4 kart)
- [ ] **Adım 2:** Ayarlar
  - Zorluk: Easy / Medium / Hard
  - Dil: Türkçe / İngilizce
  - Soru sayısı: 3 / 5 / 7
  - (İleride) İş ilanı URL'si (Faz 6)
  - (İleride) Özgeçmiş yükleme (Faz 6)
- [ ] **Adım 3:** Onay → "Mülakata Başla" butonu
- [ ] Tıklanınca: API'ye mülakat oluşturma isteği → Mülakat odasına yönlendir

---

## Sayfa Haritası

```
/login              → Auth: Giriş
/register           → Auth: Kayıt
/                   → Dashboard
/interview/new      → Mülakat Başlatma Wizard
/interview/:id      → Mülakat Odası
/interview/:id/report → Mülakat Raporu (Faz 7)
/history            → Geçmiş Mülakatlar
/progress           → İlerleme Grafikleri (Faz 7)
/settings           → Ayarlar & Profil
```

---

## Tamamlanma Kriterleri

1. `bun run dev:web` ile React uygulaması HMR ile çalışıyor
2. Dark mode varsayılan, Light mode toggle çalışıyor
3. Login → Register → Dashboard akışı çalışıyor
4. Dashboard'da hızlı başlat butonları tıklanabiliyor
5. Mülakat odası açılıyor, mikrofon butonu aktif
6. WebSocket üzerinden voice pipeline ile iletişim kuruluyor (Faz 1 ile entegre)
7. Responsive: Tablet ekranında düzgün görünüyor

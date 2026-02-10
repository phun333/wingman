# Faz 10 — Production & Optimizasyon

> **Öncelik:** ⚪ P5  
> **Bağımlılık:** Tüm diğer fazlar (en son veya paralel)  
> **Tahmini süre:** 3-5 gün

## Amaç

Uygulamayı production'a taşı. Performans optimizasyonu, güvenlik sertleştirme, monitoring, deployment pipeline ve ölçeklenebilirlik.

---

## Görevler

### 10.1 — Voice Pipeline Latency Optimizasyonu

Hedef: Kullanıcı susmasından ilk AI sesine < 1.5 saniye.

- [ ] **Sentence-level TTS pipelining:**
  - LLM'den cümle tamamlandığında (nokta, soru işareti) hemen TTS'e gönder
  - LLM hâlâ token üretirken ilk cümle zaten seslendirilmeye başlamış olmalı
  - Overlap: TTS chunk 1 oynatılırken TTS chunk 2 üretiliyor
- [ ] **STT optimizasyonu:**
  - VAD sensitivity ayarlama: Çok erken kesmesin ama gereksiz beklemesin
  - Ses chunk boyutu optimizasyonu: Daha küçük chunk = daha hızlı gönderim
- [ ] **LLM optimizasyonu:**
  - Model seçimi: Hız vs kalite trade-off (küçük model daha hızlı)
  - Max tokens limiti: Gereksiz uzun cevapları engelle
  - Temperature: Düşük temperature = daha hızlı generation
- [ ] **Ağ optimizasyonu:**
  - WebSocket compression (permessage-deflate)
  - Coğrafi olarak yakın API sunucu (EU/TR bölgesi)
  - fal.ai proxy yerine doğrudan bağlantı (mümkünse)
- [ ] **Latency dashboard:** Her adımın süresini ölç ve logla

---

### 10.2 — Güvenlik Sertleştirme

- [ ] **API rate limiting:**
  - Endpoint bazlı: TTS/STT proxy'lerde agresif limit (ör: 30/dakika)
  - IP bazlı: DDoS koruması
  - User bazlı: Abonelik planına göre limit
  - Kütüphane: Hono rate-limiter middleware
- [ ] **Kod sandbox güvenliği:**
  - Kullanıcı kodu sandboxed process'te çalışmalı
  - Dosya sistemi erişimi yok, network erişimi yok
  - CPU + memory limit (cgroups veya process limitleri)
  - Timeout: Sonsuz döngüye karşı 5-10 saniye hard limit
- [ ] **Input validation:**
  - Tüm API input'ları Zod ile validate (zaten oRPC ile yapılıyor)
  - XSS koruması: HTML/JS injection engelleme
  - SQL injection: Convex query builder zaten güvenli
  - WebSocket mesaj boyutu limiti
- [ ] **Secret yönetimi:**
  - FAL_KEY, OPENROUTER_API_KEY browser'a asla gitmemeli
  - API proxy pattern doğru çalışıyor mu? Double check
  - Convex env variable'ları: `bunx convex env set`
- [ ] **CORS yapılandırması:**
  - Production'da specific origin'ler (wildcard değil)
  - Credentials: true (cookie-based auth için)
- [ ] **Auth güvenliği:**
  - Session timeout ve rotation
  - CSRF koruması
  - Password hashing: better-auth varsayılanı (bcrypt/argon2)

---

### 10.3 — Monitoring & Logging

- [ ] **Structured logging:**
  - API'de her request'i logla: method, path, duration, status
  - Voice pipeline metrikleri: STT latency, LLM latency, TTS latency
  - Error logging: Stack trace ile
- [ ] **Health checks:**
  - `/health` endpoint'i (mevcut)
  - Dependency health: Convex bağlantısı, fal.ai erişimi, OpenRouter erişimi
  - Health check dashboard veya uptime monitor
- [ ] **Error tracking:**
  - Sentry veya benzeri servis entegrasyonu (opsiyonel)
  - Unhandled exception yakalama
  - WebSocket error'ları yakalama
- [ ] **Analytics:**
  - Mülakat başlatma/tamamlama oranları
  - Ortalama mülakat süresi
  - En çok kullanılan mülakat türü
  - Kullanıcı retention metrikleri

---

### 10.4 — Deployment

- [ ] **`apps/api` deployment:**
  - Platform: Railway, Fly.io, veya Cloudflare Workers
  - Bun runtime desteği gerekli (Railway ve Fly.io destekler)
  - WebSocket desteği gerekli (Cloudflare Workers: Durable Objects ile)
  - Environment variables: FAL_KEY, OPENROUTER_API_KEY, CONVEX_URL
  - Dockerfile veya buildpack hazırla
- [ ] **`apps/web` deployment:**
  - Platform: Vercel, Cloudflare Pages, veya Netlify
  - Vite build output: `dist/` klasörü
  - SPA routing: `/*` → `index.html` fallback
  - Environment variables: API URL (build time)
- [ ] **Convex production:**
  - `bunx convex deploy` — Production deployment
  - Convex environment variables: `bunx convex env set FAL_KEY ...`
  - Schema migration: Mevcut veriler ile uyumlu olmalı
- [ ] **Domain & SSL:**
  - Custom domain ayarlama
  - SSL sertifikası (otomatik — platform sağlar)
  - API ve Web ayrı subdomain (ör: api.example.com, app.example.com)

---

### 10.5 — CI/CD Pipeline

- [ ] **GitHub Actions workflow:**
  ```yaml
  # .github/workflows/ci.yml
  # Trigger: push to main, pull request
  # Steps:
  #   1. bun install
  #   2. bun run typecheck (tsgo --noEmit)
  #   3. oxlint (linting)
  #   4. bun test
  #   5. bun run build
  #   6. Deploy (conditional: only on main)
  ```
- [ ] **Branch protection:**
  - main branch'e direkt push yok
  - PR gerekli, CI geçmeli
- [ ] **Preview deployments:**
  - Her PR için preview URL (Vercel/Cloudflare otomatik yapar)

---

### 10.6 — Web Performans

- [ ] **Code splitting:** React.lazy + Suspense ile sayfa bazlı split
  - Monaco Editor lazy load (büyük bundle)
  - tldraw lazy load
  - Grafik kütüphanesi lazy load
- [ ] **Asset optimizasyonu:**
  - Resim sıkıştırma
  - Font subsetting (Inter, JetBrains Mono)
  - Gzip/Brotli compression
- [ ] **Caching:**
  - Static asset'ler: Long-term cache (hash-based filenames)
  - API response cache: Convex zaten real-time, ek cache gerekmez
  - fal.ai response cache: Aynı TTS isteği tekrarlanmamalı

---

### 10.7 — Ölçeklenebilirlik Notları

- [ ] **Convex:** Otomatik ölçeklenir (managed service)
- [ ] **API sunucusu:** Horizontal scaling — load balancer arkasında birden fazla instance
  - WebSocket sticky sessions gerekli (veya Redis pub/sub ile)
- [ ] **fal.ai:** Serverless, otomatik ölçeklenir (rate limit'lere dikkat)
- [ ] **OpenRouter:** Rate limit'leri izle, gerekirse birden fazla key ile rotation
- [ ] **Dosya depolama:** Convex file storage veya Cloudflare R2 (özgeçmişler, audio)

---

## Tamamlanma Kriterleri

1. Uygulama production URL'sinde erişilebilir
2. CI/CD pipeline: Push → typecheck → test → deploy otomatik
3. Voice pipeline latency < 2 saniye (ideal < 1.5s)
4. Rate limiting aktif, abuse koruması çalışıyor
5. Monitoring: Hatalar loglanıyor, health check aktif
6. Lighthouse score: Performance > 80, Accessibility > 90
7. Custom domain + SSL çalışıyor

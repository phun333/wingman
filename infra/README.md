# 🚀 Dokploy Deployment

## Mimari

```
    Browser
      │
      ▼
┌─────────────┐
│   Traefik   │  ← Dokploy (SSL + domain)
│  (Dokploy)  │
└──────┬──────┘
       │ :3001
┌──────▼──────────────────────────────────┐
│          Bun (Hono) — tek servis         │
│                                          │
│  /api/auth/*   → proxy → Convex Cloud    │
│  /api/*        → REST API                │
│  /ws/voice     → WebSocket               │
│  /health       → healthcheck             │
│  /docs         → Scalar API docs         │
│  /*            → static files (SPA)      │
└──────┬──────────────────┬────────────────┘
       │                  │
  ┌────▼────┐     ┌───────▼──────┐
  │ Convex  │     │   fal.ai     │
  │ Cloud   │     │  (Freya)     │
  │ DB+Auth │     │  STT / TTS   │
  └─────────┘     └──────────────┘
```

Tek container — nginx yok. Traefik (Dokploy) SSL ve routing'i halleder.

## Ön Koşullar

1. **Convex deploy:**
   ```bash
   bunx convex deploy
   ```
   Convex dashboard'dan environment variables:
   - `SITE_URL` = production domain (`https://myapp.com`)
   - `BETTER_AUTH_SECRET` = güçlü random string

2. **Convex URL'leri** not edin:
   - `CONVEX_URL` → `https://xxx.convex.cloud`
   - `CONVEX_HTTP_URL` → `https://xxx.convex.site` (`.cloud` → `.site`)

## Dokploy Kurulumu

### 1. Docker Compose projesi oluşturun

- **Source**: Git repository
- **Compose Path**: `infra/docker-compose.yml`

### 2. Environment Variables

| Variable | Zorunlu | Açıklama | Örnek |
|----------|---------|----------|-------|
| `SITE_URL` | ✅ | Production domain | `https://myapp.com` |
| `CONVEX_URL` | ✅ | Convex client URL | `https://xxx.convex.cloud` |
| `CONVEX_HTTP_URL` | ✅ | Convex HTTP actions | `https://xxx.convex.site` |
| `FAL_KEY` | ✅ | fal.ai API key | `fal_...` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key | `sk-or-...` |
| `OPENROUTER_MODEL` | ❌ | LLM model | `google/gemini-2.5-flash` |
| `HYPERBROWSER_API_KEY` | ❌ | Web scraping | |

### 3. Domain

Dokploy'da domain'i `app` servisine, port `3001`'e yönlendirin.

### 4. Deploy 🚀

## Lokal Test

```bash
cd infra
cp .env.example .env
# .env'i doldurun
docker compose up --build
# → http://localhost:3001
```

## Troubleshooting

| Sorun | Çözüm |
|-------|-------|
| Auth çalışmıyor | `CONVEX_HTTP_URL` doğru mu? (`.convex.site`) |
| 503 auth hatası | `CONVEX_HTTP_URL` set edilmemiş |
| WebSocket kopuyor | Dokploy'da WebSocket timeout artır |
| API 502 | `docker compose logs app` — env var'ları kontrol et |

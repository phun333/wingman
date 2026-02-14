<p align="center">
  <img src="marketing/logo.png" width="80" height="80" alt="Wingman" />
</p>

<h1 align="center">Wingman</h1>

<p align="center">
  Yapay zeka destekli sesli teknik mülakat platformu
</p>

<p align="center">
  <a href="#özellikler">Özellikler</a> •
  <a href="#mimari">Mimari</a> •
  <a href="#kurulum">Kurulum</a> •
  <a href="#komutlar">Komutlar</a> •
  <a href="#modül-rehberi">Modüller</a>
</p>

---

Wingman, adayların gerçekçi mülakat simülasyonları ile kodlama, sistem tasarımı ve telefon mülakatlarına hazırlanmasını sağlar. Platform, Türkçe sesli yapay zeka mülakatçısı ile gerçek zamanlı etkileşim sunar; fal.ai üzerindeki **Freya** STT/TTS modelleri ve **OpenRouter** LLM altyapısını kullanır.

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| Sesli Yapay Zeka Mülakatçısı | Türkçe konuşan yapay zeka mülakatçısı (Freya STT/TTS + OpenRouter LLM) |
| Canlı Kodlama | Monaco editör ile kod yazma, çalıştırma ve yapay zeka tarafından analiz edilmesi |
| Sistem Tasarımı | tldraw tabanlı beyaz tahta ile sistem mimarisi tasarlama |
| Telefon Mülakatı | Sadece sesli, soru-cevap formatında mülakat simülasyonu |
| Pratik Modu | Serbest çalışma, ipucu sistemi ve çözüm karşılaştırması |
| Kişiselleştirilmiş Mülakatlar | İş ilanı ve özgeçmiş analizi ile hedefe yönelik sorular |
| Detaylı Raporlama | Performans skoru, güçlü/zayıf yönler, radar grafiği ve ilerleme takibi |
| LeetCode Entegrasyonu | 2000+ soru, şirket bazlı çalışma yol haritaları |

## Mimari

```
                     ┌─────────────┐
                     │  apps/web   │  React 19 + Tailwind CSS 4 + Vite
                     │  :3000      │  Monaco Editor · tldraw · Zustand
                     └──────┬──────┘
                            │ HTTP + WebSocket
                     ┌──────┴──────┐
                     │  apps/api   │  Hono REST API + WebSocket
                     │  :3001      │  Kod Sanal Alanı · Proxy
                     └──┬────┬──┬──┘
                        │    │  │
           ┌────────────┘    │  └────────────┐
           ▼                 ▼               ▼
   ┌───────────────┐ ┌─────────────┐ ┌─────────────┐
   │   Convex      │ │   fal.ai    │ │ OpenRouter   │
   │  Veritabanı   │ │ Freya STT   │ │  Gemini 2.5  │
   │ + better-auth │ │ Freya TTS   │ │    Flash     │
   └───────────────┘ └─────────────┘ └─────────────┘
```

### Sesli Mülakat Boru Hattı

1. İstemci mikrofon verisini base64 kodlanmış ses parçaları olarak WebSocket üzerinden gönderir
2. Ses parçaları birleştirilerek **Freya STT**'ye iletilir ve metne dönüştürülür
3. Metin, konuşma geçmişi ile birlikte **OpenRouter LLM**'e akış modunda gönderilir
4. LLM çıktısı cümle sınırlarında bölünerek **Freya TTS**'e iletilir
5. Üretilen ses, istemciye gerçek zamanlı olarak aktarılır

LLM üretimi ile TTS sentezi paralel çalıştırılarak düşük gecikme sağlanır.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Çalışma Zamanı | [Bun](https://bun.sh) |
| API Çatısı | [Hono](https://hono.dev) |
| Veritabanı | [Convex](https://convex.dev) (gerçek zamanlı) |
| Kimlik Doğrulama | [better-auth](https://www.better-auth.com) + Convex |
| Doğrulama | [Zod](https://zod.dev) v4 |
| Konuşmadan Metne | Freya STT ([fal.ai](https://fal.ai)) |
| Metinden Konuşmaya | Freya TTS ([fal.ai](https://fal.ai)) |
| Büyük Dil Modeli | [OpenRouter](https://openrouter.ai) (Gemini 2.5 Flash) |
| İstemci | [React](https://react.dev) 19 + [Tailwind CSS](https://tailwindcss.com) 4 + [Vite](https://vite.dev) |
| Beyaz Tahta | [tldraw](https://tldraw.dev) |
| Kod Düzenleyici | [Monaco Editor](https://microsoft.github.io/monaco-editor) |
| Durum Yönetimi | [Zustand](https://zustand.docs.pmnd.rs) |
| Dağıtım | [Docker](https://docker.com) + [Dokploy](https://dokploy.com) |

## Kurulum

### Ön Koşullar

- [Bun](https://bun.sh) v1.0 veya üzeri
- [Convex](https://convex.dev) hesabı ve projesi
- [fal.ai](https://fal.ai) API anahtarı (Freya STT/TTS erişimi)
- [OpenRouter](https://openrouter.ai) API anahtarı

### Hızlı Başlangıç

```bash
# Depoyu klonla
git clone https://github.com/phun333/wingman.git
cd wingman

# Bağımlılıkları yükle
bun install

# Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenleyerek API anahtarlarını ekle
```

### Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `CONVEX_URL` | Convex proje URL'si | — |
| `FAL_KEY` | fal.ai API anahtarı | — |
| `OPENROUTER_API_KEY` | OpenRouter API anahtarı | — |
| `OPENROUTER_MODEL` | Kullanılacak LLM modeli | `google/gemini-2.5-flash` |
| `TTS_ENDPOINT` | Freya TTS endpoint kimliği | `freya-mypsdi253hbk/freya-tts` |
| `STT_ENDPOINT` | Freya STT endpoint kimliği | `freya-mypsdi253hbk/freya-stt` |
| `PORT_API` | API sunucu portu | `3001` |
| `PORT_WEB` | Web sunucu portu | `3000` |
| `SITE_URL` | Web uygulaması URL'si | `http://localhost:3000` |

### Geliştirme Sunucularını Başlatma

```bash
# Convex geliştirme sunucusu (ayrı terminal)
bunx convex dev

# API + Web birlikte
bun run dev

# Veya ayrı ayrı
bun run dev:api    # http://localhost:3001
bun run dev:web    # http://localhost:3000
```

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `bun run dev` | Tüm servisleri başlat |
| `bun run dev:api` | Sadece API sunucusunu başlat |
| `bun run dev:web` | Sadece web sunucusunu başlat |
| `bun run dev:convex` | Convex geliştirme sunucusunu başlat |
| `bun run build` | Üretim derlemesi |
| `bun run typecheck` | TypeScript tip kontrolü (tsgo) |
| `bun test` | Testleri çalıştır |
| `bun run clean` | node_modules temizliği |

## Modül Rehberi

Her modülün kendi README dosyasında ayrıntılı açıklama, klasör yapısı ve kullanım bilgileri bulunur.

| Modül | Açıklama | README |
|-------|----------|--------|
| **apps/api** | Hono REST API + WebSocket sunucusu | [Oku](apps/api/README.md) |
| **apps/web** | React tek sayfa uygulaması | [Oku](apps/web/README.md) |
| **convex** | Veritabanı şeması, sorgular ve mutasyonlar | [Oku](convex/README.md) |
| **packages/db** | Convex istemci sarmalayıcısı | [Oku](packages/db/README.md) |
| **packages/env** | Ortam değişkeni yönetimi | [Oku](packages/env/README.md) |
| **packages/types** | Paylaşılan tip tanımları | [Oku](packages/types/README.md) |
| **packages/tsconfig** | Paylaşılan TypeScript yapılandırmaları | [Oku](packages/tsconfig/README.md) |
| **dataset** | LeetCode veri seti ve dönüştürücü | [Oku](dataset/README.md) |
| **docs** | fal.ai / Freya entegrasyon dokümantasyonu | [Oku](docs/README.md) |
| **infra** | Docker ve dağıtım yapılandırması | [Oku](infra/README.md) |
| **roadmap** | Geliştirme yol haritası | [Oku](roadmap/README.md) |
| **presentation** | Hackathon sunum dosyaları | [Oku](presentation/README.md) |
| **tests** | API ve entegrasyon testleri | [Oku](tests/README.md) |

## Docker ile Dağıtım

```bash
# Görüntüyü derle ve başlat
docker compose -f infra/docker-compose.yml up --build

# Arka planda çalıştır
docker compose -f infra/docker-compose.yml up -d --build
```

Detaylı bilgi için [infra/README.md](infra/README.md) dosyasına bakın.

## Lisans

Bu proje [fal.ai Hackathon](https://fal.ai) kapsamında geliştirilmiştir.

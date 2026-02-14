# apps/api

Wingman platformunun arka uç sunucusudur. Hono framework'ü üzerine kurulu REST API ve WebSocket uç noktalarını barındırır. Bun çalışma zamanı ile çalışır.

## Görevleri

- REST API uç noktaları sunma (mülakatlar, sorular, raporlar, kullanıcılar, iş ilanları, özgeçmişler)
- WebSocket üzerinden sesli mülakat oturumu yönetimi (STT, LLM, TTS boru hattı)
- fal.ai (Freya STT/TTS) ve OpenRouter (LLM) servislerine vekil istekler
- Kod çalıştırma sanal alanı (JavaScript ve Python desteği)
- Convex veritabanı ile iletişim
- OpenAPI şeması ve Scalar API dokümantasyonu oluşturma
- better-auth kimlik doğrulama vekili

## Klasör Yapısı

```
src/
  index.ts              Sunucu giriş noktası (Hono + WebSocket + statik dosya sunumu)
  router.ts             Tüm API rotalarının birleştirildiği ana yönlendirici
  sandbox.ts            Kod çalıştırma sanal alanı (node:vm + Python alt işlem)
  middleware/
    auth.ts             better-auth oturum doğrulama ara yazılımı
  routes/
    interviews.ts       Mülakat CRUD ve oturum yönetimi
    problems.ts         Kodlama soruları listesi ve rastgele seçim
    design-problems.ts  Sistem tasarımı soruları
    code.ts             Kod çalıştırma uç noktası
    reports.ts          Mülakat raporu oluşturma ve getirme
    jobs.ts             İş ilanı ayrıştırma (URL veya metin girişi ile)
    resume.ts           Özgeçmiş yükleme ve yapay zeka ile analiz
    profile.ts          Kullanıcı profili ve hafıza yönetimi
    leetcode.ts         LeetCode soru bankası
    study-paths.ts      Şirket bazlı çalışma yol haritaları
    recommendations.ts  CV bazlı kişiselleştirilmiş problem önerileri
  services/
    geolocation.ts      IP tabanlı konum belirleme
    problem-intros.ts   Soru tanıtım metinleri oluşturma
    report-generator.ts LLM ile mülakat raporu üretme
    recommendation.ts   CV → LeetCode akıllı öneri motoru (LLM analiz + scoring)
  prompts/
    index.ts            Sistem istemi yönlendiricisi
    live-coding.ts      Canlı kodlama mülakat istemi
    system-design.ts    Sistem tasarımı mülakat istemi
    phone-screen.ts     Telefon mülakatı istemi
    practice.ts         Pratik modu istemi
    pronunciation-guide.ts  TTS telaffuz optimizasyonu
  ws/
    voice.ts            Sesli mülakat oturumu (VoiceSession sınıfı)
```

## API Uç Noktaları

| Yol | Açıklama |
|-----|----------|
| `GET /health` | Sağlık kontrolü |
| `GET /api/users` | Kullanıcı listesi |
| `POST /api/interviews` | Yeni mülakat oluşturma |
| `POST /api/code/execute` | Kod çalıştırma |
| `POST /api/reports/:id/generate` | Rapor oluşturma |
| `POST /api/proxy/tts` | Freya TTS vekili |
| `POST /api/proxy/stt` | Freya STT vekili |
| `POST /api/proxy/llm` | OpenRouter LLM vekili |
| `POST /api/recommendations` | CV'ye göre kişiselleştirilmiş LeetCode önerileri |
| `GET /api/recommendations/analysis` | Kullanıcının CV analiz verisi |
| `WS /ws/voice` | Sesli mülakat WebSocket bağlantısı |
| `GET /docs` | Scalar API dokümantasyonu |
| `GET /openapi.json` | OpenAPI şeması |

## Sesli Mülakat Boru Hattı

WebSocket bağlantısı üzerinden çalışan sesli mülakat akışı şu adımlardan oluşur:

1. İstemci mikrofon verisini base64 kodlanmış ses parçaları olarak gönderir
2. Ses parçaları birleştirilerek Freya STT'ye gönderilir ve metne dönüştürülür
3. Metin, konuşma geçmişi ile birlikte OpenRouter LLM'e akış modunda gönderilir
4. LLM çıktısı cümle sınırlarında bölünerek Freya TTS'e iletilir
5. Üretilen ses, istemciye gerçek zamanlı olarak aktarılır

Bu süreç, LLM üretimi ile TTS sentezini paralel çalıştırarak düşük gecikme sağlar.

## Çalıştırma

```bash
bun run dev    # Geliştirme modunda başlat (otomatik yeniden yükleme)
bun run build  # Üretim derlemesi
bun run start  # Üretim modunda başlat
```

Varsayılan olarak `http://localhost:3001` adresinde çalışır.

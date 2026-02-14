# Wingman

Wingman, yapay zeka destekli sesli teknik mülakat platformudur. Adaylar gerçekçi mülakat simülasyonları yaparak kodlama, sistem tasarımı ve telefon mülakatlarına hazırlanır. Platform, Türkçe sesli yapay zeka mülakatçısı ile gerçek zamanlı etkileşim sunar.

Proje deposu: [github.com/phun333/wingman](https://github.com/phun333/wingman)

## Özellikler

- **Sesli Yapay Zeka Mülakatçısı**: Türkçe konuşan yapay zeka mülakatçısı (Freya STT/TTS + OpenRouter LLM)
- **Canlı Kodlama**: Monaco editör ile kod yazma, çalıştırma ve yapay zeka tarafından analiz edilmesi
- **Sistem Tasarımı**: tldraw tabanlı beyaz tahta ile sistem mimarisi tasarlama
- **Telefon Mülakatı**: Sadece sesli, soru-cevap formatında mülakat simülasyonu
- **Pratik Modu**: Serbest çalışma, ipucu sistemi ve çözüm karşılaştırması
- **Kişiselleştirilmiş Mülakatlar**: İş ilanı ve özgeçmiş analizi ile hedefe yönelik sorular
- **Detaylı Raporlama**: Performans skoru, güçlü/zayıf yönler, radar grafiği ve ilerleme takibi
- **LeetCode Entegrasyonu**: Şirket bazlı çalışma yol haritaları ve gerçek mülakat soruları

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Çalışma Zamanı | Bun |
| API | Hono |
| Veritabanı | Convex (gerçek zamanlı) |
| Kimlik Doğrulama | better-auth + Convex |
| Doğrulama | Zod v4 |
| Konuşmadan Metne | Freya STT (fal.ai) |
| Metinden Konuşmaya | Freya TTS (fal.ai) |
| Büyük Dil Modeli | OpenRouter (Gemini 2.5 Flash) |
| İstemci | React 19 + Tailwind CSS 4 + Vite |
| Beyaz Tahta | tldraw |
| Kod Düzenleyici | Monaco Editor |

## Proje Yapısı

```
wingman/
  apps/
    api/          Hono REST API + WebSocket sunucusu
    web/          React tek sayfa uygulaması (SPA)
  packages/
    db/           Convex istemci sarmalayıcısı
    env/          Ortam değişkeni yönetimi
    tsconfig/     Paylaşılan TypeScript yapılandırmaları
    types/        Paylaşılan tip tanımları
  convex/         Convex arka uç (şema, sorgular, mutasyonlar)
  dataset/        LeetCode veri seti ve dönüştürücü
  docs/           fal.ai / Freya entegrasyon dokümantasyonu
  infra/          Docker ve dağıtım yapılandırması
  roadmap/        Geliştirme yol haritası (fazlar)
  presentation/   Hackathon sunum dosyaları
  tests/          API ve entegrasyon testleri
```

## Kurulum

### Ön Koşullar

- [Bun](https://bun.sh) v1.0 veya üzeri
- [Convex](https://convex.dev) hesabı ve projesi
- [fal.ai](https://fal.ai) API anahtarı (Freya STT/TTS erişimi)
- [OpenRouter](https://openrouter.ai) API anahtarı

### Adımlar

```bash
# Depoyu klonla
git clone https://github.com/phun333/wingman.git
cd wingman

# Bağımlılıkları yükle
bun install

# Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenleyerek API anahtarlarını ekle

# Convex geliştirme sunucusunu başlat
bunx convex dev

# API ve web sunucularını başlat (ayrı terminallerde)
bun run dev:api
bun run dev:web
```

### Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `CONVEX_URL` | Convex proje URL'si |
| `FAL_KEY` | fal.ai API anahtarı |
| `OPENROUTER_API_KEY` | OpenRouter API anahtarı |
| `OPENROUTER_MODEL` | Kullanılacak LLM modeli (varsayılan: google/gemini-2.5-flash) |
| `PORT_API` | API sunucu portu (varsayılan: 3001) |
| `PORT_WEB` | Web sunucu portu (varsayılan: 3000) |

## Komutlar

```bash
bun run dev          # Tüm servisleri başlat
bun run dev:api      # Sadece API sunucusunu başlat
bun run dev:web      # Sadece web sunucusunu başlat
bun run dev:convex   # Convex geliştirme sunucusunu başlat
bun run build        # Üretim derlemesi
bun test             # Testleri çalıştır
```

## Lisans

Bu proje hackathon kapsamında geliştirilmiştir.

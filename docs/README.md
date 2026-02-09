# Freya + fal.ai Entegrasyon Dökümantasyonu

Bu klasör, Freya TTS/STT ve fal.ai platformunun projemizde nasıl kullanılacağına dair TypeScript örneklerini içerir.

## 📁 Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| [`endpoints.md`](./endpoints.md) | Tüm Freya endpoint'lerinin referans listesi |
| [`setup.md`](./setup.md) | fal.ai client kurulumu ve yapılandırması |
| [`freya-tts-streaming.ts`](./freya-tts-streaming.ts) | TTS Streaming — PCM16 chunk'larla gerçek zamanlı ses üretimi |
| [`freya-tts-openai-compat.ts`](./freya-tts-openai-compat.ts) | TTS OpenAI-Compatible — `/audio/speech` endpoint'i ile ses üretimi |
| [`freya-pipeline.ts`](./freya-pipeline.ts) | TTS → STT Pipeline — Metin→Ses→Metin round-trip |
| [`freya-livekit.ts`](./freya-livekit.ts) | LiveKit + OpenAI uyumlu STT/TTS entegrasyonu |

## 🚀 Hızlı Başlangıç

```bash
# 1. @fal-ai/client paketini kur
bun add @fal-ai/client

# 2. .env dosyasına FAL_KEY ekle
echo "FAL_KEY=your-fal-api-key" >> .env
echo "TTS_ENDPOINT=freya-mypsdi253hbk/freya-tts" >> .env
echo "STT_ENDPOINT=freya-mypsdi253hbk/freya-stt" >> .env

# 3. Örnekleri çalıştır
bun run docs/freya-tts-streaming.ts
```

## 🔑 Kullanılabilir Servisler

### Text-to-Speech (TTS)
Metin → Ses dönüşümü. Streaming ve batch modları desteklenir.

### Speech-to-Text (STT)  
Ses → Metin dönüşümü. OpenAI Whisper API uyumlu.

### LLM (OpenRouter)
Dil modeli çıkarımı. OpenRouter üzerinden çeşitli modellere erişim.

## 📖 Kaynaklar

- [fal.ai Dökümantasyonu](https://docs.fal.ai)
- [fal.ai JS Client GitHub](https://github.com/fal-ai/fal-js)
- [@fal-ai/client npm](https://www.npmjs.com/package/@fal-ai/client)

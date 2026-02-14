# docs

fal.ai platformu ve Freya STT/TTS modelleri ile ilgili entegrasyon dokümantasyonunu ve örnek kodları içerir. Geliştiricilerin ses boru hattını anlaması ve uygulaması için referans kaynağıdır.

## Görevleri

- fal.ai SDK kullanım örnekleri sunma
- Freya STT/TTS uç noktalarını belgeleme
- OpenAI uyumlu kullanım örnekleri sağlama
- LiveKit entegrasyon rehberi sunma

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `README.md` | Genel bakış ve hızlı başlangıç |
| `endpoints.md` | Tüm Freya STT/TTS uç noktalarının detaylı referansı |
| `setup.md` | fal.ai istemci kurulumu ve yapılandırması |
| `freya-tts-streaming.ts` | Gerçek zamanlı TTS akış örneği (PCM16 formatında) |
| `freya-tts-openai-compat.ts` | OpenAI uyumlu TTS kullanım örneği |
| `freya-pipeline.ts` | TTS ve STT boru hattı örneği (metin, ses, metin döngüsü) |
| `freya-livekit.ts` | LiveKit ile gerçek zamanlı sesli iletişim entegrasyonu |

## Uç Nokta Bilgisi

### Metinden Konuşmaya (TTS)
- Uç nokta: `freya-mypsdi253hbk/freya-tts`
- `/generate` — CDN URL'si ile ses üretimi
- `/stream` — PCM16 formatında gerçek zamanlı akış
- `/audio/speech` — OpenAI uyumlu ikili ses yanıtı

### Konuşmadan Metne (STT)
- Uç nokta: `freya-mypsdi253hbk/freya-stt`
- `/audio/transcriptions` — OpenAI uyumlu çeviri yazımı
- `/generate` — fal.subscribe ile çeviri yazımı

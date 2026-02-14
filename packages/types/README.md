# packages/types

Monorepo genelinde paylaşılan TypeScript tip tanımlarını içerir. `@ffh/types` paket adıyla hem API hem de web uygulaması tarafından kullanılır.

## Görevleri

- API ve istemci arasında ortak veri yapılarını tanımlama
- WebSocket mesaj protokolünü tiplendirme
- Mülakat, soru, rapor ve kullanıcı ile ilgili tüm arayüzleri merkezi olarak yönetme

## Tanımlanan Başlıca Tipler

### Mülakat Tipleri
- `InterviewType` — Mülakat türleri (canlı kodlama, sistem tasarımı, telefon mülakatı, pratik)
- `InterviewStatus` — Mülakat durumları (oluşturuldu, devam ediyor, tamamlandı, değerlendirildi)
- `Difficulty` — Zorluk seviyeleri (kolay, orta, zor)
- `Interview` — Mülakat veri yapısı
- `Message` — Sohbet mesajı yapısı

### Ses Boru Hattı Tipleri
- `VoicePipelineState` — Ses boru hattı durumları (boşta, dinliyor, işliyor, konuşuyor)
- `ClientMessage` — İstemciden sunucuya WebSocket mesajları
- `ServerMessage` — Sunucudan istemciye WebSocket mesajları
- `MessageRole` — Mesaj rolleri (kullanıcı, asistan, sistem)

### Soru ve Kod Tipleri
- `Problem` — Kodlama sorusu yapısı
- `TestCase` — Test senaryosu yapısı
- `TestResult` — Test sonucu yapısı
- `CodeLanguage` — Desteklenen programlama dilleri

### Rapor Tipleri
- `InterviewResult` — Mülakat sonuç raporu
- `CategoryScores` — Kategori bazlı puanlar

### Beyaz Tahta Tipleri
- `WhiteboardState` — Beyaz tahta durumu (bileşenler, bağlantılar, metin temsili)

## Kullanım

```typescript
import type { Interview, ServerMessage, VoicePipelineState } from "@ffh/types";
```

## Dosya Yapısı

```
src/
  index.ts    Tüm tip tanımları ve dışa aktarmaları
```

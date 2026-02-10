# Faz 5 — Phone Screen & Practice Modülleri

> **Öncelik:** 🟡 P2  
> **Bağımlılık:** Faz 1 (voice pipeline), Faz 2 (oturum yönetimi)  
> **Tahmini süre:** 1-2 gün

## Amaç

İki hafif mülakat modu: (A) Phone Screen — sadece sesli, davranışsal + teknik sorularla iletişim becerisi ölçen simülasyon. (B) Practice Coding — baskısız serbest kodlama egzersizi. Bunlar Faz 1 ve Faz 3'ün üzerine minimal eklemeyle yapılabilir.

---

## Görevler

### 5A — Phone Screen Modu

#### 5A.1 — Sadece Ses Arayüzü

- [ ] Mülakat odası layout'u: Kod editörü ve whiteboard **yok**
- [ ] Tam ekran ses arayüzü:
  - Ortada AI avatar / ses dalgası animasyonu
  - Alt kısımda mikrofon kontrolleri
  - Üstte timer ve mülakat bilgisi
  - Konuşma baloncukları (subtitle): AI'ın ve kullanıcının söyledikleri
- [ ] Görsel odak ses etkileşiminde — dikkat dağıtıcı UI yok

#### 5A.2 — Phone Screen AI Prompt'u

- [ ] `apps/api/src/prompts/phone-screen.ts` system prompt:
  - Davranışsal sorular: "Bana en zorlandığın bir proje anlat"
  - Teknik bilgi soruları: "REST ile GraphQL arasındaki farklar nedir?"
  - Takip soruları: Cevaba göre derinleştirme ("Peki o durumda ne yaptın?")
  - İletişim değerlendirmesi: Açıklık, yapılandırma, örneklerle anlatım
- [ ] Soru havuzu kategorileri:
  - Behavioral (davranışsal)
  - Technical knowledge (teknik bilgi)
  - Problem solving (problem çözme yaklaşımı, sözel)
  - Culture fit (kültür uyumu)
- [ ] Mülakat akışı:
  1. AI kendini tanıtır, format açıklar
  2. Sırayla sorular sorar (config'deki soru sayısı kadar)
  3. Her cevap sonrası 0-1 takip sorusu
  4. Bitiş: Teşekkür + "Sorun var mı?" sorusu
  5. Mülakat tamamlanır

#### 5A.3 — Zaman Yönetimi

- [ ] Soru başına önerilen süre göstergesi (ör: 3-5 dakika)
- [ ] Toplam süre limiti (varsayılan: 20-30 dakika)
- [ ] Süre dolmak üzereyken AI'ın nazikçe geçiş yapması: "Son bir soru soracağım..."

---

### 5B — Practice Coding Modu

#### 5B.1 — Baskısız Ortam

- [ ] Live Coding layout'unu kullan (Faz 3'ten) ama:
  - Timer **yok** veya opsiyonel
  - AI değerlendirmesi daha yumuşak ton
  - "Yanlış" demek yerine öğretici yaklaşım
- [ ] AI prompt farkı (practice-specific):
  - Daha sabırlı ve destekleyici
  - Açık ipuçları veriyor (hint sistemi)
  - Öğretici açıklamalar yapıyor
  - "Stres yapma, birlikte çözelim" tonu

#### 5B.2 — İpucu (Hint) Sistemi

- [ ] Kullanıcı sesli "ipucu ver" / "hint" diyebilir
- [ ] Kademeli ipuçları:
  1. Genel yaklaşım: "Bu problemi HashMap ile çözmeyi düşün"
  2. Detaylı yönlendirme: "Her elemanı iterate ederken complement'ı HashMap'te ara"
  3. Pseudo-code: "for each num: if (target - num) in map → return"
- [ ] İpucu sayısı raporda gösterilir (Faz 7)

#### 5B.3 — Çözüm Karşılaştırması

- [ ] Kullanıcı "çözdüm" veya tüm testler geçince:
  - Optimal çözümü göster (problem veritabanından)
  - AI sesli açıklama: Farklar, neden optimal, complexity analizi
- [ ] Side-by-side diff view: Kullanıcı çözümü vs optimal çözüm
- [ ] Bu mod'da skor hesaplanmaz (veya opsiyonel)

---

## UI Layout (Phone Screen)

```
┌─────────────────────────────────────────────────────────┐
│  ⏱ 08:15  │  Phone Screen  │  Soru 3/5  │  [Bitir]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ╭─────────╮                          │
│                    │  🤖 AI  │                          │
│                    ╰────┬────╯                          │
│                         │                               │
│               ◉ ◉ ◉ ◉ ◉ ◉ ◉ ◉  (ses dalgası)          │
│                                                         │
│     ┌───────────────────────────────────────────┐       │
│     │ "REST stateless bir protokoldür ve her     │      │
│     │  istek tüm bilgiyi taşır. GraphQL ise..." │      │
│     └───────────────────────────────────────────┘       │
│                                                         │
│     ┌───────────────────────────────────────────┐       │
│     │ 🤖 "REST ile GraphQL arasındaki temel     │      │
│     │  farkları açıklar mısın?"                  │      │
│     └───────────────────────────────────────────┘       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│           🎙️ [Mikrofon]     🔊 Ses: ████░░░            │
└─────────────────────────────────────────────────────────┘
```

---

## Tamamlanma Kriterleri

1. Phone Screen modu: Sadece sesli mülakat çalışıyor, kod editörü yok
2. Phone Screen AI: Davranışsal + teknik sorular sorup takip sorusu sorabiliyor
3. Practice modu: Live Coding layout'u ile çalışıyor ama daha yumuşak ton
4. İpucu sistemi: "ipucu ver" komutuyla kademeli ipuçları alınabiliyor
5. Practice modda çözüm sonrası optimal çözüm gösterimi
6. Her iki mod da oturum olarak kaydediliyor (Faz 2)

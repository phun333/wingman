# Faz 3 — Live Coding Modülü

> **Öncelik:** 🟠 P1  
> **Bağımlılık:** Faz 1 (voice pipeline), Faz 2 (oturum yönetimi, problem bankası)  
> **Tahmini süre:** 3-4 gün

## Amaç

Sol tarafta problem açıklaması, sağda kod editörü olan canlı kodlama mülakatı. AI mülakatçı hem sesle iletişim kuruyor hem de kodu gerçek zamanlı analiz ediyor. Kullanıcının yazdığı kod çalıştırılabiliyor ve test sonuçları AI'a iletiliyor.

---

## Görevler

### 3.1 — Kod Editörü Entegrasyonu (Monaco Editor)

Mülakat odasına Monaco Editor (VS Code'un editörü) ekle.

- [ ] `@monaco-editor/react` paketini ekle: `bun add @monaco-editor/react --filter @ffh/web`
- [ ] Mülakat odası layout'unu ikiye böl:
  - **Sol panel:** Problem açıklaması (Markdown render)
  - **Sağ panel:** Monaco Editor
- [ ] Editör ayarları:
  - Tema: Dark mode ile uyumlu (`vs-dark`)
  - Font: JetBrains Mono, 14px
  - Line numbers: Açık
  - Minimap: Kapalı (ekran alanı kazanmak için)
  - Word wrap: Açık
- [ ] Dil seçimi dropdown: JavaScript, TypeScript, Python
  - Dil değiştiğinde editör syntax highlighting güncellenmeli
  - Starter code dile göre yüklenmeli
- [ ] Panel yeniden boyutlandırma (resizable splitter)

---

### 3.2 — Problem Görünümü

Sol panelde problem detaylarının gösterimi.

- [ ] Problem başlığı, zorluk badge'i (Easy/Medium/Hard renkli)
- [ ] Problem açıklaması (Markdown → HTML render)
- [ ] Örnek input/output blokları (kod formatında)
- [ ] Kısıtlamalar (constraints) listesi
- [ ] Mülakat başladığında problem'i Convex'ten çek (`getRandom` veya belirli)
- [ ] Problem seçimi: AI'ın söylediği zorluk seviyesine göre veya config'den

---

### 3.3 — Kod Çalıştırma (Sandbox)

Kullanıcının yazdığı kodu güvenli bir ortamda çalıştır.

- [ ] API'de kod çalıştırma endpoint'i: `POST /rpc/executeCode`
- [ ] **Sandbox yaklaşımı** (güvenlik sıralamasıyla):
  1. **Bun subprocess** (basit): `Bun.spawn` ile child process'te çalıştır
     - Timeout: 5 saniye
     - Memory limit: 256MB
     - Network erişimi yok
  2. **(İleri)** isolated-vm veya WebContainer API
- [ ] Input/Output:
  ```typescript
  // Input
  { code: string, language: "javascript" | "python" | "typescript", testCases: TestCase[] }
  
  // Output
  { 
    results: Array<{ input: string, expected: string, actual: string, passed: boolean }>,
    stdout: string,
    stderr: string,
    executionTimeMs: number,
    error?: string  // Compile/runtime error
  }
  ```
- [ ] Test case çalıştırma: Her test case için kodu çalıştır, output'u karşılaştır
- [ ] "Çalıştır" butonu UI'da
- [ ] Sonuçlar: Editörün altında test sonuç paneli (passed ✅ / failed ❌)
- [ ] Console output paneli: stdout + stderr gösterimi

**Dosya:** `apps/api/src/routes/code.ts`

---

### 3.4 — AI'ın Kodu Gerçek Zamanlı Analizi

AI mülakatçının kodu okuması ve yorum yapması.

- [ ] **Kod paylaşımı mekanizması:**
  - Editör içeriği değiştiğinde (debounce: 2-3 saniye) WebSocket üzerinden API'ye gönder
  - Mesaj tipi: `{ type: "code_update", code: string, language: string }`
- [ ] **AI'a kod context'i sağlama:**
  - LLM system prompt'una "Şu anda kullanıcının kodu:" bölümü ekle
  - Her LLM çağrısında güncel kodu context'e dahil et
- [ ] **AI'ın sesli kod analizi tetikleyicileri:**
  - Kullanıcı sesli olarak "kontrol et" / "bak" / "nasıl olmuş" dediğinde
  - Kullanıcı kodu çalıştırdığında (test sonuçlarıyla birlikte)
  - AI'ın kendi inisiyatifiyle (uzun süre sessizlik + kod değişikliği)
- [ ] **Analiz türleri:**
  - Syntax/mantık hata tespiti: "Satır 15'te bir değişken tanımlamışsın ama kullanmamışsın"
  - İpucu verme: "Bu problemi çözmek için HashMap düşün"
  - Yönlendirme: "Edge case'leri düşündün mü? Boş array gelirse ne olur?"

---

### 3.5 — Konsol / Log Okuma

Kod çalıştırma sonuçlarını AI'a iletme.

- [ ] Kod çalıştırıldığında sonuçları WebSocket'e gönder:
  ```typescript
  { type: "code_result", results: [...], stdout: "...", stderr: "...", error: "..." }
  ```
- [ ] AI'ın sonuçları yorumlaması:
  - "3 testten 2'si geçmiş, üçüncü test'te beklenen X ama sen Y döndürmüşsün"
  - "Runtime error aldın, TypeError: Cannot read property — muhtemelen null check eksik"
  - "Tüm testler geçti, güzel! Şimdi time complexity'yi konuşalım"
- [ ] Hata mesajlarını açıklama: AI stack trace okuyup anlaşılır açıklama yapabilmeli

---

### 3.6 — Mülakat Akışı Entegrasyonu

Live Coding mülakatının baştan sona akışı.

- [ ] **Başlangıç:**
  1. Mülakat oluştur (type: `live-coding`, difficulty seçili)
  2. Problem seç (rastgele veya zorluk/kategori filtreli)
  3. Problem sol panelde gösterilir
  4. Editöre starter code yüklenir
  5. AI kendini tanıtır ve problemi sesli açıklar
- [ ] **Süre boyunca:**
  1. Kullanıcı kodu yazar + AI ile sesli iletişim kurar
  2. AI kodu analiz eder, ipucu verir, soru sorar
  3. Kullanıcı kodu çalıştırır, AI sonuçları yorumlar
- [ ] **Bitiş:**
  1. Tüm testler geçtiğinde veya süre dolduğunda
  2. Son kod hali kaydedilir (message olarak veya ayrı field)
  3. Mülakat `completed` olur
  4. Rapor sayfasına yönlendir (Faz 7)
- [ ] Kodun Convex'te saklanması: `interviewCode` field veya ayrı `submissions` tablosu

---

## UI Layout (Live Coding)

```
┌─────────────────────────────────────────────────────────┐
│  ⏱ 12:34  │  Live Coding  │  JavaScript  │  [Bitir]    │
├────────────────────┬────────────────────────────────────┤
│                    │                                    │
│  📋 Problem        │  📝 Kod Editörü (Monaco)          │
│                    │                                    │
│  Two Sum           │  function twoSum(nums, target) {   │
│  ────────          │    // Kodunuzu buraya yazın        │
│  Easy 🟢           │  }                                │
│                    │                                    │
│  Verilen bir tam   │                                    │
│  sayı dizisi ve    │                                    │
│  hedef değer...    ├────────────────────────────────────┤
│                    │  📊 Test Sonuçları                 │
│  Örnek 1:          │  ✅ Test 1: [2,7,11,15], 9 → [0,1]│
│  Input: [2,7...]   │  ❌ Test 2: [3,2,4], 6 → [1,2]   │
│  Output: [0,1]     │  ▶ Çalıştır                       │
├────────────────────┴────────────────────────────────────┤
│  🎙️ [Mikrofon] ──── 🤖 "İpucu: HashMap düşün..."       │
└─────────────────────────────────────────────────────────┘
```

---

## Tamamlanma Kriterleri

1. Monaco Editor mülakat odasında açılıyor, kod yazılabiliyor
2. Problem sol panelde render ediliyor (Markdown)
3. Kod çalıştırma çalışıyor: Test sonuçları görünüyor
4. AI kodu sesli analiz edebiliyor ("Burada hata var" gibi)
5. AI test sonuçlarını sesli yorumlayabiliyor
6. Dil seçimi çalışıyor (JS, TS, Python)
7. Kod ve mesajlar Convex'e kaydediliyor

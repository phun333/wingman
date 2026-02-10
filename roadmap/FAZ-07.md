# Faz 7 — Raporlama & Geri Bildirim

> **Öncelik:** 🟡 P2  
> **Bağımlılık:** Faz 2 (oturum yönetimi), Faz 3 (live coding — kod analizi için), Faz 6 (memory — kümülatif veri)  
> **Tahmini süre:** 2-3 gün

## Amaç

Mülakat sonrası detaylı rapor oluşturma, zaman içindeki ilerlemeyi grafiklendirme, güçlü/zayıf yön analizi. Kullanıcının kendini nasıl geliştireceğini somut olarak görmesi.

---

## Görevler

### 7.1 — Convex Schema (Rapor Tablosu)

- [ ] `convex/schema.ts`'ye `interviewResults` tablosu ekle:
  ```typescript
  interviewResults: defineTable({
    interviewId: v.id("interviews"),
    userId: v.id("users"),
    
    // Genel skor
    overallScore: v.number(),          // 0-100
    hireRecommendation: v.union(
      v.literal("strong-hire"),
      v.literal("hire"),
      v.literal("lean-hire"),
      v.literal("no-hire")
    ),
    
    // Kategori skorları
    categoryScores: v.object({
      problemSolving: v.number(),      // 0-100
      communication: v.number(),
      codeQuality: v.optional(v.number()),     // Live Coding only
      systemThinking: v.optional(v.number()),  // System Design only
      analyticalThinking: v.number(),
    }),
    
    // Kod analizi (Live Coding)
    codeAnalysis: v.optional(v.object({
      timeComplexity: v.string(),        // "O(n)"
      spaceComplexity: v.string(),       // "O(1)"
      userSolution: v.string(),          // Kullanıcının kodu
      optimalSolution: v.string(),       // Optimal çözüm
      optimizationSuggestions: v.array(v.string()),
    })),
    
    // Güçlü ve zayıf yönler
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    
    // Genel yorum
    summary: v.string(),               // LLM tarafından yazılmış detaylı yorum
    nextSteps: v.array(v.string()),    // Önerilen sonraki adımlar
    
    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),
  ```

**Dosya:** `convex/schema.ts`, `convex/interviewResults.ts`

---

### 7.2 — Rapor Oluşturma (LLM ile)

Mülakat bittiğinde otomatik rapor üretme.

- [ ] Mülakat `completed` olduğunda rapor oluşturma akışı tetikle
- [ ] LLM'e gönderilecek context:
  - Tüm mesaj geçmişi (transkript)
  - Problem bilgisi (varsa)
  - Kullanıcının son kodu (Live Coding ise)
  - Test sonuçları (Live Coding ise)
  - Whiteboard state (System Design ise)
  - Mülakat config'i (tür, zorluk, süre)
- [ ] LLM'den yapılandırılmış rapor çıktısı al (JSON mode):
  ```typescript
  // System prompt: "Aşağıdaki mülakat transkriptini analiz et ve JSON formatında rapor üret..."
  {
    overallScore: 75,
    hireRecommendation: "hire",
    categoryScores: { ... },
    codeAnalysis: { ... },  // Live Coding ise
    strengths: ["Problem çözme yaklaşımı iyi", "Edge case'leri düşünmüş"],
    weaknesses: ["Zaman karmaşıklığını optimize edemedi", "Değişken isimlendirmesi zayıf"],
    summary: "Aday genel olarak iyi performans gösterdi...",
    nextSteps: ["HashMap konusuna çalış", "Clean code pratikleri öğren"],
  }
  ```
- [ ] Raporu Convex'e kaydet
- [ ] Memory sistemi güncelle (Faz 6.5): Güçlü/zayıf yönleri kümüle et

**Dosyalar:**
- `apps/api/src/routes/reports.ts`
- `apps/api/src/services/report-generator.ts`
- `convex/interviewResults.ts`

---

### 7.3 — Rapor Sayfası UI

`/interview/:id/report` sayfası.

- [ ] **Skor kartı:**
  - Büyük daire içinde genel skor (0-100, renkli)
  - Hire recommendation badge (Strong Hire 🟢 / Hire 🟡 / No Hire 🔴)
- [ ] **Kategori skorları:**
  - Progress bar'lar: Problem Solving, Communication, Code Quality, vb.
  - Her kategoride kısa açıklama tooltip
- [ ] **Kod analizi bölümü** (Live Coding mülakatları):
  - Time Complexity: `O(n²)` → Önerilen: `O(n)`
  - Space Complexity: `O(n)` → Önerilen: `O(1)`
  - **Diff view:** Kullanıcı kodu vs Optimal çözüm yan yana
    - Kütüphane: `react-diff-viewer` veya Monaco diff editor
  - Optimizasyon önerileri listesi
- [ ] **Güçlü yönler:** ✅ ikonlu yeşil liste
- [ ] **Zayıf yönler:** ⚠️ ikonlu turuncu liste
- [ ] **Sonraki adımlar:** 📌 ikonlu öneriler listesi
- [ ] **Genel yorum:** LLM tarafından yazılmış paragraf
- [ ] **Transkript:** Genişletilebilir accordion — tüm konuşma geçmişi
- [ ] **Paylaşma:** Rapor linkini kopyala (public URL, opsiyonel)

---

### 7.4 — İlerleme Grafikleri

`/progress` sayfası — zaman içindeki gelişim.

- [ ] **Grafik kütüphanesi ekle:** `bun add recharts --filter @ffh/web` (veya Chart.js)
- [ ] **Skor zaman grafiği (Line Chart):**
  - X ekseni: Tarih
  - Y ekseni: Genel skor (0-100)
  - Mülakat türüne göre renk kodlama
  - Trend çizgisi (hareketli ortalama)
- [ ] **Yetenek radar chart:**
  - Eksenler: Problem Solving, Communication, Code Quality, System Thinking, Analytical
  - Son mülakat vs 5 mülakat ortalaması karşılaştırma
- [ ] **İstatistik kartları:**
  - Toplam mülakat sayısı
  - Ortalama skor
  - En yüksek skor
  - Bu ayki mülakat sayısı
  - Streak (art arda günler)
- [ ] **Mülakat geçmişi tablosu:**
  - Tarih | Tür | Zorluk | Skor | Hire Rec | Detay linki
  - Sıralama ve filtreleme
  - Pagination

---

### 7.5 — Güçlü/Zayıf Yön Kümülatif Analizi

Birden fazla mülakatın birleştirilmiş analizi.

- [ ] Son 10 mülakatın güçlü/zayıf yönlerini kümüle et
- [ ] En sık tekrar eden güçlü yönler (top 5)
- [ ] En sık tekrar eden zayıf yönler (top 5)
- [ ] Zayıf yönlerdeki değişim: "3 mülakat önce DP zordu, şimdi orta seviyedesin"
- [ ] Önerilen odak alanları: Zayıf yönlere göre ilgili problem kategorileri

---

## Tamamlanma Kriterleri

1. Mülakat bittiğinde otomatik rapor oluşuyor
2. Rapor sayfasında skor, kategori puanları, güçlü/zayıf yönler görünüyor
3. Live Coding raporlarında kod analizi + diff view çalışıyor
4. İlerleme sayfasında zaman serisi grafik ve radar chart var
5. Mülakat geçmişi tablosu filtrelenebiliyor ve sıralanabiliyor
6. Kümülatif güçlü/zayıf yön analizi gösteriliyor

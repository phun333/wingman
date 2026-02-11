# Faz 6 — Kişiselleştirme & Hazırlık Araçları ✅

> **Öncelik:** 🟢 P3  
> **Bağımlılık:** Faz 2 (oturum yönetimi)  
> **Tahmini süre:** 3-4 gün  
> **Durum:** ✅ Tamamlandı (10 Şubat 2026)

## Amaç

Mülakatı kullanıcıya ve hedef pozisyona özel hale getir. İş ilanı URL'si yapıştırarak ilana özel mülakat, özgeçmiş yükleyerek kişiye özel sorular, ve geçmiş performansı hatırlayan hafıza sistemi.

---

## Görevler

### 6.1 — İş İlanı Entegrasyonu (Job Parsing)

İş ilanı URL'sinden otomatik analiz ve ilana özel mülakat oluşturma.

- [ ] **UI:** Mülakat başlatma wizard'ına (Faz 9.7) "İş İlanı URL'si" input alanı ekle
- [ ] **API endpoint:** `POST /rpc/parseJobPosting`
  ```typescript
  // Input
  { url: string }  // LinkedIn, Greenhouse, Lever, vb.
  
  // Output
  {
    title: string,              // "Senior Backend Engineer"
    company: string,            // "Acme Corp"
    requirements: string[],     // ["5+ years experience", "Go or Rust", ...]
    skills: string[],           // ["distributed systems", "kubernetes", ...]
    level: string,              // "senior"
    description: string,        // Ham açıklama metni
  }
  ```
- [ ] **URL'den içerik çekme:**
  - Basit yaklaşım: `fetch(url)` → HTML → metin çıkarımı (readability/cheerio)
  - Alternatif: Headless browser ile (Playwright — zaten MCP'de var)
  - Fallback: Kullanıcı ilan metnini manuel yapıştırsın (textarea)
- [ ] **LLM ile analiz:**
  - Çekilen metni LLM'e gönder
  - Yapılandırılmış veri çıkarımı (JSON mode veya function calling)
  - Gereksinimler, yetenekler, seviye, beklentiler
- [ ] **Convex'e kaydetme:** `jobPostings` tablosu
  ```typescript
  jobPostings: defineTable({
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    company: v.optional(v.string()),
    requirements: v.array(v.string()),
    skills: v.array(v.string()),
    level: v.optional(v.string()),
    rawContent: v.string(),
    parsedAt: v.number(),
  }).index("by_user", ["userId"]),
  ```
- [ ] **İlana özel mülakat:**
  - System prompt'a ilan bilgilerini ekle
  - AI'ın ilana uygun sorular sorması: "Bu pozisyonda Kubernetes deneyimi istenmiş, bu konuda ne biliyorsun?"
  - Zorluk seviyesini ilandan otomatik ayarlama

**Dosyalar:**
- `apps/api/src/routes/jobs.ts`
- `convex/schema.ts` (jobPostings tablosu)
- `convex/jobPostings.ts`

---

### 6.2 — Özgeçmiş (Resume) Yükleme & Analizi

Kullanıcının özgeçmişini analiz ederek kişiselleştirilmiş mülakat.

- [ ] **File upload endpoint:** `POST /rpc/uploadResume`
  - Multipart form-data ile PDF/DOCX dosya kabul et
  - Dosya boyutu limiti: 5MB
  - Desteklenen formatlar: PDF, DOCX
- [ ] **PDF/DOCX → Metin dönüşümü:**
  - PDF: `pdf-parse` veya `pdfjs-dist` paketi
  - DOCX: `mammoth` paketi
  - Ham metni çıkar
- [ ] **LLM ile özgeçmiş analizi:**
  ```typescript
  // LLM'e gönder, yapılandırılmış çıktı al:
  {
    name: string,
    title: string,                // "Senior Software Engineer"
    yearsOfExperience: number,
    skills: string[],             // ["TypeScript", "React", "AWS", ...]
    experience: Array<{
      company: string,
      role: string,
      duration: string,
      highlights: string[],
    }>,
    education: Array<{
      school: string,
      degree: string,
    }>,
    projects: Array<{
      name: string,
      description: string,
    }>,
  }
  ```
- [ ] **Convex'e kaydetme:** `resumes` tablosu
- [ ] **AI'ın özgeçmişe göre soru sorması:**
  - "Özgeçmişinde X şirketinde çalıştığını görüyorum, orada ne yaptın?"
  - "Y projende distributed systems kullanmışsın, bunu detaylandır"
  - "Z teknolojisini ne kadar süredir kullanıyorsun?"
- [ ] Dosyayı Convex file storage'a yükle (opsiyonel, ham metin yeterli)

**Dosyalar:**
- `apps/api/src/routes/resume.ts`
- `convex/schema.ts` (resumes tablosu)
- `convex/resumes.ts`

---

### 6.3 — Profil Kartları

Kullanıcı profil sayfası ve özet kartlar.

- [ ] **Profil sayfası (`/settings/profile`):**
  - İsim, email (better-auth'tan)
  - Tutku alanları (tags): "Backend", "Distributed Systems", "ML"
  - Hedefler: "FAANG'a girmek", "Senior pozisyon" gibi serbest metin
  - Aktif projeler listesi
- [ ] **Otomatik profil kartı:**
  - Özgeçmiş + mülakat geçmişinden kümülatif bilgi
  - Güçlü yönler (Faz 7'den), deneyim özeti
  - Mülakat istatistikleri: Toplam sayı, ortalama skor
- [ ] Profil kartı mülakat başlangıcında AI context'ine eklenir

**Dosyalar:**
- `convex/schema.ts` (users tablosuna ek alanlar veya `userProfiles` tablosu)

---

### 6.4 — Mülakat Ayarları (Genişletme)

Faz 9.7'deki wizard'ı genişlet.

- [ ] **Soru sayısı:** Slider veya select (1-10, varsayılan 5)
- [ ] **Mülakat türü alt seçenekleri:**
  - Genel: Rastgele sorular
  - Spesifik: Belirli kategori (Array, DP, System Design vb.)
- [ ] **Süre limiti:** 15 / 30 / 45 / 60 dakika veya sınırsız
- [ ] **Dil seçimi:** Türkçe / İngilizce (hem AI konuşması hem TTS dili)
- [ ] **İleri ayarlar:**
  - İş ilanı seç (daha önce parse edilmişler dropdown)
  - Özgeçmiş seç (yüklenmişler dropdown)
  - Hafıza kullan toggle (6.5)

---

### 6.5 — Hafıza (Memory) Sistemi

Geçmiş mülakatlardan öğrenilmiş bilgileri kullanma.

- [ ] **Kümülatif profil verisi:**
  - Her mülakat sonrası güçlü/zayıf yönleri güncelle
  - Hangi konularda tekrar tekrar zorlandığını takip et
  - Zaman içindeki gelişim trendleri
- [ ] **Convex'te `userMemory` tablosu:**
  ```typescript
  userMemory: defineTable({
    userId: v.id("users"),
    key: v.string(),          // "weak_topics", "strong_topics", "preferences"
    value: v.string(),         // JSON string
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  ```
- [ ] **Memory toggle:**
  - UI'da "Geçmiş performansımı hatırla" checkbox
  - Açıkken: AI system prompt'una memory context eklenir
  - Kapalıyken: Her mülakat temiz slate
- [ ] **AI davranış uyarlaması:**
  - "Geçen sefer array sorularında zorlanmıştın, bugün tekrar deneyelim"
  - "İletişim becerilerin çok gelişmiş, tebrikler!"
  - "Dynamic programming konusunda 3 mülakattır gelişme var"

---

## Tamamlanma Kriterleri

1. İş ilanı URL'si yapıştırılıp analiz ediliyor
2. İlana özel mülakat oluşturuluyor (AI ilgili sorular soruyor)
3. Özgeçmiş (PDF/DOCX) yüklenip analiz ediliyor
4. AI özgeçmişe göre sorular sorabiliyor
5. Profil kartı oluşuyor ve güncellenebiliyor
6. Hafıza sistemi çalışıyor: Geçmiş performans AI'a aktarılıyor
7. Tüm ayarlar mülakat başlatma wizard'ında seçilebiliyor

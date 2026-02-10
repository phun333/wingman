# Faz 8 — Enterprise Panel (İşe Alımcılar)

> **Öncelik:** 🔵 P4  
> **Bağımlılık:** Faz 2 (oturum yönetimi), Faz 7 (raporlama)  
> **Tahmini süre:** 5-7 gün

## Amaç

Şirketlerin aday değerlendirmesini yönettiği kurumsal panel. Pozisyon oluşturma, adaylara mülakat linki gönderme, sonuçları takip etme, hiring pipeline görselleştirmesi.

---

## Görevler

### 8.1 — Convex Schema (Enterprise Tabloları)

- [ ] `convex/schema.ts`'ye kurumsal tablolar ekle:

```typescript
// Organizasyonlar
organizations: defineTable({
  name: v.string(),
  slug: v.string(),           // URL-friendly: "acme-corp"
  logoUrl: v.optional(v.string()),
  plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  createdAt: v.number(),
})
  .index("by_slug", ["slug"]),

// Organizasyon üyelikleri
orgMembers: defineTable({
  orgId: v.id("organizations"),
  userId: v.id("users"),
  role: v.union(
    v.literal("admin"),
    v.literal("recruiter"),
    v.literal("hiring-manager"),
    v.literal("viewer")
  ),
  joinedAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_user", ["userId"])
  .index("by_org_user", ["orgId", "userId"]),

// Pozisyonlar
positions: defineTable({
  orgId: v.id("organizations"),
  title: v.string(),           // "Senior Backend Engineer"
  description: v.string(),
  requirements: v.array(v.string()),
  skills: v.array(v.string()),
  level: v.string(),           // "junior", "mid", "senior", "lead"
  status: v.union(
    v.literal("open"),
    v.literal("closed"),
    v.literal("archived")
  ),
  interviewConfig: v.object({
    type: v.string(),
    difficulty: v.string(),
    questionCount: v.number(),
    language: v.string(),
  }),
  jobPostingId: v.optional(v.id("jobPostings")),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_org_status", ["orgId", "status"]),

// Aday başvuruları
applications: defineTable({
  positionId: v.id("positions"),
  orgId: v.id("organizations"),
  candidateUserId: v.optional(v.id("users")),  // Kayıtlı kullanıcı (opsiyonel)
  candidateEmail: v.string(),
  candidateName: v.string(),
  status: v.union(
    v.literal("invited"),
    v.literal("in-progress"),
    v.literal("completed"),
    v.literal("reviewed"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  interviewId: v.optional(v.id("interviews")),
  inviteToken: v.string(),       // Unique davet linki token'ı
  invitedAt: v.number(),
  completedAt: v.optional(v.number()),
  reviewedAt: v.optional(v.number()),
  reviewerNotes: v.optional(v.string()),
})
  .index("by_position", ["positionId"])
  .index("by_org", ["orgId"])
  .index("by_invite_token", ["inviteToken"])
  .index("by_org_status", ["orgId", "status"]),
```

**Dosyalar:**
- `convex/schema.ts`
- `convex/organizations.ts`
- `convex/positions.ts`
- `convex/applications.ts`

---

### 8.2 — Organizasyon Yönetimi

- [ ] Organizasyon oluşturma mutation
- [ ] Üye davet etme: Email ile davet gönderme
- [ ] Rol yönetimi: Admin, Recruiter, Hiring Manager, Viewer
- [ ] Organizasyon ayarları: İsim, logo, plan
- [ ] Convex fonksiyonlarında org auth middleware:
  ```typescript
  // Her org fonksiyonunda:
  // 1. Kullanıcıyı doğrula
  // 2. orgId ile üyelik kontrolü
  // 3. Rol kontrolü (ör: sadece admin pozisyon oluşturabilir)
  ```

---

### 8.3 — Pozisyon Yönetimi

- [ ] Pozisyon oluşturma (API + UI):
  - Manuel: Başlık, açıklama, gereksinimler form'u
  - Otomatik: İş ilanı URL'sinden (Faz 6.1 job parsing kullan)
- [ ] Pozisyona özel mülakat config: Tür, zorluk, soru sayısı, dil
- [ ] Pozisyon listesi: Açık, Kapalı, Arşiv filtreli
- [ ] Pozisyon detay sayfası: Başvurular, istatistikler

---

### 8.4 — Aday Davet & Mülakat Linki

- [ ] **Davet linki oluşturma:**
  - Her aday için unique token üret
  - Link formatı: `https://app.example.com/invite/{token}`
  - Token'a pozisyon ve mülakat config'i bağlı
- [ ] **Davet akışı:**
  1. Recruiter aday email'i girer
  2. Sistem unique link oluşturur
  3. (Opsiyonel) Email ile gönderim
  4. Aday linke tıklar → Kayıt/Giriş → Mülakat başlar
- [ ] **Hesapsız giriş (opsiyonel):**
  - Aday hesap oluşturmadan isim+email ile mülakat başlatabilir
  - Token ile geçici session
- [ ] **Bildirim:** Mülakat tamamlandığında recruiter'a (in-app veya email)

---

### 8.5 — İşe Alım Paneli (Dashboard)

`/enterprise` altında kurumsal dashboard.

- [ ] **Genel bakış kartları:**
  - Açık pozisyon sayısı
  - Toplam başvuru sayısı
  - Bu hafta tamamlanan mülakatlar
  - Ortalama aday skoru
- [ ] **Pozisyon listesi:**
  - Pozisyon adı | Başvuru sayısı | Ortalama skor | Durum
  - Her satırda detaya git linki
- [ ] **Son aktiviteler:**
  - "Ahmet, Backend Engineer mülakatını tamamladı (78/100)"
  - "Yeni başvuru: Mehmet — Frontend Developer"

---

### 8.6 — Aday Takip Paneli

Pozisyon bazlı aday listesi ve detayları.

- [ ] **Aday listesi tablosu:**
  - Aday adı | Email | Durum | Mülakat tarihi | Skor | Hire Rec
  - Sıralama: Skor, tarih, durum
  - Filtreleme: Durum, skor aralığı
- [ ] **Aday detay sayfası:**
  - Tüm mülakat raporları (Faz 7'den)
  - Kod analizi (Live Coding ise)
  - Konuşma transkripti
  - Recruiter not alanı
- [ ] **Toplu işlemler:**
  - Birden fazla aday seç → "Rejected" / "Next Round" olarak işaretle
  - Toplu email gönderimi (opsiyonel)
- [ ] **Karşılaştırma:** İki adayı yan yana kıyaslama

---

### 8.7 — Hiring Pipeline Grafikleri

İşe alım sürecinin verimliliğini gösteren görselleştirmeler.

- [ ] **Funnel chart:**
  ```
  Invited        ████████████████████████  50
  In Progress    ████████████████          35
  Completed      ████████████              28
  Reviewed       ████████                  18
  Accepted       ████                       8
  ```
- [ ] **Dönüşüm oranları:** Her adımda yüzde kaç devam etti
- [ ] **Zaman metrikleri:**
  - Ortalama davet → tamamlama süresi
  - Ortalama tamamlama → review süresi
- [ ] **Pozisyon bazlı karşılaştırma:** Hangi pozisyon daha hızlı doldu

---

## Sayfa Haritası (Enterprise)

```
/enterprise                        → Dashboard
/enterprise/positions              → Pozisyon listesi
/enterprise/positions/new          → Yeni pozisyon oluştur
/enterprise/positions/:id          → Pozisyon detayı + aday listesi
/enterprise/positions/:id/candidates/:appId → Aday detayı
/enterprise/analytics              → Pipeline grafikleri
/enterprise/settings               → Org ayarları, üye yönetimi
/invite/:token                     → Aday davet linki (public)
```

---

## Tamamlanma Kriterleri

1. Organizasyon oluşturulabiliyor, üye eklenebiliyor
2. Pozisyon oluşturuluyor ve ilana özel mülakat config ayarlanıyor
3. Adaya unique mülakat linki gönderilebiliyor
4. Aday mülakat tamamladığında recruiter raporu görebiliyor
5. Pipeline funnel chart dönüşüm oranlarını gösteriyor
6. Rol bazlı erişim kontrolleri çalışıyor (admin vs recruiter vs viewer)

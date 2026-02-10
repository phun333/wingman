# Faz 2 — Mülakat Oturum Yönetimi

> **Öncelik:** 🟠 P1  
> **Bağımlılık:** Faz 0 (altyapı), Faz 1 (voice pipeline çalışmalı)  
> **Tahmini süre:** 2-3 gün

## Amaç

Mülakatları kalıcı olarak kaydet: Oturum oluşturma, mesaj persistance, AI persona sistemi ve mülakat lifecycle yönetimi. Faz 1'deki voice pipeline "hafızasız" çalışıyor — bu fazda her konuşma veritabanına kaydedilecek.

---

## Görevler

### 2.1 — Convex Schema Genişletme

Mülakat ve mesaj tablolarını Convex schema'ya ekle.

- [ ] `convex/schema.ts`'ye yeni tablolar ekle:

```typescript
// interviews tablosu
interviews: defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("live-coding"),
    v.literal("system-design"),
    v.literal("phone-screen"),
    v.literal("practice")
  ),
  status: v.union(
    v.literal("created"),
    v.literal("in-progress"),
    v.literal("completed"),
    v.literal("evaluated")
  ),
  difficulty: v.union(
    v.literal("easy"),
    v.literal("medium"),
    v.literal("hard")
  ),
  language: v.string(),           // "tr" | "en"
  questionCount: v.number(),       // Planlanan soru sayısı
  config: v.optional(v.any()),     // Ek konfigürasyon (JSON)
  startedAt: v.optional(v.number()),
  endedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_user_status", ["userId", "status"]),

// messages tablosu
messages: defineTable({
  interviewId: v.id("interviews"),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("system")
  ),
  content: v.string(),             // Metin içeriği
  audioUrl: v.optional(v.string()), // Varsa ses dosyası URL'i
  timestamp: v.number(),
})
  .index("by_interview", ["interviewId"])
  .index("by_interview_timestamp", ["interviewId", "timestamp"]),

// problems tablosu (Live Coding için)
problems: defineTable({
  title: v.string(),
  description: v.string(),        // Markdown formatında
  difficulty: v.union(
    v.literal("easy"),
    v.literal("medium"),
    v.literal("hard")
  ),
  category: v.string(),           // "array", "string", "tree", vb.
  starterCode: v.optional(v.object({
    javascript: v.optional(v.string()),
    python: v.optional(v.string()),
    typescript: v.optional(v.string()),
  })),
  testCases: v.array(v.object({
    input: v.string(),
    expectedOutput: v.string(),
    isHidden: v.boolean(),
  })),
  optimalSolution: v.optional(v.string()),
  timeComplexity: v.optional(v.string()),
  spaceComplexity: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_difficulty", ["difficulty"])
  .index("by_category", ["category"]),
```

- [ ] `bunx convex dev` ile schema'yı deploy et ve hata olmadığını doğrula

**Dosyalar:**
- `convex/schema.ts`

---

### 2.2 — Interview CRUD (Convex Functions)

Mülakat oluşturma, güncelleme, sorgulama fonksiyonları.

- [ ] `convex/interviews.ts` dosyası oluştur:
  - `create` mutation — Yeni mülakat oluştur (userId + config)
  - `start` mutation — Mülakatı başlat (status → `in-progress`, `startedAt` set)
  - `complete` mutation — Mülakatı bitir (status → `completed`, `endedAt` set)
  - `getById` query — Tek mülakat getir (auth kontrolü ile)
  - `listByUser` query — Kullanıcının mülakatlarını listele (pagination)
  - `getActive` query — Kullanıcının devam eden mülakatını getir

- [ ] Tüm mutation'larda auth kontrolü:
```typescript
// authComponent.safeGetAuthUser(ctx) ile kullanıcı doğrulama
const user = await authComponent.safeGetAuthUser(ctx);
if (!user) throw new Error("Unauthorized");
```

**Dosya:** `convex/interviews.ts`

---

### 2.3 — Message CRUD (Convex Functions)

Mesaj kaydetme ve okuma fonksiyonları.

- [ ] `convex/messages.ts` dosyası oluştur:
  - `add` mutation — Yeni mesaj ekle (interviewId + role + content)
  - `listByInterview` query — Mülakatın tüm mesajlarını getir (sıralı)
  - `getRecent` query — Son N mesajı getir (LLM context window için)

- [ ] Mesaj ekleme: Voice pipeline'da her konuşma turu sonunda otomatik kaydet
- [ ] İmmutable: Mesajlar düzenlenemez veya silinemez

**Dosya:** `convex/messages.ts`

---

### 2.4 — API Route'ları (oRPC)

API tarafında mülakat yönetimi endpoint'leri.

- [ ] `apps/api/src/routes/interviews.ts` oluştur:
  - `POST /interviews` — Mülakat oluştur
  - `GET /interviews` — Kullanıcının mülakatlarını listele
  - `GET /interviews/:id` — Mülakat detayı
  - `PATCH /interviews/:id/start` — Mülakatı başlat
  - `PATCH /interviews/:id/complete` — Mülakatı bitir
  - `GET /interviews/:id/messages` — Mesajları getir

- [ ] `apps/api/src/router.ts`'yi güncelle — Yeni route'ları ekle
- [ ] Auth middleware: Her route'da kullanıcı doğrulama

**oRPC kalıp:**
```typescript
export const createInterview = os
  .route({ method: "POST", path: "/interviews", summary: "Create interview" })
  .input(z.object({
    type: z.enum(["live-coding", "system-design", "phone-screen", "practice"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    language: z.string().default("tr"),
    questionCount: z.number().min(1).max(10).default(5),
  }))
  .handler(async ({ input }) => {
    // convex.mutation(api.interviews.create, { ...input, userId })
  });
```

**Dosyalar:**
- `apps/api/src/routes/interviews.ts`
- `apps/api/src/router.ts`

---

### 2.5 — Voice Pipeline'a Oturum Entegrasyonu

Faz 1'deki WebSocket voice pipeline'ı oturum-aware hale getir.

- [ ] WebSocket bağlantısında `interviewId` parametresi al
- [ ] Bağlantı açılınca mülakat geçerliliğini kontrol et (var mı, durumu doğru mu)
- [ ] Her konuşma turu (user mesajı + AI cevabı) sonunda mesajları Convex'e kaydet
- [ ] Conversation history'yi Convex'ten yükle (reconnect durumunda)
- [ ] LLM'e gönderilen context: Convex'ten son N mesaj + system prompt

---

### 2.6 — AI Mülakatçı Persona Sistemi

Mülakat türüne göre farklı AI davranışları.

- [ ] System prompt şablonları dosyası: `apps/api/src/prompts/` klasörü
- [ ] **Genel persona:**
  - İsim: Konfigüre edilebilir (varsayılan karakter)
  - Karakter: Profesyonel ama samimi, ara sıra espri yapan
  - Dil: Prompt'ta dil yönergesi (Türkçe/İngilizce)
- [ ] **Mülakat türüne göre prompt'lar:**
  - `live-coding.ts` — Kod sorusu sor, ipucu ver, kodu analiz et
  - `system-design.ts` — Sistem tasarımı sorusu sor, trade-off'ları tartış
  - `phone-screen.ts` — Davranışsal + teknik sorular, iletişim becerisi değerlendir
  - `practice.ts` — Daha destekleyici, öğretici ton
- [ ] **Zorluk seviyesine göre uyarlama:**
  - Easy: Daha fazla ipucu, yönlendirici
  - Medium: Dengeli, gerektiğinde ipucu
  - Hard: Minimum ipucu, zorlayıcı takip soruları

---

### 2.7 — Problem CRUD ve Seed Data

Mülakat soruları veritabanı.

- [ ] `convex/problems.ts` dosyası oluştur:
  - `create` mutation
  - `list` query (filtreli: difficulty, category)
  - `getById` query
  - `getRandom` query (difficulty + category filtresi ile rastgele seçim)

- [ ] Seed data script: 10-15 başlangıç problemi yükle
  - 5 Easy (Two Sum, Reverse String, Palindrome, FizzBuzz, Max Subarray)
  - 5 Medium (Valid Parentheses, LRU Cache, Binary Search, Merge Intervals, Group Anagrams)
  - 5 Hard (Median of Two Sorted Arrays, Regular Expression Matching, Merge K Sorted Lists)

**Dosyalar:**
- `convex/problems.ts`
- `convex/seed.ts` (veya `scripts/seed-problems.ts`)

---

## Tamamlanma Kriterleri

1. Mülakat oluşturuluyor, başlatılıyor, bitiriliyor (full lifecycle)
2. Her konuşma turu Convex'e kaydediliyor
3. Sayfa yenilemesinde konuşma geçmişi korunuyor
4. AI persona mülakat türüne göre farklı davranıyor
5. Problem bankasında en az 15 soru var
6. API route'ları Scalar docs'ta görünüyor (`/docs`)
7. Auth kontrolü: Başka kullanıcının mülakatına erişilemiyor

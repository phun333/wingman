# Faz 4 — System Design Modülü (Whiteboard)

> **Öncelik:** 🟢 P3  
> **Bağımlılık:** Faz 1 (voice pipeline), Faz 2 (oturum yönetimi)  
> **Tahmini süre:** 3-5 gün

## Amaç

Beyaz tahta üzerinde sistem tasarımı mülakatı. Kullanıcı sürükle-bırak bileşenlerle (Database, Cache, Load Balancer, vb.) mimari çizer, AI mülakatçı tasarımı sesli olarak sorgular ve tartışır.

---

## Teknik Karar: Whiteboard Kütüphanesi

| Seçenek | Artı | Eksi |
|---------|------|------|
| **tldraw** | Modern, React native, iyi API, collaborative hazır | Büyük bundle |
| **Excalidraw** | Hafif, tanınan UI, embed kolay | Özelleştirmesi zor |
| **react-flow** | Node-based, system design'a uygun | Serbest çizim yok |
| **fabric.js** | Düşük seviye, tam kontrol | Her şeyi kendin yazarsın |

> **Tavsiye:** **tldraw** — Custom shapes (DB, Cache, vb.) eklenebilir, state serialize edilebilir, React ile doğal entegrasyon.

---

## Görevler

### 4.1 — Whiteboard Temel Entegrasyonu

Mülakat odasına whiteboard ekle.

- [ ] tldraw paketini ekle: `bun add tldraw --filter @ffh/web`
- [ ] System Design mülakat odası layout'u:
  - **Sol panel:** Soru açıklaması + gereksinimler
  - **Sağ panel:** tldraw whiteboard (tam ekran)
- [ ] Temel whiteboard işlevleri:
  - Serbest çizim (kalem)
  - Kutu (rectangle) ekleme
  - Ok (arrow) çizme
  - Metin (text label) ekleme
  - Silme, undo/redo
  - Zoom, pan

---

### 4.2 — Hazır Bileşen Kütüphanesi (Custom Shapes)

System design'a özel hazır bileşenler.

- [ ] **Custom tldraw shape'leri** oluştur:
  - 🗄️ Database (silindir ikon)
  - ⚡ Cache (yıldırım ikon — Redis/Memcached)
  - 📨 Message Queue (kuyruk ikon — Kafka/RabbitMQ)
  - ⚖️ Load Balancer (terazi ikon)
  - 🌐 API Gateway
  - 🖥️ Server / Service (kutu)
  - ☁️ CDN
  - 👤 Client / User
  - 📦 Storage (S3/Blob)
  - 🔒 Auth Service
- [ ] **Bileşen palette'i:** Sol sidebar'da kategorize edilmiş bileşenler
  - Sürükle-bırak ile canvas'a ekleme
  - Her bileşende etiket (label) düzenleme
- [ ] Bileşenler arası ok çizgisi: Data flow yönünü gösterme

---

### 4.3 — Whiteboard State Serialization

Whiteboard durumunu AI'a aktarma.

- [ ] tldraw state'ini JSON olarak export etme:
  ```typescript
  // tldraw store'undan shapes ve connections çıkarma
  const snapshot = editor.store.getSnapshot()
  // Veya basitleştirilmiş format:
  const components = extractComponents(snapshot)
  // → [{ type: "database", label: "UserDB", x, y }, ...]
  // → [{ from: "API Gateway", to: "UserDB", label: "reads" }, ...]
  ```
- [ ] Basitleştirilmiş metin temsili oluşturma (LLM'in anlayacağı):
  ```
  Components:
  - Client → Load Balancer → API Gateway
  - API Gateway → User Service → UserDB (PostgreSQL)
  - API Gateway → Cache (Redis)
  
  Connections:
  - Client sends HTTP requests to Load Balancer
  - Load Balancer distributes to API Gateway
  - API Gateway reads from Cache, falls back to UserDB
  ```
- [ ] Debounce ile her değişiklikte serialize et (3-5 saniye)
- [ ] WebSocket üzerinden API'ye gönder: `{ type: "whiteboard_update", state: {...} }`

---

### 4.4 — AI ile Whiteboard Etkileşimi

AI mülakatçının tasarımı sorgulaması.

- [ ] LLM system prompt'una whiteboard state'ini ekle
- [ ] AI'ın sorduğu tipik sorular:
  - "Neden burada tek bir database kullandın? Okuma yoğun bir sistem için ne yapabilirsin?"
  - "Cache invalidation stratejin ne olur?"
  - "Bu servis fail ederse ne olur? Single point of failure var mı?"
  - "Tahmini QPS nedir ve bu mimari bunu kaldırır mı?"
- [ ] AI'ın tasarım önerileri:
  - "Burada bir message queue eklemeyi düşünebilirsin, async processing için"
  - "Read replica ekleyerek read throughput'u artırabilirsin"
- [ ] Kullanıcının sesli açıklamasını değerlendirme:
  - Trade-off analizi yapabiliyor mu?
  - Ölçeklendirme düşünüyor mu?
  - Hata toleransı (fault tolerance) düşünüyor mu?

---

### 4.5 — System Design Soru Bankası

Hazır sistem tasarımı soruları.

- [ ] Convex'te `designProblems` tablosu veya `problems` tablosunda `type: "system-design"` filtresi
- [ ] Her soruda:
  - Başlık (ör: "URL Shortener Tasarla")
  - Gereksinimler listesi (fonksiyonel + non-fonksiyonel)
  - Beklenen bileşenler (değerlendirme için)
  - Tartışma noktaları (AI'ın soracağı konular)
  - Zorluk: Junior, Mid, Senior
- [ ] Başlangıç soruları (5-10):
  - URL Shortener (Junior)
  - Chat/Messaging System (Mid)
  - News Feed / Timeline (Mid)
  - Rate Limiter (Mid)
  - Distributed Cache (Senior)
  - Video Streaming Platform (Senior)
  - Real-time Collaborative Editor (Senior)

---

### 4.6 — Whiteboard State Persistance

Tasarımı Convex'e kaydetme.

- [ ] Mülakat mesajlarına whiteboard snapshot ekle (periyodik)
- [ ] Mülakat bittiğinde son whiteboard state'ini sakla
- [ ] Rapor sayfasında whiteboard'un statik görüntüsünü göster (Faz 7)
- [ ] tldraw snapshot → PNG/SVG export (rapor için)

---

## UI Layout (System Design)

```
┌─────────────────────────────────────────────────────────┐
│  ⏱ 23:45  │  System Design  │  Senior  │  [Bitir]      │
├────────────────────┬────────────────────────────────────┤
│                    │                                    │
│  📋 Soru           │  🎨 Whiteboard (tldraw)            │
│                    │                                    │
│  Chat System       │   [Client]──►[LB]──►[API GW]      │
│  ────────          │                  │       │         │
│  Tasarla:          │            [Redis]    [UserSvc]    │
│  WhatsApp benzeri  │                      │             │
│  mesajlaşma        │                  [PostgreSQL]      │
│  sistemi           │                                    │
│                    │  ┌─────────────────────────┐       │
│  Gereksinimler:    │  │ Bileşenler:             │       │
│  - 1:1 mesajlaşma  │  │ 🗄️ DB  ⚡ Cache  📨 Queue│      │
│  - Grup chat       │  │ ⚖️ LB  🌐 CDN   🖥️ Svc  │      │
│  - Okundu bilgisi  │  └─────────────────────────┘       │
├────────────────────┴────────────────────────────────────┤
│  🎙️ [Mikrofon] ──── 🤖 "Cache invalidation stratejin?" │
└─────────────────────────────────────────────────────────┘
```

---

## Tamamlanma Kriterleri

1. Whiteboard açılıyor, serbest çizim ve şekil ekleme çalışıyor
2. Hazır bileşenler (DB, Cache, LB vb.) sürükle-bırak ile eklenebiliyor
3. AI whiteboard state'ini okuyor ve sesli yorum yapıyor
4. System design soruları bankadan yükleniyor
5. Whiteboard state'i Convex'e kaydediliyor
6. Panel resize çalışıyor (soru paneli ↔ whiteboard)

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
  },
  handler: async (ctx, args) => {
    if (args.difficulty) {
      return ctx.db
        .query("designProblems")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .collect();
    }
    return ctx.db.query("designProblems").collect();
  },
});

export const getById = query({
  args: { id: v.id("designProblems") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getRandom = query({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const problems = await ctx.db
      .query("designProblems")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .collect();
    if (problems.length === 0) return null;
    const idx = Math.floor(Math.random() * problems.length);
    return problems[idx];
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    requirements: v.object({
      functional: v.array(v.string()),
      nonFunctional: v.array(v.string()),
    }),
    expectedComponents: v.array(v.string()),
    discussionPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("designProblems", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Public mutation callable from the API to seed if the table is empty
export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("designProblems").first();
    if (existing) return { seeded: false };

    const problems = [
      {
        title: "URL Shortener Tasarla",
        description:
          "bit.ly benzeri bir URL kısaltma servisi tasarla. Kullanıcılar uzun URL'leri kısa URL'lere dönüştürebilmeli ve kısa URL'ler orijinal URL'ye yönlendirmeli.",
        difficulty: "easy" as const,
        requirements: {
          functional: [
            "Uzun URL'yi kısa URL'ye dönüştürme",
            "Kısa URL ile orijinal URL'ye yönlendirme (301/302)",
            "Opsiyonel: custom alias desteği",
            "Opsiyonel: URL istatistikleri (tıklama sayısı)",
          ],
          nonFunctional: [
            "Günde 100M URL kısaltma, 1B yönlendirme",
            "Yönlendirme latency < 10ms",
            "Yüksek erişilebilirlik (%99.9)",
            "Kısa URL'ler 5 yıl geçerli olmalı",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "URL Service",
          "Database",
          "Cache",
        ],
        discussionPoints: [
          "URL hash nasıl üretilir? (Base62, MD5, counter-based)",
          "Hash collision nasıl çözülür?",
          "Read-heavy sistem: Cache stratejisi ne olmalı?",
          "Database seçimi: SQL vs NoSQL?",
          "301 vs 302 redirect farkı ve etkileri",
        ],
      },
      {
        title: "Chat / Mesajlaşma Sistemi Tasarla",
        description:
          "WhatsApp veya Telegram benzeri bir gerçek zamanlı mesajlaşma sistemi tasarla. 1:1 mesajlaşma, grup mesajlaşma ve okundu bilgisi desteklenmeli.",
        difficulty: "medium" as const,
        requirements: {
          functional: [
            "1:1 mesajlaşma",
            "Grup mesajlaşma (max 500 kişi)",
            "Okundu bilgisi (delivered, read)",
            "Çevrimdışı mesaj desteği",
            "Medya paylaşımı (resim, video)",
          ],
          nonFunctional: [
            "500M aktif kullanıcı",
            "Mesaj teslim süresi < 500ms",
            "Mesajların kalıcı saklanması",
            "End-to-end encryption",
            "Yüksek erişilebilirlik",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Chat Service",
          "Message Queue",
          "Database",
          "Cache",
          "WebSocket Server",
          "Storage",
          "CDN",
        ],
        discussionPoints: [
          "WebSocket vs long polling vs SSE?",
          "Mesaj sıralaması nasıl garanti edilir?",
          "Çevrimdışı kullanıcılara mesaj nasıl iletilir?",
          "Grup mesajlarında fan-out stratejisi?",
          "Database sharding: user-based mi conversation-based mi?",
          "Message queue kullanımı nerede gerekli?",
        ],
      },
      {
        title: "News Feed / Timeline Tasarla",
        description:
          "Twitter veya Instagram benzeri bir haber akışı sistemi tasarla.",
        difficulty: "medium" as const,
        requirements: {
          functional: [
            "Post oluşturma (metin + medya)",
            "Kişiselleştirilmiş news feed",
            "Follow/unfollow",
            "Like, comment, share",
            "Bildirimler (notifications)",
          ],
          nonFunctional: [
            "300M aktif kullanıcı",
            "Feed yükleme < 2s",
            "Yeni post feed'de < 5s içinde görünmeli",
            "Yüksek erişilebilirlik",
            "Eventual consistency kabul edilebilir",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Post Service",
          "Feed Service",
          "Message Queue",
          "Database",
          "Cache",
          "CDN",
          "Storage",
        ],
        discussionPoints: [
          "Push model vs Pull model?",
          "Celebrity problemi: milyonlarca takipçisi olan kullanıcılar?",
          "Feed ranking algoritması?",
          "Cache invalidation stratejisi?",
          "Database seçimi: feed vs posts vs social graph?",
        ],
      },
      {
        title: "Distributed Cache Tasarla",
        description:
          "Memcached veya Redis benzeri bir dağıtık cache sistemi tasarla.",
        difficulty: "hard" as const,
        requirements: {
          functional: [
            "Key-value GET/SET/DELETE",
            "TTL (time-to-live) desteği",
            "LRU/LFU eviction politikası",
            "Cache invalidation mekanizması",
          ],
          nonFunctional: [
            "Sub-millisecond latency",
            "Milyon ops/saniye throughput",
            "Petabyte ölçeğinde veri",
            "Yüksek erişilebilirlik",
          ],
        },
        expectedComponents: [
          "Client Library",
          "Cache Server",
          "Database",
          "Load Balancer",
        ],
        discussionPoints: [
          "Consistent hashing nedir ve neden gerekli?",
          "Replication: master-slave vs master-master?",
          "Cache-aside vs write-through vs write-behind?",
          "CAP teoremi: hangi ikiyi seçersin?",
          "Thundering herd nasıl önlenir?",
        ],
      },
      {
        title: "Video Streaming Platformu Tasarla",
        description:
          "YouTube veya Netflix benzeri bir video streaming platformu tasarla.",
        difficulty: "hard" as const,
        requirements: {
          functional: [
            "Video yükleme (upload)",
            "Video transcoding (farklı çözünürlükler)",
            "Adaptive bitrate streaming (HLS/DASH)",
            "Video arama ve keşfet",
            "İzleme geçmişi ve öneriler",
          ],
          nonFunctional: [
            "1B günlük video izleme",
            "Video başlatma süresi < 2s",
            "Buffer-free deneyim",
            "Global erişilebilirlik (CDN)",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Upload Service",
          "Transcoding Service",
          "Message Queue",
          "Database",
          "Storage",
          "CDN",
          "Cache",
          "Search Service",
        ],
        discussionPoints: [
          "Video transcoding pipeline nasıl tasarlanır?",
          "Adaptive bitrate streaming nasıl çalışır?",
          "CDN stratejisi: origin pull vs push?",
          "Storage tiers: hot vs warm vs cold?",
          "Real-time analytics: view count, watch time?",
        ],
      },
    ];

    for (const problem of problems) {
      await ctx.db.insert("designProblems", {
        ...problem,
        createdAt: Date.now(),
      });
    }

    return { seeded: true };
  },
});

export const seed: any = internalMutation({
  handler: async (ctx: any) => {
    const existing = await ctx.db.query("designProblems").first();
    if (existing) return;

    const problems = [
      {
        title: "URL Shortener Tasarla",
        description:
          "bit.ly benzeri bir URL kısaltma servisi tasarla. Kullanıcılar uzun URL'leri kısa URL'lere dönüştürebilmeli ve kısa URL'ler orijinal URL'ye yönlendirmeli.",
        difficulty: "easy" as const,
        requirements: {
          functional: [
            "Uzun URL'yi kısa URL'ye dönüştürme",
            "Kısa URL ile orijinal URL'ye yönlendirme (301/302)",
            "Opsiyonel: custom alias desteği",
            "Opsiyonel: URL istatistikleri (tıklama sayısı)",
          ],
          nonFunctional: [
            "Günde 100M URL kısaltma, 1B yönlendirme",
            "Yönlendirme latency < 10ms",
            "Yüksek erişilebilirlik (%99.9)",
            "Kısa URL'ler 5 yıl geçerli olmalı",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "URL Service",
          "Database",
          "Cache",
        ],
        discussionPoints: [
          "URL hash nasıl üretilir? (Base62, MD5, counter-based)",
          "Hash collision nasıl çözülür?",
          "Read-heavy sistem: Cache stratejisi ne olmalı?",
          "Database seçimi: SQL vs NoSQL?",
          "301 vs 302 redirect farkı ve etkileri",
        ],
      },
      {
        title: "Chat / Mesajlaşma Sistemi Tasarla",
        description:
          "WhatsApp veya Telegram benzeri bir gerçek zamanlı mesajlaşma sistemi tasarla. 1:1 mesajlaşma, grup mesajlaşma ve okundu bilgisi desteklenmeli.",
        difficulty: "medium" as const,
        requirements: {
          functional: [
            "1:1 mesajlaşma",
            "Grup mesajlaşma (max 500 kişi)",
            "Okundu bilgisi (delivered, read)",
            "Çevrimdışı mesaj desteği",
            "Medya paylaşımı (resim, video)",
          ],
          nonFunctional: [
            "500M aktif kullanıcı",
            "Mesaj teslim süresi < 500ms",
            "Mesajların kalıcı saklanması",
            "End-to-end encryption",
            "Yüksek erişilebilirlik",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Chat Service",
          "Message Queue",
          "Database",
          "Cache",
          "WebSocket Server",
          "Storage",
          "CDN",
        ],
        discussionPoints: [
          "WebSocket vs long polling vs SSE?",
          "Mesaj sıralaması nasıl garanti edilir?",
          "Çevrimdışı kullanıcılara mesaj nasıl iletilir?",
          "Grup mesajlarında fan-out stratejisi?",
          "Database sharding: user-based mi conversation-based mi?",
          "Message queue kullanımı nerede gerekli?",
        ],
      },
      {
        title: "News Feed / Timeline Tasarla",
        description:
          "Twitter veya Instagram benzeri bir haber akışı sistemi tasarla. Kullanıcılar paylaşım yapabilmeli ve takip ettikleri kişilerin paylaşımlarını kronolojik olarak görebilmeli.",
        difficulty: "medium" as const,
        requirements: {
          functional: [
            "Post oluşturma (metin + medya)",
            "Kişiselleştirilmiş news feed",
            "Follow/unfollow",
            "Like, comment, share",
            "Bildirimler (notifications)",
          ],
          nonFunctional: [
            "300M aktif kullanıcı",
            "Feed yükleme < 2s",
            "Yeni post feed'de < 5s içinde görünmeli",
            "Yüksek erişilebilirlik",
            "Eventual consistency kabul edilebilir",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Post Service",
          "Feed Service",
          "Message Queue",
          "Database",
          "Cache",
          "CDN",
          "Storage",
        ],
        discussionPoints: [
          "Push model (fan-out on write) vs Pull model (fan-out on read)?",
          "Celebrity problemi: milyonlarca takipçisi olan kullanıcılar?",
          "Feed ranking/sıralama algoritması?",
          "Cache invalidation stratejisi?",
          "Database seçimi: feed vs posts vs social graph?",
          "Sharding stratejisi?",
        ],
      },
      {
        title: "Rate Limiter Tasarla",
        description:
          "Dağıtık bir ortamda çalışan bir rate limiting sistemi tasarla. API'lere gelen istekleri kullanıcı, IP veya API key bazında sınırlandırabilmeli.",
        difficulty: "medium" as const,
        requirements: {
          functional: [
            "İstek sayısı sınırlandırma (per user, per IP, per API key)",
            "Farklı zaman pencereleri (saniye, dakika, saat)",
            "Farklı endpoint'ler için farklı limitler",
            "Rate limit bilgisini response header'da döndürme",
            "Throttling vs hard limit seçenekleri",
          ],
          nonFunctional: [
            "Ultra düşük latency (< 1ms ek gecikme)",
            "Dağıtık ortamda tutarlılık",
            "Milyon RPS desteklemeli",
            "Yüksek erişilebilirlik",
          ],
        },
        expectedComponents: [
          "API Gateway",
          "Rate Limiter Service",
          "Cache",
          "Database",
        ],
        discussionPoints: [
          "Token Bucket vs Leaky Bucket vs Fixed Window vs Sliding Window?",
          "Redis kullanımı: INCR + EXPIRE atomic mi?",
          "Birden fazla sunucuda state sync nasıl olur?",
          "Race condition önleme: Lua script, distributed lock?",
          "Client-side vs server-side rate limiting?",
          "Graceful degradation: limit aşıldığında ne dönersin?",
        ],
      },
      {
        title: "Distributed Cache Tasarla",
        description:
          "Memcached veya Redis benzeri bir dağıtık cache sistemi tasarla. Yüksek throughput ve düşük latency ile veri cache'leme yapabilmeli.",
        difficulty: "hard" as const,
        requirements: {
          functional: [
            "Key-value GET/SET/DELETE",
            "TTL (time-to-live) desteği",
            "LRU/LFU eviction politikası",
            "Cache invalidation mekanizması",
            "Opsiyonel: pub/sub, data structures (list, set, hash)",
          ],
          nonFunctional: [
            "Sub-millisecond latency",
            "Milyon ops/saniye throughput",
            "Petabyte ölçeğinde veri",
            "Yüksek erişilebilirlik (no single point of failure)",
            "Network partition'a dayanıklılık",
          ],
        },
        expectedComponents: [
          "Client Library",
          "Cache Server",
          "Database",
          "Load Balancer",
        ],
        discussionPoints: [
          "Consistent hashing nedir ve neden gerekli?",
          "Virtual nodes: hotspot önleme?",
          "Replication: master-slave vs master-master?",
          "Cache-aside vs write-through vs write-behind?",
          "CAP teoremi: hangi ikiyi seçersin?",
          "Memory management ve eviction politikaları?",
          "Thundering herd / cache stampede nasıl önlenir?",
        ],
      },
      {
        title: "Video Streaming Platformu Tasarla",
        description:
          "YouTube veya Netflix benzeri bir video streaming platformu tasarla. Video yükleme, transcoding, ve adaptive bitrate streaming desteklenmeli.",
        difficulty: "hard" as const,
        requirements: {
          functional: [
            "Video yükleme (upload)",
            "Video transcoding (farklı çözünürlükler)",
            "Adaptive bitrate streaming (HLS/DASH)",
            "Video arama ve keşfet",
            "İzleme geçmişi ve öneriler",
            "Yorum ve beğeni sistemi",
          ],
          nonFunctional: [
            "1B günlük video izleme",
            "Video başlatma süresi < 2s",
            "Buffer-free deneyim",
            "Global erişilebilirlik (CDN)",
            "Yüklenen videoların %99.99 dayanıklılığı",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "Upload Service",
          "Transcoding Service",
          "Message Queue",
          "Database",
          "Storage",
          "CDN",
          "Cache",
          "Search Service",
        ],
        discussionPoints: [
          "Video transcoding pipeline nasıl tasarlanır?",
          "Adaptive bitrate streaming (ABR) nasıl çalışır?",
          "CDN stratejisi: origin pull vs push?",
          "Storage tiers: hot vs warm vs cold?",
          "Video metadata vs video blob: farklı depolama?",
          "Real-time analytics: view count, watch time?",
          "Copyright detection (content ID) nasıl çalışır?",
        ],
      },
      {
        title: "Real-time Collaborative Editor Tasarla",
        description:
          "Google Docs benzeri bir gerçek zamanlı işbirlikçi metin editörü tasarla. Birden fazla kullanıcı aynı anda aynı dokümanı düzenleyebilmeli.",
        difficulty: "hard" as const,
        requirements: {
          functional: [
            "Gerçek zamanlı eşzamanlı düzenleme",
            "Cursor ve seçim pozisyonu paylaşımı",
            "Versiyon geçmişi ve geri alma (undo)",
            "Yorum ve öneri modu",
            "Çevrimdışı düzenleme ve sync",
          ],
          nonFunctional: [
            "Keystroke latency < 100ms",
            "100+ eşzamanlı editör/doküman",
            "Veri tutarlılığı (eventual consistency)",
            "Çakışma çözümü (conflict resolution)",
            "Yüksek erişilebilirlik",
          ],
        },
        expectedComponents: [
          "Load Balancer",
          "API Gateway",
          "WebSocket Server",
          "Document Service",
          "Database",
          "Cache",
          "Message Queue",
          "Storage",
        ],
        discussionPoints: [
          "OT (Operational Transformation) vs CRDT?",
          "WebSocket bağlantı yönetimi: sticky sessions?",
          "Conflict resolution stratejisi?",
          "Doküman state nasıl saklanır: event log vs snapshot?",
          "Undo/redo çoklu kullanıcıda nasıl çalışır?",
          "Çevrimdışıdan online'a geçiş sync mekanizması?",
          "Cursor pozisyon broadcasting overhead nasıl azaltılır?",
        ],
      },
    ];

    for (const problem of problems) {
      await ctx.db.insert("designProblems", {
        ...problem,
        createdAt: Date.now(),
      });
    }
  },
});

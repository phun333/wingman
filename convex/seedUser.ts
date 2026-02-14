import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Seed Data: Mehmet Ali Selvet ────────────────────────
// Bu dosya, uygulamanın tüm özelliklerini showcase etmek
// için zengin, gerçekçi bir kullanıcı profili oluşturur.
//
// Çalıştırmak için:
//   bunx convex run --component seedUser:seedMehmet
// ──────────────────────────────────────────────────────────

export const seedMehmet = internalMutation({
  args: {},
  handler: async (ctx) => {
    // ─── 0. Guard — zaten varsa tekrar ekleme ────────────
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "mehmet@selvet.com"))
      .first();

    if (existing) {
      console.log("⚠️  Mehmet Ali Selvet zaten mevcut, seed atlanıyor.");
      return { status: "skipped", userId: existing._id };
    }

    const now = Date.now();

    // ─── Helper: geçmiş tarihler ─────────────────────────
    const daysAgo = (d: number) => now - d * 24 * 60 * 60 * 1000;
    const hoursAgo = (h: number) => now - h * 60 * 60 * 1000;

    // ═══════════════════════════════════════════════════════
    // 1. USER
    // ═══════════════════════════════════════════════════════

    const userId = await ctx.db.insert("users", {
      email: "mehmet@selvet.com",
      name: "Mehmet Ali Selvet",
      createdAt: daysAgo(45),
      updatedAt: now,
    });

    console.log("✅ User oluşturuldu:", userId);

    // ═══════════════════════════════════════════════════════
    // 2. USER PROFILE
    // ═══════════════════════════════════════════════════════

    await ctx.db.insert("userProfiles", {
      userId,
      interests: [
        "Backend Development",
        "Distributed Systems",
        "System Design",
        "Cloud Architecture",
        "Machine Learning",
        "Open Source",
      ],
      goals:
        "2026 yılı içinde Google veya bir üst düzey teknoloji şirketinde Senior Software Engineer pozisyonu almak. Özellikle distributed systems ve cloud-native mimariler konusunda uzmanlaşmak istiyorum.",
      preferredLanguage: "typescript",
      updatedAt: now,
    });

    console.log("✅ UserProfile oluşturuldu");

    // ═══════════════════════════════════════════════════════
    // 3. RESUME
    // ═══════════════════════════════════════════════════════

    const resumeId = await ctx.db.insert("resumes", {
      userId,
      fileName: "mehmet_ali_selvet_cv.pdf",
      name: "Mehmet Ali Selvet",
      title: "Senior Software Engineer",
      summary:
        "7+ yıl deneyimli Full-Stack / Backend ağırlıklı yazılım mühendisi. Büyük ölçekli dağıtık sistemler, mikro servis mimarileri ve cloud-native uygulamalar konularında derin uzmanlık. Trendyol ve Hepsiburada gibi Türkiye'nin en büyük e-ticaret platformlarında kritik sistemlerin tasarım ve geliştirilmesinde liderlik ettim. Açık kaynak katkıları ve teknik blog yazılarıyla topluluk oluşturmaya önem veriyorum.",
      yearsOfExperience: 7,
      skills: [
        "TypeScript",
        "Go",
        "Python",
        "React",
        "Node.js",
        "PostgreSQL",
        "Redis",
        "Kafka",
        "Docker",
        "Kubernetes",
        "AWS",
        "GCP",
        "Terraform",
        "GraphQL",
        "gRPC",
      ],
      categorizedSkills: {
        programmingLanguages: ["TypeScript", "Go", "Python", "Java", "Rust"],
        frameworks: [
          "React",
          "Next.js",
          "Hono",
          "Fastify",
          "Express",
          "NestJS",
        ],
        databases: [
          "PostgreSQL",
          "MongoDB",
          "Redis",
          "ClickHouse",
          "DynamoDB",
        ],
        tools: [
          "Docker",
          "Git",
          "Terraform",
          "Grafana",
          "Prometheus",
          "Datadog",
        ],
        cloud: [
          "AWS (ECS, Lambda, S3, SQS, DynamoDB)",
          "GCP (Cloud Run, BigQuery, Pub/Sub)",
          "Kubernetes",
          "Cloudflare Workers",
        ],
        methodologies: [
          "Agile / Scrum",
          "TDD",
          "CI/CD",
          "Domain-Driven Design",
          "Event-Driven Architecture",
        ],
        other: ["Kafka", "RabbitMQ", "gRPC", "GraphQL", "OpenTelemetry"],
      },
      experience: [
        {
          company: "Trendyol",
          role: "Senior Software Engineer",
          duration: "2023 – Günümüz (2+ yıl)",
          highlights: [
            "Ödeme altyapısının yeniden tasarlanmasında teknik liderlik — günlük 2M+ işlem",
            "Event-driven mimaride Kafka consumer'ların throughput'unu %300 artırdım",
            "3 kişilik ekibe mentorluk ve code review süreçlerinin iyileştirilmesi",
            "Zero-downtime deployment pipeline'ı kurulumu (Kubernetes + ArgoCD)",
          ],
          technologies: [
            "Go",
            "Kafka",
            "PostgreSQL",
            "Kubernetes",
            "Redis",
            "gRPC",
          ],
        },
        {
          company: "Hepsiburada",
          role: "Software Engineer",
          duration: "2020 – 2023 (3 yıl)",
          highlights: [
            "Ürün arama sisteminin backend'ini Node.js'ten Go'ya migrate ettim — latency %60 düştü",
            "Elasticsearch cluster yönetimi ve query optimizasyonu (50M+ ürün)",
            "Mikro servis iletişiminde gRPC entegrasyonu ve protobuf schema management",
            "A/B test altyapısının tasarlanması ve implementasyonu",
          ],
          technologies: [
            "Go",
            "Node.js",
            "Elasticsearch",
            "Redis",
            "Docker",
            "AWS",
          ],
        },
        {
          company: "Insider (useinsider.com)",
          role: "Junior Software Engineer",
          duration: "2018 – 2020 (2 yıl)",
          highlights: [
            "Real-time analytics dashboard geliştirdim — React + WebSocket + ClickHouse",
            "SDK performans optimizasyonu: bundle size %40 küçültme",
            "Customer Data Platform (CDP) entegrasyon API'leri",
          ],
          technologies: [
            "TypeScript",
            "React",
            "Node.js",
            "ClickHouse",
            "Redis",
          ],
        },
      ],
      education: [
        {
          school: "Boğaziçi Üniversitesi",
          degree: "Bilgisayar Mühendisliği, Lisans",
          year: "2018",
          gpa: "3.52",
        },
      ],
      projects: [
        {
          name: "distributed-cache-go",
          description:
            "Go ile yazılmış consistent hashing destekli dağıtık cache kütüphanesi. Raft consensus protokolü ile leader election.",
          technologies: ["Go", "Raft", "gRPC", "Consistent Hashing"],
          highlights: [
            "GitHub'da 1.2K star",
            "Sub-millisecond read latency (P99 < 0.8ms)",
            "Production'da 3 şirkette kullanılıyor",
          ],
        },
        {
          name: "ts-event-bus",
          description:
            "TypeScript için type-safe event bus kütüphanesi. Pub/Sub pattern, wildcard matching ve middleware desteği.",
          technologies: ["TypeScript", "Vitest", "npm"],
          highlights: [
            "Haftalık 5K+ npm indirme",
            "Zero dependency, 2KB gzipped",
            "%100 test coverage",
          ],
        },
        {
          name: "cloud-cost-optimizer",
          description:
            "AWS ve GCP kaynaklarını analiz ederek maliyet optimizasyon önerileri sunan CLI aracı.",
          technologies: ["Python", "AWS SDK", "GCP SDK", "Click"],
          highlights: [
            "Kullanıcılar ortalama %25 bulut maliyeti tasarrufu raporluyor",
            "Terraform state dosyasından da analiz yapabiliyor",
          ],
        },
      ],
      certifications: [
        {
          name: "AWS Solutions Architect – Professional",
          issuer: "Amazon Web Services",
          year: "2024",
        },
        {
          name: "Certified Kubernetes Administrator (CKA)",
          issuer: "CNCF",
          year: "2023",
        },
        {
          name: "Google Cloud Professional Cloud Architect",
          issuer: "Google Cloud",
          year: "2022",
        },
      ],
      languages: ["Türkçe (Ana Dil)", "İngilizce (Profesyonel — C1)", "Almanca (Temel — A2)"],
      keyAchievements: [
        "Trendyol ödeme altyapısı yeniden tasarımında teknik liderlik — günlük 2M+ işlem, %99.99 uptime",
        "Hepsiburada arama sistemini Go'ya migrate ederek latency'yi %60 düşürdüm",
        "Açık kaynak projelerim toplamda 2K+ GitHub star aldı",
        "AWS Solutions Architect Professional sertifikası (ilk denemede geçtim)",
        "Insider'da SDK bundle size'ı %40 küçülterek mobil performansı önemli ölçüde iyileştirdim",
      ],
      interviewTopics: [
        "Distributed Systems & Consensus Protocols",
        "System Design — High-scale E-commerce",
        "Data Structures & Algorithms (Graph, DP, Trees)",
        "Database internals ve query optimization",
        "Kubernetes & Container Orchestration",
        "Event-driven architecture & Message queues",
        "Caching stratejileri & Consistency patterns",
      ],
      rawText:
        "Mehmet Ali Selvet — Senior Software Engineer | mehmet@selvet.com | İstanbul, Türkiye ...",
      parsedAt: daysAgo(40),
    });

    console.log("✅ Resume oluşturuldu:", resumeId);

    // ═══════════════════════════════════════════════════════
    // 4. RESUME ANALYSIS
    // ═══════════════════════════════════════════════════════

    await ctx.db.insert("resumeAnalysis", {
      userId,
      resumeId,
      experienceLevel: "senior",
      topicProficiency: [
        { topic: "Array", level: 90, shouldPractice: false },
        { topic: "Hash Table", level: 88, shouldPractice: false },
        { topic: "String", level: 85, shouldPractice: false },
        { topic: "Tree", level: 72, shouldPractice: true },
        { topic: "Graph", level: 65, shouldPractice: true },
        { topic: "Dynamic Programming", level: 55, shouldPractice: true },
        { topic: "Binary Search", level: 80, shouldPractice: false },
        { topic: "Stack", level: 82, shouldPractice: false },
        { topic: "Linked List", level: 78, shouldPractice: true },
        { topic: "Design", level: 92, shouldPractice: false },
        { topic: "Two Pointers", level: 85, shouldPractice: false },
        { topic: "Sliding Window", level: 70, shouldPractice: true },
      ],
      targetCompanies: ["Google", "Amazon", "Trendyol", "Spotify", "Stripe"],
      strongTopics: [
        "System Design",
        "Array",
        "Hash Table",
        "Binary Search",
        "Stack",
      ],
      weakTopics: [
        "Dynamic Programming",
        "Graph",
        "Tree",
        "Sliding Window",
      ],
      difficultyDistribution: { easy: 15, medium: 55, hard: 30 },
      reasoning:
        "Mehmet 7+ yıl deneyimli senior bir mühendis. System design ve backend konularında çok güçlü. Algoritmik tarafta Array/Hash Table/Binary Search iyi ancak DP, Graph ve Tree konularında daha fazla pratiğe ihtiyacı var. Senior pozisyon hedeflemesi nedeniyle hard soruların oranı yüksek tutuldu.",
      analyzedAt: daysAgo(38),
    });

    console.log("✅ ResumeAnalysis oluşturuldu");

    // ═══════════════════════════════════════════════════════
    // 5. JOB POSTINGS (manual)
    // ═══════════════════════════════════════════════════════

    const jobPostingId = await ctx.db.insert("jobPostings", {
      userId,
      url: "https://careers.google.com/jobs/results/12345-senior-software-engineer",
      title: "Senior Software Engineer — Backend Infrastructure",
      company: "Google",
      requirements: [
        "BS/MS in Computer Science or equivalent experience",
        "5+ years of software development experience",
        "Experience with distributed systems",
        "Proficiency in C++, Java, Go, or Python",
        "Strong problem solving and algorithmic skills",
      ],
      skills: [
        "Go",
        "C++",
        "Distributed Systems",
        "Kubernetes",
        "gRPC",
        "System Design",
      ],
      level: "senior",
      rawContent:
        "Google — Senior Software Engineer, Backend Infrastructure. We are looking for experienced engineers to design and build the next generation of backend infrastructure...",
      parsedAt: daysAgo(30),
    });

    console.log("✅ JobPosting oluşturuldu:", jobPostingId);

    // ═══════════════════════════════════════════════════════
    // 6. INTERVIEWS — Çeşitli türler ve durumlar
    // ═══════════════════════════════════════════════════════

    // ── A) Live Coding — Easy — Tamamlanmış, yüksek skor ──
    const iv1Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "easy",
      language: "tr",
      questionCount: 1,
      finalCode: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(42),
      endedAt: daysAgo(42) + 18 * 60 * 1000, // 18 dk
      createdAt: daysAgo(42),
    });

    // ── B) Live Coding — Medium — Tamamlanmış ──
    const iv2Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      finalCode: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const result: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      result.push(intervals[i]);
    }
  }
  return result;
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(38),
      endedAt: daysAgo(38) + 25 * 60 * 1000,
      createdAt: daysAgo(38),
    });

    // ── C) System Design — Medium — Tamamlanmış ──
    const iv3Id = await ctx.db.insert("interviews", {
      userId,
      type: "system-design",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      startedAt: daysAgo(35),
      endedAt: daysAgo(35) + 40 * 60 * 1000,
      createdAt: daysAgo(35),
    });

    // ── D) Phone Screen — Easy — Tamamlanmış ──
    const iv4Id = await ctx.db.insert("interviews", {
      userId,
      type: "phone-screen",
      status: "evaluated",
      difficulty: "easy",
      language: "tr",
      questionCount: 3,
      startedAt: daysAgo(30),
      endedAt: daysAgo(30) + 22 * 60 * 1000,
      createdAt: daysAgo(30),
    });

    // ── E) Live Coding — Hard — Tamamlanmış ──
    const iv5Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "hard",
      language: "tr",
      questionCount: 1,
      finalCode: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = Math.floor((lo + hi) / 2);
    const j = Math.floor((m + n + 1) / 2) - i;
    const left1 = i === 0 ? -Infinity : nums1[i - 1];
    const right1 = i === m ? Infinity : nums1[i];
    const left2 = j === 0 ? -Infinity : nums2[j - 1];
    const right2 = j === n ? Infinity : nums2[j];
    if (left1 <= right2 && left2 <= right1) {
      if ((m + n) % 2 === 0) {
        return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
      }
      return Math.max(left1, left2);
    } else if (left1 > right2) {
      hi = i - 1;
    } else {
      lo = i + 1;
    }
  }
  return 0;
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(25),
      endedAt: daysAgo(25) + 35 * 60 * 1000,
      createdAt: daysAgo(25),
    });

    // ── F) Live Coding — Medium — Tamamlanmış ──
    const iv6Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      finalCode: `function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.values());
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(20),
      endedAt: daysAgo(20) + 15 * 60 * 1000,
      createdAt: daysAgo(20),
    });

    // ── G) System Design — Hard — Tamamlanmış ──
    const iv7Id = await ctx.db.insert("interviews", {
      userId,
      type: "system-design",
      status: "evaluated",
      difficulty: "hard",
      language: "tr",
      questionCount: 1,
      startedAt: daysAgo(15),
      endedAt: daysAgo(15) + 50 * 60 * 1000,
      createdAt: daysAgo(15),
    });

    // ── H) Phone Screen — Medium — Tamamlanmış ──
    const iv8Id = await ctx.db.insert("interviews", {
      userId,
      type: "phone-screen",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 3,
      startedAt: daysAgo(10),
      endedAt: daysAgo(10) + 28 * 60 * 1000,
      createdAt: daysAgo(10),
    });

    // ── I) Live Coding — Medium — Tamamlanmış (5 gün önce) ──
    const iv9Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      finalCode: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if (c in pairs) {
      if (stack.pop() !== pairs[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(5),
      endedAt: daysAgo(5) + 12 * 60 * 1000,
      createdAt: daysAgo(5),
    });

    // ── J) Practice — Easy — Tamamlanmış (3 gün önce) ──
    const iv10Id = await ctx.db.insert("interviews", {
      userId,
      type: "practice",
      status: "evaluated",
      difficulty: "easy",
      language: "tr",
      questionCount: 1,
      startedAt: daysAgo(3),
      endedAt: daysAgo(3) + 10 * 60 * 1000,
      createdAt: daysAgo(3),
    });

    // ── K) Live Coding — Hard — Tamamlanmış (2 gün önce) ──
    const iv11Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "hard",
      language: "tr",
      questionCount: 1,
      finalCode: `function lengthOfLIS(nums: number[]): number {
  const tails: number[] = [];
  for (const num of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = num;
  }
  return tails.length;
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(2),
      endedAt: daysAgo(2) + 30 * 60 * 1000,
      createdAt: daysAgo(2),
    });

    // ── L) Live Coding — Medium — Dün tamamlanmış ──
    const iv12Id = await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      finalCode: `function search(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      codeLanguage: "typescript",
      startedAt: daysAgo(1),
      endedAt: daysAgo(1) + 8 * 60 * 1000,
      createdAt: daysAgo(1),
    });

    // ── M) System Design — Medium — Bugün tamamlanmış ──
    const iv13Id = await ctx.db.insert("interviews", {
      userId,
      type: "system-design",
      status: "evaluated",
      difficulty: "medium",
      language: "tr",
      questionCount: 1,
      startedAt: hoursAgo(3),
      endedAt: hoursAgo(3) + 35 * 60 * 1000,
      createdAt: hoursAgo(3),
    });

    // ── N) Abandoned interview (realism) ──
    await ctx.db.insert("interviews", {
      userId,
      type: "live-coding",
      status: "abandoned",
      difficulty: "hard",
      language: "tr",
      questionCount: 1,
      startedAt: daysAgo(28),
      endedAt: daysAgo(28) + 5 * 60 * 1000,
      createdAt: daysAgo(28),
    });

    const interviewIds = [
      iv1Id, iv2Id, iv3Id, iv4Id, iv5Id, iv6Id,
      iv7Id, iv8Id, iv9Id, iv10Id, iv11Id, iv12Id, iv13Id,
    ];

    console.log(`✅ ${interviewIds.length + 1} interview oluşturuldu`);

    // ═══════════════════════════════════════════════════════
    // 7. MESSAGES — Her interview için gerçekçi konuşmalar
    // ═══════════════════════════════════════════════════════

    const conversations: {
      interviewId: Id<"interviews">;
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    }[] = [
      {
        interviewId: iv1Id,
        messages: [
          { role: "assistant", content: "Merhaba Mehmet! Bugün Two Sum problemini çözeceğiz. Hazır mısın?" },
          { role: "user", content: "Merhaba, evet hazırım. Two Sum klasik bir problem, HashMap yaklaşımıyla O(n) çözüm düşünüyorum." },
          { role: "assistant", content: "Harika! HashMap yaklaşımı optimal çözüm. Peki neden brute force O(n²) yerine bunu tercih ediyorsun?" },
          { role: "user", content: "Çünkü brute force'da her eleman için tüm diziyi taramam gerekiyor. HashMap ile complement'ı O(1)'de bulabilirim. Space-time tradeoff yapıyoruz aslında." },
          { role: "assistant", content: "Çok güzel açıkladın! Şimdi kodu yazabilir misin?" },
          { role: "user", content: "Tabii, map'e her elemanı eklerken aynı anda complement'ı da kontrol ediyorum. Tek geçişte çözüm." },
          { role: "assistant", content: "Mükemmel! Edge case'leri de düşünmüşsün. Kodun temiz ve okunabilir. Tebrikler!" },
        ],
      },
      {
        interviewId: iv2Id,
        messages: [
          { role: "assistant", content: "Bu sefer Merge Intervals problemini çözelim. Örtüşen aralıkları birleştirmen gerekiyor." },
          { role: "user", content: "İlk olarak intervalleri başlangıç noktasına göre sıralayacağım. Sonra sıralı listede örtüşenleri birleştireceğim." },
          { role: "assistant", content: "Sorting yaklaşımı doğru. Peki iki interval'ın örtüşüp örtüşmediğini nasıl kontrol edersin?" },
          { role: "user", content: "Eğer mevcut interval'ın başlangıcı, sonuç listesindeki son interval'ın bitişinden küçük veya eşitse örtüşüyor demektir. Bu durumda bitiş noktasını max alırız." },
          { role: "assistant", content: "Doğru! O(n log n) sorting + O(n) merge. Toplam O(n log n). Kodla gösterebilir misin?" },
          { role: "user", content: "Evet, sort edip tek geçişte birleştiriyorum. Result array'ini de ilk elemandan başlatıyorum." },
        ],
      },
      {
        interviewId: iv3Id,
        messages: [
          { role: "assistant", content: "Bugün Chat/Mesajlaşma Sistemi tasarlayacağız. WhatsApp benzeri bir sistem düşünelim. Gereksinimleri tartışarak başlayalım mı?" },
          { role: "user", content: "Elbette. Önce fonksiyonel gereksinimleri belirleyelim: 1-1 mesajlaşma, grup chat, okundu bilgisi, medya paylaşımı ve çevrimdışı mesaj desteği." },
          { role: "assistant", content: "Non-functional requirements ne olmalı?" },
          { role: "user", content: "500M aktif kullanıcı hedefleyelim. Mesaj teslim süresi 500ms altı, end-to-end encryption, yüksek erişilebilirlik ve mesaj kalıcılığı gerekli." },
          { role: "assistant", content: "Harika! Şimdi high-level architecture'dan başlayalım. Hangi ana bileşenlere ihtiyacımız var?" },
          { role: "user", content: "API Gateway, Chat Service, WebSocket Server, Message Queue (Kafka), Veritabanı (Cassandra messages için), Cache (Redis presence/status), CDN (medya) ve Notification Service." },
          { role: "assistant", content: "WebSocket vs Long Polling tercihini ve nedenini açıklar mısın?" },
          { role: "user", content: "WebSocket tercih ederim çünkü bidirectional real-time iletişim sağlıyor. Long polling'de her mesaj için yeni HTTP request açılıyor, bu da gereksiz overhead. WebSocket'te bağlantı sürekli açık kalıyor. Yalnız WebSocket bağlantısı koparsa fallback olarak long polling devreye girebilir." },
          { role: "assistant", content: "Çevrimdışı kullanıcılara mesaj nasıl iletilir?" },
          { role: "user", content: "Mesajlar Kafka'ya yazılır ve her kullanıcının bir message queue'su olur. Kullanıcı online olduğunda birikmiş mesajlar sırasıyla iletilir. Push notification servisi de çevrimdışı kullanıcıya bildirim gönderir." },
        ],
      },
      {
        interviewId: iv5Id,
        messages: [
          { role: "assistant", content: "Bugün zor bir soru: Median of Two Sorted Arrays. İki sıralı dizinin medyanını O(log(min(m,n))) karmaşıklığında bulman gerekiyor." },
          { role: "user", content: "Binary search yaklaşımı kullanacağım. Küçük diziyi seçip, partition noktasını binary search ile bulacağım. Her iki dizide de doğru partition'ı bulunca medyan hesaplanabilir." },
          { role: "assistant", content: "Partition yaklaşımını biraz daha açar mısın?" },
          { role: "user", content: "Toplam eleman sayısının yarısını oluşturacak şekilde iki diziyi bölüyoruz. Sol taraftaki elemanların hepsi sağ taraftakilerden küçük olmalı. Binary search ile doğru bölme noktasını buluyoruz." },
          { role: "assistant", content: "Edge case'ler konusunda ne düşünürsün?" },
          { role: "user", content: "Bölme noktası dizinin başına veya sonuna gelebilir, bu durumda -Infinity veya Infinity kullanıyorum. Ayrıca toplam eleman sayısı tek mi çift mi kontrolü gerekiyor, medyan hesabı farklılaşıyor." },
        ],
      },
    ];

    let msgCount = 0;
    for (const conv of conversations) {
      let ts = daysAgo(42); // base time for first interview
      for (const msg of conv.messages) {
        await ctx.db.insert("messages", {
          interviewId: conv.interviewId,
          role: msg.role,
          content: msg.content,
          timestamp: ts,
        });
        ts += 30_000 + Math.random() * 60_000; // 30-90 sec between messages
        msgCount++;
      }
    }

    console.log(`✅ ${msgCount} message oluşturuldu`);

    // ═══════════════════════════════════════════════════════
    // 8. INTERVIEW RESULTS
    // ═══════════════════════════════════════════════════════

    type ResultSeed = {
      interviewId: Id<"interviews">;
      overallScore: number;
      hireRecommendation: "strong-hire" | "hire" | "lean-hire" | "no-hire";
      categoryScores: {
        problemSolving: number;
        communication: number;
        codeQuality?: number;
        systemThinking?: number;
        analyticalThinking: number;
      };
      codeAnalysis?: {
        timeComplexity: string;
        spaceComplexity: string;
        userSolution: string;
        optimalSolution: string;
        optimizationSuggestions: string[];
      };
      strengths: string[];
      weaknesses: string[];
      summary: string;
      nextSteps: string[];
      createdAtOffset: number; // daysAgo offset
    };

    const results: ResultSeed[] = [
      // iv1 — Two Sum (Easy) — 42 gün önce
      {
        interviewId: iv1Id,
        overallScore: 92,
        hireRecommendation: "strong-hire",
        categoryScores: {
          problemSolving: 95,
          communication: 90,
          codeQuality: 92,
          analyticalThinking: 88,
        },
        codeAnalysis: {
          timeComplexity: "O(n)",
          spaceComplexity: "O(n)",
          userSolution:
            "HashMap ile tek geçişte çözüm. Complement kontrolü ve map güncelleme aynı loop'ta.",
          optimalSolution:
            "HashMap yaklaşımı zaten optimal. Tek geçişte O(n) time, O(n) space.",
          optimizationSuggestions: [
            "Edge case kontrolü eklenebilir (boş dizi, tek elemanlı dizi)",
          ],
        },
        strengths: [
          "Optimal çözüme doğrudan ulaştı",
          "Space-time tradeoff'u çok net açıkladı",
          "Kod temiz ve okunabilir",
          "Türkçe iletişimi akıcı ve profesyonel",
        ],
        weaknesses: [
          "Edge case'leri sözlü olarak belirtse de kodda handle etmedi",
        ],
        summary:
          "Mehmet, Two Sum problemini hızlı ve verimli bir şekilde çözdü. HashMap yaklaşımını seçme gerekçesini net açıkladı. İletişimi güçlü, kodlama kalitesi yüksek.",
        nextSteps: [
          "Medium zorlukta Array/Hash Table soruları dene",
          "Edge case handling alışkanlığını güçlendir",
        ],
        createdAtOffset: 42,
      },
      // iv2 — Merge Intervals (Medium) — 38 gün önce
      {
        interviewId: iv2Id,
        overallScore: 85,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 88,
          communication: 85,
          codeQuality: 85,
          analyticalThinking: 82,
        },
        codeAnalysis: {
          timeComplexity: "O(n log n)",
          spaceComplexity: "O(n)",
          userSolution: "Sort + linear merge yaklaşımı.",
          optimalSolution: "Sorting-based yaklaşım zaten optimal.",
          optimizationSuggestions: [
            "In-place merge ile space O(1) yapılabilir (ama okunabilirlik düşer)",
            "Input validation eklenebilir",
          ],
        },
        strengths: [
          "Doğru algoritmik yaklaşımı hızlıca belirledi",
          "Sorting'in neden gerekli olduğunu iyi açıkladı",
          "Complexity analizi doğru",
        ],
        weaknesses: [
          "Başlangıçta çözüme ulaşmak biraz zaman aldı",
          "Alternatif yaklaşımları tartışmadı",
        ],
        summary:
          "Merge Intervals'ı doğru çözdü. Sorting yaklaşımı optimal ve implementasyon doğru. Biraz daha hızlı düşünmesi ve alternatif yaklaşımları da tartışması beklenir.",
        nextSteps: [
          "Interval/Sweep-line konusunda daha fazla pratik yap",
          "Çözüme başlamadan önce farklı yaklaşımları kısaca değerlendir",
        ],
        createdAtOffset: 38,
      },
      // iv3 — System Design: Chat (Medium) — 35 gün önce
      {
        interviewId: iv3Id,
        overallScore: 88,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 85,
          communication: 92,
          systemThinking: 90,
          analyticalThinking: 85,
        },
        strengths: [
          "Gereksinimleri sistematik olarak belirledi",
          "High-level architecture çok güçlü",
          "WebSocket vs Long Polling karşılaştırması detaylıydı",
          "Offline mesaj teslimi için queue-based yaklaşım doğru",
          "Real-world deneyimden örnekler verdi",
        ],
        weaknesses: [
          "Database sharding stratejisini yeterince detaylandırmadı",
          "Monitoring ve observability'den bahsetmedi",
        ],
        summary:
          "Chat sistemi tasarımında güçlü bir performans sergiledi. Gerçek dünya deneyimi tasarım kararlarına yansıyor. Sharding ve operational concerns konularında derinleşebilir.",
        nextSteps: [
          "Database sharding stratejileri konusunda derinleş",
          "Observability (tracing, metrics, logging) konularını ekle",
          "Hard system design sorularına geç",
        ],
        createdAtOffset: 35,
      },
      // iv4 — Phone Screen (Easy) — 30 gün önce
      {
        interviewId: iv4Id,
        overallScore: 78,
        hireRecommendation: "lean-hire",
        categoryScores: {
          problemSolving: 75,
          communication: 82,
          analyticalThinking: 78,
        },
        strengths: [
          "Kendini net ve özlü tanıttı",
          "Teknik deneyimlerini iyi aktardı",
          "Motivasyon ve hedefler konusunda samimi",
        ],
        weaknesses: [
          "STAR formatında örnekleri biraz dağınık",
          "Davranışsal sorularda spesifik metrikler eksik",
          "Soruları cevaplarken bazen konudan sapma",
        ],
        summary:
          "Phone screen'de iyi bir izlenim bıraktı ancak davranışsal cevaplar daha yapılandırılmış olabilir. Teknik arka plan güçlü ama bunu hikayeleştirmek gerekiyor.",
        nextSteps: [
          "STAR formatında pratik yap (Situation, Task, Action, Result)",
          "Her deneyim için ölçülebilir sonuçlar hazırla",
          "Behavioral interview question listesi üzerinde çalış",
        ],
        createdAtOffset: 30,
      },
      // iv5 — Median Sorted Arrays (Hard) — 25 gün önce
      {
        interviewId: iv5Id,
        overallScore: 72,
        hireRecommendation: "lean-hire",
        categoryScores: {
          problemSolving: 70,
          communication: 75,
          codeQuality: 72,
          analyticalThinking: 68,
        },
        codeAnalysis: {
          timeComplexity: "O(log(min(m,n)))",
          spaceComplexity: "O(1)",
          userSolution: "Binary search partition yaklaşımı.",
          optimalSolution: "Binary search partition, optimal çözüm.",
          optimizationSuggestions: [
            "Partition logic'inde off-by-one hatalarına dikkat",
            "Edge case'ler daha defensively handle edilebilir",
          ],
        },
        strengths: [
          "Doğru yaklaşımı (binary search partition) seçti",
          "Zor problemde sakin kaldı",
          "Adım adım düşünme süreci iyiydi",
        ],
        weaknesses: [
          "İlk implementasyonda off-by-one hatası yaptı",
          "Çözüme ulaşması 35 dakika sürdü — süre yönetimi geliştirilmeli",
          "Edge case'leri debug ederken zaman kaybetti",
        ],
        summary:
          "Hard problemde doğru yaklaşımı bulabildi ancak implementasyonda hatalar ve süre sorunları yaşadı. Binary search konusunda daha fazla pratiğe ihtiyaç var.",
        nextSteps: [
          "Binary search pattern soruları çöz",
          "Off-by-one hata kalıplarını öğren",
          "Hard soruları 30 dk altında çözme hedefi koy",
        ],
        createdAtOffset: 25,
      },
      // iv6 — Group Anagrams (Medium) — 20 gün önce
      {
        interviewId: iv6Id,
        overallScore: 90,
        hireRecommendation: "strong-hire",
        categoryScores: {
          problemSolving: 92,
          communication: 88,
          codeQuality: 90,
          analyticalThinking: 90,
        },
        codeAnalysis: {
          timeComplexity: "O(n * k log k)",
          spaceComplexity: "O(n * k)",
          userSolution: "Sorted string'i key olarak kullanan HashMap.",
          optimalSolution:
            "Sorted key HashMap yaklaşımı (O(n * k log k)) veya character count key (O(n * k)).",
          optimizationSuggestions: [
            "Character count'u key olarak kullanarak O(n * k)'ya düşürülebilir",
          ],
        },
        strengths: [
          "Hızlı ve doğru çözüm",
          "HashMap pattern'ini güçlü kullandı",
          "Alternatif yaklaşımı (char count) da biliyordu",
          "Temiz ve idiomatic TypeScript",
        ],
        weaknesses: [
          "Character count yaklaşımını tercih etmedi (daha optimal olmasına rağmen)",
        ],
        summary:
          "Group Anagrams'ı hızlı ve doğru çözdü. HashMap kullanımı güçlü. Alternatif optimizasyonları bilmesine rağmen sorted key tercih etti — pratik açıdan makul bir karar.",
        nextSteps: [
          "Hash Table + String soruları ile devam et",
          "Optimizasyon trade-off'larını mülakatçıya açıkla",
        ],
        createdAtOffset: 20,
      },
      // iv7 — System Design: Distributed Cache (Hard) — 15 gün önce
      {
        interviewId: iv7Id,
        overallScore: 82,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 80,
          communication: 85,
          systemThinking: 88,
          analyticalThinking: 78,
        },
        strengths: [
          "Consistent hashing'i detaylıca açıkladı",
          "Replication stratejisini (master-slave) doğru tasarladı",
          "CAP teoremini pratik kararlara bağladı",
          "Eviction politikaları konusunda bilgili",
        ],
        weaknesses: [
          "Thundering herd problemine çözüm sunmadı",
          "Performans tahminleri (capacity planning) eksik",
          "Data serialization ve compression tartışılmadı",
        ],
        summary:
          "Distributed Cache tasarımında iyi bir performans. Core concepts (consistent hashing, replication, CAP) güçlü. Operational concerns ve capacity planning zayıf.",
        nextSteps: [
          "Capacity estimation pratikleri yap",
          "Cache stampede / thundering herd çözümlerini öğren",
          "Bir hard design daha çöz: video streaming veya search engine",
        ],
        createdAtOffset: 15,
      },
      // iv8 — Phone Screen (Medium) — 10 gün önce
      {
        interviewId: iv8Id,
        overallScore: 85,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 82,
          communication: 88,
          analyticalThinking: 85,
        },
        strengths: [
          "STAR formatını bu sefer daha iyi kullandı",
          "Trendyol'daki ödeme sistemi deneyimini çok iyi aktardı",
          "Liderlik ve mentorluk deneyimlerini somutlaştırdı",
          "Sorulara verdiği cevaplar kısa ve öz",
        ],
        weaknesses: [
          "Conflict resolution örneği biraz zayıf kaldı",
          "Failure story'deki lesson learned daha güçlü olabilir",
        ],
        summary:
          "Bir önceki phone screen'e göre belirgin gelişim. STAR formatını daha iyi kullanıyor. Deneyimlerini somut rakamlarla destekliyor. Bazı zayıf noktalar hâlâ mevcut ama genel izlenim olumlu.",
        nextSteps: [
          "Conflict resolution ve failure story'lerini güçlendir",
          "Leadership principle soruları pratik et",
        ],
        createdAtOffset: 10,
      },
      // iv9 — Valid Parentheses (Medium) — 5 gün önce
      {
        interviewId: iv9Id,
        overallScore: 95,
        hireRecommendation: "strong-hire",
        categoryScores: {
          problemSolving: 98,
          communication: 92,
          codeQuality: 95,
          analyticalThinking: 94,
        },
        codeAnalysis: {
          timeComplexity: "O(n)",
          spaceComplexity: "O(n)",
          userSolution: "Stack-based yaklaşım. Pairs lookup objesi ile temiz mapping.",
          optimalSolution: "Stack çözümü zaten optimal.",
          optimizationSuggestions: [],
        },
        strengths: [
          "Çok hızlı ve doğru çözüm (12 dakika)",
          "Stack pattern'ini mükemmel kullandı",
          "Kod son derece temiz ve idiomatic",
          "Edge case'leri proaktif olarak handle etti",
        ],
        weaknesses: [],
        summary:
          "Mükemmel performans. Valid Parentheses'i 12 dakikada hatasız çözdü. Stack usage, code quality ve communication hepsi çok yüksek.",
        nextSteps: [
          "Stack konusunda ustalaştın, Hard stack soruları dene",
          "Monotonic stack pattern'ini öğren",
        ],
        createdAtOffset: 5,
      },
      // iv10 — Practice (Easy) — 3 gün önce
      {
        interviewId: iv10Id,
        overallScore: 88,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 90,
          communication: 85,
          codeQuality: 88,
          analyticalThinking: 88,
        },
        strengths: [
          "Rahat bir pratik ortamında bile yüksek performans",
          "Çözüm yaklaşımını sesli düşünerek aktardı",
          "Follow-up soruları sorarak derinleşti",
        ],
        weaknesses: [
          "Pratik modunda bile biraz hızlı geçti, daha fazla keşfedebilirdi",
        ],
        summary:
          "Pratik oturumunda güçlü bir performans. Serbest ortamda bile yapılandırılmış çalışıyor. Daha fazla keşif ve deneme yapabilir.",
        nextSteps: [
          "Pratik modunu farklı konularda kullan (Graph, DP)",
          "Her çözümden sonra farklı bir yaklaşım dene",
        ],
        createdAtOffset: 3,
      },
      // iv11 — LIS (Hard) — 2 gün önce
      {
        interviewId: iv11Id,
        overallScore: 80,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 82,
          communication: 78,
          codeQuality: 80,
          analyticalThinking: 80,
        },
        codeAnalysis: {
          timeComplexity: "O(n log n)",
          spaceComplexity: "O(n)",
          userSolution: "Patience sorting (tails array + binary search).",
          optimalSolution: "Patience sorting yaklaşımı optimal: O(n log n).",
          optimizationSuggestions: [
            "DP yaklaşımını (O(n²)) da alternatif olarak bilmeli",
            "Tails array'in mantığını daha net açıklayabilir",
          ],
        },
        strengths: [
          "O(n log n) çözümü biliyordu",
          "Binary search integration doğruydu",
          "Hard problemde optimal çözümü verdi",
        ],
        weaknesses: [
          "Tails array'in patience sorting ile bağlantısını açıklayamadı",
          "DP alternatifini tartışmadı",
          "Düşünme süreci biraz sessiz geçti — daha fazla communication lazım",
        ],
        summary:
          "LIS'in O(n log n) çözümünü biliyordu ve doğru implement etti. Ancak problem hakkındaki düşüncelerini daha açık ifade edebilir ve alternatif yaklaşımları tartışabilir.",
        nextSteps: [
          "DP temel soruları çöz (Climbing Stairs, House Robber, Coin Change)",
          "Çözüm sürecinde sesli düşünmeyi alışkanlık haline getir",
        ],
        createdAtOffset: 2,
      },
      // iv12 — Binary Search (Medium) — 1 gün önce
      {
        interviewId: iv12Id,
        overallScore: 96,
        hireRecommendation: "strong-hire",
        categoryScores: {
          problemSolving: 98,
          communication: 95,
          codeQuality: 96,
          analyticalThinking: 95,
        },
        codeAnalysis: {
          timeComplexity: "O(log n)",
          spaceComplexity: "O(1)",
          userSolution: "Klasik binary search. Bitwise right shift ile mid hesaplama.",
          optimalSolution: "Standart binary search, zaten optimal.",
          optimizationSuggestions: [],
        },
        strengths: [
          "8 dakikada mükemmel çözüm",
          "Off-by-one hatalarını proaktif olarak handle etti",
          "Overflow prevention ile mid hesapladı",
          "Loop invariant'ı çok net açıkladı",
        ],
        weaknesses: [],
        summary:
          "Binary Search'ü son derece hızlı ve hatasız çözdü. Her adımı net açıkladı. Overflow prevention gibi detaylara dikkat etmesi deneyimini gösteriyor.",
        nextSteps: [
          "Binary search varyasyonlarına geç (rotated array, search in 2D matrix)",
          "Bu seviyeyi koru ve Hard problemlere odaklan",
        ],
        createdAtOffset: 1,
      },
      // iv13 — System Design: Rate Limiter (Medium) — bugün
      {
        interviewId: iv13Id,
        overallScore: 86,
        hireRecommendation: "hire",
        categoryScores: {
          problemSolving: 85,
          communication: 88,
          systemThinking: 87,
          analyticalThinking: 84,
        },
        strengths: [
          "Token Bucket vs Sliding Window karşılaştırması güçlü",
          "Redis-based distributed implementation doğru",
          "Rate limit header'ları (X-RateLimit-*) dahil etti",
          "Graceful degradation stratejisini tartıştı",
        ],
        weaknesses: [
          "Lua script atomic operation'ları biraz yüzeysel kaldı",
          "Multi-tier rate limiting (global vs per-user vs per-endpoint) detaylandırılmadı",
        ],
        summary:
          "Rate Limiter tasarımında iyi bir performans. Core algorithms (token bucket, sliding window) güçlü. Distributed implementation Redis ile doğru ama atomic operation detayları eksik.",
        nextSteps: [
          "Redis Lua scripting öğren",
          "Multi-tier rate limiting stratejilerini çalış",
          "Hard system design soruları ile devam et",
        ],
        createdAtOffset: 0,
      },
    ];

    for (const r of results) {
      await ctx.db.insert("interviewResults", {
        interviewId: r.interviewId,
        userId,
        overallScore: r.overallScore,
        hireRecommendation: r.hireRecommendation,
        categoryScores: r.categoryScores,
        codeAnalysis: r.codeAnalysis,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        summary: r.summary,
        nextSteps: r.nextSteps,
        createdAt: daysAgo(r.createdAtOffset),
      });
    }

    console.log(`✅ ${results.length} interview result oluşturuldu`);

    // ═══════════════════════════════════════════════════════
    // 9. USER MEMORY — AI'ın hatırladığı bilgiler
    // ═══════════════════════════════════════════════════════

    const memories: { key: string; value: string }[] = [
      { key: "total_interviews", value: JSON.stringify("13") },
      { key: "avg_score", value: JSON.stringify("87") },
      {
        key: "strong_topics",
        value: JSON.stringify([
          "HashMap / Hash Table",
          "Binary Search",
          "Stack",
          "System Design",
          "Array Manipulation",
        ]),
      },
      {
        key: "weak_topics",
        value: JSON.stringify([
          "Dynamic Programming",
          "Graph Algorithms",
          "Tree Traversal",
          "Behavioral — Conflict Resolution",
        ]),
      },
      {
        key: "preferred_coding_style",
        value: JSON.stringify("TypeScript, temiz ve idiomatic, bir-geçişli çözümler"),
      },
      {
        key: "communication_notes",
        value: JSON.stringify(
          "İletişimi güçlü, Türkçe açıklamaları akıcı. Bazen hard soruarda sessizleşebiliyor — sesli düşünmeye teşvik et.",
        ),
      },
      {
        key: "career_context",
        value: JSON.stringify(
          "Trendyol'da Senior SWE, Google'a geçmek istiyor. 7 yıl deneyim. Backend/distributed systems ağırlıklı.",
        ),
      },
      {
        key: "last_session_summary",
        value: JSON.stringify(
          "Rate Limiter system design çözdü. Token bucket ve sliding window karşılaştırması güçlüydü. Redis atomic operations konusunda derinleşmeli.",
        ),
      },
    ];

    for (const m of memories) {
      await ctx.db.insert("userMemory", {
        userId,
        key: m.key,
        value: m.value,
        updatedAt: now,
      });
    }

    console.log(`✅ ${memories.length} user memory oluşturuldu`);

    // ═══════════════════════════════════════════════════════
    // 10. JOB INTERVIEW PATH (manual job posting için)
    // ═══════════════════════════════════════════════════════

    await ctx.db.insert("jobInterviewPaths", {
      userId,
      jobPostingId: jobPostingId,
      title: "Google - Senior Software Engineer — Backend Infrastructure",
      description: "İş ilanına özel hazırlanmış mülakat soruları",
      totalQuestions: 7,
      completedQuestions: 2,
      categories: [
        {
          name: "Live Coding — Google",
          type: "live-coding",
          questions: [
            {
              id: "lc-1",
              question: "#1. Two Sum",
              difficulty: "easy",
              completed: true,
              score: 92,
            },
            {
              id: "lc-56",
              question: "#56. Merge Intervals",
              difficulty: "medium",
              completed: true,
              score: 85,
            },
            {
              id: "lc-4",
              question: "#4. Median of Two Sorted Arrays",
              difficulty: "hard",
              completed: false,
            },
            {
              id: "lc-146",
              question: "#146. LRU Cache",
              difficulty: "medium",
              completed: false,
            },
          ],
        },
        {
          name: "Phone Screen",
          type: "phone-screen",
          questions: [
            {
              id: "ps-company-1",
              question:
                "Google hakkında ne biliyorsunuz ve neden burada çalışmak istiyorsunuz?",
              difficulty: "easy",
              completed: false,
            },
            {
              id: "ps-leadership-1",
              question:
                "Teknik bir karar konusunda ekiptekileri ikna etmeniz gereken bir durumu anlatır mısınız?",
              difficulty: "hard",
              completed: false,
            },
          ],
        },
        {
          name: "System Design",
          type: "system-design",
          questions: [
            {
              id: "sd-1",
              question: "URL kısaltma servisi (bit.ly) tasarlayın",
              difficulty: "hard",
              completed: false,
            },
          ],
        },
      ],
      progress: 29, // 2/7 ≈ 29%
      createdAt: daysAgo(30),
      updatedAt: daysAgo(1),
    });

    console.log("✅ JobInterviewPath oluşturuldu");

    // ═══════════════════════════════════════════════════════
    // SONUÇ
    // ═══════════════════════════════════════════════════════

    console.log("\n🎉 Seed tamamlandı! Mehmet Ali Selvet profili hazır.");
    console.log("   📧 Email: mehmet@selvet.com");
    console.log("   🔑 Şifre: mehmet123 (better-auth ile signup gerekli)");
    console.log("   📊 13 mülakat, 13 sonuç raporu, CV, profil, memory, job path");

    return {
      status: "created",
      userId,
      summary: {
        interviews: interviewIds.length + 1, // +1 abandoned
        results: results.length,
        messages: msgCount,
        memories: memories.length,
      },
    };
  },
});

/**
 * CV → LeetCode Problem Öneri Sistemi
 *
 * İki aşamalı hibrit yaklaşım:
 *   Aşama 1 — LLM Analiz: CV'yi OpenRouter LLM'e gönderip yapılandırılmış
 *             ResumeAnalysis çıkarır (tek seferlik, CV yüklendiğinde).
 *   Aşama 2 — Scoring: LeetCode problemlerini ResumeAnalysis'e göre puanlar
 *             ve sıralar (deterministic, anlık, LLM gerektirmez).
 *
 * @module recommendation
 */

import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** LLM'den dönen yapılandırılmış CV analizi */
export interface ResumeAnalysisOutput {
  experienceLevel: "junior" | "mid" | "senior";
  topicProficiency: {
    topic: string;
    level: number;
    shouldPractice: boolean;
  }[];
  targetCompanies: string[];
  strongTopics: string[];
  weakTopics: string[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  reasoning: string;
}

/** Puanlanmış LeetCode problemi */
export interface ScoredProblem {
  leetcodeId: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  url: string;
  relatedTopics: string[];
  companies: string[];
  frequency: number;
  acceptanceRate: number;
  rating: number;
  relevanceScore: number;
  matchReasons: string[];
}

/** Öneri sonucu */
export interface RecommendationResult {
  problems: ScoredProblem[];
  totalMatched: number;
  analysisId: string;
  summary: {
    focusTopics: string[];
    difficultyBreakdown: { easy: number; medium: number; hard: number };
    targetCompanies: string[];
    experienceLevel: string;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LeetCode'daki tüm topic isimleri (normalize edilmiş)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LEETCODE_TOPICS = [
  "Array",
  "Hash Table",
  "String",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Queue",
  "Linked List",
  "Tree",
  "Binary Tree",
  "Binary Search Tree",
  "Graph",
  "BFS",
  "Breadth-First Search",
  "DFS",
  "Depth-First Search",
  "Dynamic Programming",
  "Greedy",
  "Binary Search",
  "Sorting",
  "Heap (Priority Queue)",
  "Trie",
  "Backtracking",
  "Math",
  "Bit Manipulation",
  "Design",
  "Database",
  "Recursion",
  "Divide and Conquer",
  "Union Find",
  "Topological Sort",
  "Segment Tree",
  "Binary Indexed Tree",
  "Monotonic Stack",
  "Monotonic Queue",
  "Simulation",
  "Counting",
  "Prefix Sum",
  "Matrix",
  "Geometry",
  "Number Theory",
  "Game Theory",
  "Combinatorics",
  "Memoization",
  "String Matching",
  "Rolling Hash",
  "Bitmask",
  "Enumeration",
  "Iterator",
  "Concurrency",
  "Interactive",
  "Brainteaser",
  "Probability and Statistics",
  "Data Stream",
  "Doubly-Linked List",
  "Ordered Set",
  "Merge Sort",
  "Counting Sort",
  "Radix Sort",
  "Bucket Sort",
  "Quickselect",
  "Randomized",
  "Shortest Path",
  "Minimum Spanning Tree",
  "Strongly Connected Component",
  "Eulerian Circuit",
  "Biconnected Component",
  "Line Sweep",
  "Reservoir Sampling",
  "Rejection Sampling",
  "Suffix Array",
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Aşama 1 — LLM ile CV Analizi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ANALYSIS_SYSTEM_PROMPT = `Sen deneyimli bir teknik mülakat koçu ve kariyer danışmanısın.
Sana bir adayın özgeçmiş bilgileri verilecek. Bu bilgileri analiz edip adayın LeetCode çalışma planı için yapılandırılmış bir analiz üreteceksin.

LeetCode'daki topic'ler: ${LEETCODE_TOPICS.join(", ")}

KURALLAR:
1. topicProficiency: Adayın CV'sindeki teknoloji ve deneyimlerine göre her alakalı LeetCode topic'i için 0-100 arası beceri seviyesi ver. EN AZ 10 topic olmalı.
2. shouldPractice: Adayın zayıf olduğu veya mülakatta sık sorulan ama CV'de eksik görünen topic'ler true olmalı.
3. targetCompanies: CV'deki iş deneyimlerinden, projelerden veya hedeflerden çıkarım yap. Bulunamazsa FAANG şirketlerini öner.
4. strongTopics: Adayın deneyimli olduğu, rahat çözeceği topic'ler.
5. weakTopics: Adayın çalışması gereken, zayıf kaldığı topic'ler. En az 3 tane olmalı.
6. difficultyDistribution: Deneyim seviyesine göre önerilen zorluk dağılımı (toplamı 100 olmalı).
   - Junior: easy 40, medium 45, hard 15
   - Mid: easy 20, medium 55, hard 25
   - Senior: easy 10, medium 45, hard 45
7. reasoning: Neden bu analizi yaptığını 2-3 cümle ile açıkla.

Yanıtını SADECE geçerli JSON olarak ver. Markdown code block KULLANMA.

{
  "experienceLevel": "junior" | "mid" | "senior",
  "topicProficiency": [
    { "topic": "Array", "level": 75, "shouldPractice": false },
    { "topic": "Dynamic Programming", "level": 30, "shouldPractice": true },
    ...
  ],
  "targetCompanies": ["Google", "Amazon", ...],
  "strongTopics": ["Array", "Hash Table", "String", ...],
  "weakTopics": ["Dynamic Programming", "Graph", "Tree", ...],
  "difficultyDistribution": { "easy": 20, "medium": 55, "hard": 25 },
  "reasoning": "Açıklama..."
}`;

/**
 * CV verisini LLM'e göndererek yapılandırılmış analiz çıkarır.
 * Bu fonksiyon sadece CV yüklendiğinde/güncellendiğinde çağrılır (tek seferlik).
 */
export async function analyzeResumeForRecommendation(resume: {
  name?: string;
  title?: string;
  summary?: string;
  yearsOfExperience?: number;
  skills: string[];
  categorizedSkills?: {
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    methodologies: string[];
    other: string[];
  };
  experience: { company: string; role: string; duration: string; highlights: string[]; technologies?: string[] }[];
  education: { school: string; degree: string; year?: string }[];
  projects?: { name: string; description: string; technologies: string[] }[];
  certifications?: { name: string; issuer: string }[];
}): Promise<ResumeAnalysisOutput> {
  // CV'yi özet metin haline getir
  const cvSummary = buildCVSummary(resume);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": ENV.SITE_URL,
      "X-Title": "Wingman AI Interview",
    },
    body: JSON.stringify({
      model: ENV.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `Aşağıdaki adayın CV bilgilerini analiz et:\n\n${cvSummary}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM analysis failed: ${response.status} — ${errorText}`);
  }

  const result = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = result.choices?.[0]?.message?.content;
  if (!raw) throw new Error("LLM returned empty response");

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as ResumeAnalysisOutput;

  // Validate & sanitize
  const validLevels = ["junior", "mid", "senior"] as const;
  if (!validLevels.includes(parsed.experienceLevel)) {
    parsed.experienceLevel = "mid";
  }

  parsed.topicProficiency = Array.isArray(parsed.topicProficiency)
    ? parsed.topicProficiency.map((tp) => ({
        topic: String(tp.topic),
        level: clamp(Number(tp.level) || 50, 0, 100),
        shouldPractice: Boolean(tp.shouldPractice),
      }))
    : [];

  parsed.targetCompanies = Array.isArray(parsed.targetCompanies) ? parsed.targetCompanies : [];
  parsed.strongTopics = Array.isArray(parsed.strongTopics) ? parsed.strongTopics : [];
  parsed.weakTopics = Array.isArray(parsed.weakTopics) ? parsed.weakTopics : [];
  parsed.reasoning = parsed.reasoning || "";

  // Difficulty distribution doğrulama
  const dist = parsed.difficultyDistribution;
  if (!dist || typeof dist !== "object") {
    parsed.difficultyDistribution = { easy: 20, medium: 55, hard: 25 };
  } else {
    const total = (dist.easy || 0) + (dist.medium || 0) + (dist.hard || 0);
    if (total === 0) {
      parsed.difficultyDistribution = { easy: 20, medium: 55, hard: 25 };
    } else if (Math.abs(total - 100) > 5) {
      // Normalize
      parsed.difficultyDistribution = {
        easy: Math.round(((dist.easy || 0) / total) * 100),
        medium: Math.round(((dist.medium || 0) / total) * 100),
        hard: Math.round(((dist.hard || 0) / total) * 100),
      };
    }
  }

  return parsed;
}

/** CV objesini LLM'e göndermek için özet metne çevirir */
function buildCVSummary(resume: Parameters<typeof analyzeResumeForRecommendation>[0]): string {
  const parts: string[] = [];

  if (resume.name) parts.push(`Ad: ${resume.name}`);
  if (resume.title) parts.push(`Unvan: ${resume.title}`);
  if (resume.summary) parts.push(`Özet: ${resume.summary}`);
  if (resume.yearsOfExperience) parts.push(`Deneyim: ${resume.yearsOfExperience} yıl`);

  if (resume.skills.length > 0) {
    parts.push(`\nBeceriler: ${resume.skills.join(", ")}`);
  }

  if (resume.categorizedSkills) {
    const cs = resume.categorizedSkills;
    if (cs.programmingLanguages.length) parts.push(`Programlama Dilleri: ${cs.programmingLanguages.join(", ")}`);
    if (cs.frameworks.length) parts.push(`Framework'ler: ${cs.frameworks.join(", ")}`);
    if (cs.databases.length) parts.push(`Veritabanları: ${cs.databases.join(", ")}`);
    if (cs.cloud.length) parts.push(`Cloud: ${cs.cloud.join(", ")}`);
    if (cs.tools.length) parts.push(`Araçlar: ${cs.tools.join(", ")}`);
    if (cs.methodologies.length) parts.push(`Metodolojiler: ${cs.methodologies.join(", ")}`);
  }

  if (resume.experience.length > 0) {
    parts.push("\nİş Deneyimi:");
    for (const exp of resume.experience) {
      parts.push(`  - ${exp.role} @ ${exp.company} (${exp.duration})`);
      if (exp.technologies?.length) {
        parts.push(`    Teknolojiler: ${exp.technologies.join(", ")}`);
      }
      for (const h of exp.highlights.slice(0, 3)) {
        parts.push(`    • ${h}`);
      }
    }
  }

  if (resume.education.length > 0) {
    parts.push("\nEğitim:");
    for (const edu of resume.education) {
      parts.push(`  - ${edu.degree} — ${edu.school}${edu.year ? ` (${edu.year})` : ""}`);
    }
  }

  if (resume.projects?.length) {
    parts.push("\nProjeler:");
    for (const proj of resume.projects.slice(0, 5)) {
      parts.push(`  - ${proj.name}: ${proj.description}`);
      parts.push(`    Teknolojiler: ${proj.technologies.join(", ")}`);
    }
  }

  if (resume.certifications?.length) {
    parts.push("\nSertifikalar:");
    for (const cert of resume.certifications) {
      parts.push(`  - ${cert.name} (${cert.issuer})`);
    }
  }

  return parts.join("\n");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Aşama 2 — Deterministic Scoring (LLM gerektirmez)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LeetcodeProblemRow {
  _id: string;
  leetcodeId: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  url: string;
  relatedTopics: string[];
  companies: string[];
  frequency: number;
  acceptanceRate: number;
  rating: number;
  isPremium: boolean;
  askedByFaang: boolean;
}

interface AnalysisData {
  experienceLevel: "junior" | "mid" | "senior";
  topicProficiency: { topic: string; level: number; shouldPractice: boolean }[];
  targetCompanies: string[];
  strongTopics: string[];
  weakTopics: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
}

/**
 * LeetCode problemlerini analiz verisine göre puanlar ve sıralar.
 * Tamamen deterministic — LLM çağrısı yapmaz.
 */
export function scoreProblems(
  problems: LeetcodeProblemRow[],
  analysis: AnalysisData,
  options: { limit?: number; difficulty?: "easy" | "medium" | "hard" } = {},
): ScoredProblem[] {
  const weakTopicsLower = new Set(analysis.weakTopics.map((t) => t.toLowerCase()));
  const strongTopicsLower = new Set(analysis.strongTopics.map((t) => t.toLowerCase()));
  const targetCompaniesLower = new Set(analysis.targetCompanies.map((c) => c.toLowerCase()));

  // Topic proficiency lookup
  const proficiencyMap = new Map<string, number>();
  for (const tp of analysis.topicProficiency) {
    proficiencyMap.set(tp.topic.toLowerCase(), tp.level);
  }

  const scored: ScoredProblem[] = [];

  for (const problem of problems) {
    // Premium soruları atla
    if (problem.isPremium) continue;

    // Difficulty filtresi
    if (options.difficulty && problem.difficulty !== options.difficulty) continue;

    let score = 0;
    const reasons: string[] = [];

    // ── 1. Zayıf alan eşleşmesi (max 35 puan) ──────────
    const weakMatches = problem.relatedTopics.filter((t) => weakTopicsLower.has(t.toLowerCase()));
    if (weakMatches.length > 0) {
      score += Math.min(35, weakMatches.length * 18);
      reasons.push(`Zayıf alan: ${weakMatches.join(", ")}`);
    }

    // ── 2. Topic proficiency (max 20 puan) ───────────────
    // Düşük proficiency = daha çok çalışılmalı = daha yüksek skor
    let avgProficiency = 0;
    let matchedTopics = 0;
    for (const topic of problem.relatedTopics) {
      const level = proficiencyMap.get(topic.toLowerCase());
      if (level !== undefined) {
        avgProficiency += level;
        matchedTopics++;
      }
    }
    if (matchedTopics > 0) {
      avgProficiency /= matchedTopics;
      // Düşük seviye = yüksek skor (çalışılması gereken alanlar)
      const profScore = ((100 - avgProficiency) / 100) * 20;
      score += profScore;
      if (avgProficiency < 40) {
        reasons.push(`Geliştirilmeli (seviye: ${Math.round(avgProficiency)}/100)`);
      }
    }

    // ── 3. Zorluk uyumu (max 15 puan) ────────────────────
    const diffWeight = analysis.difficultyDistribution[problem.difficulty] || 0;
    const diffScore = (diffWeight / 100) * 15;
    score += diffScore;

    // ── 4. Şirket eşleşmesi (max 15 puan) ───────────────
    const companyMatches = problem.companies.filter((c) => targetCompaniesLower.has(c.toLowerCase()));
    if (companyMatches.length > 0) {
      score += Math.min(15, companyMatches.length * 5);
      reasons.push(`Hedef şirket: ${companyMatches.slice(0, 3).join(", ")}`);
    }

    // ── 5. Sıklık (max 10 puan) ─────────────────────────
    const freqScore = (problem.frequency / 100) * 10;
    score += freqScore;
    if (problem.frequency > 70) {
      reasons.push(`Sık sorulan (${Math.round(problem.frequency)}%)`);
    }

    // ── 6. FAANG bonus (max 5 puan) ─────────────────────
    if (problem.askedByFaang) {
      score += 5;
      reasons.push("FAANG'da soruluyor");
    }

    // ── 7. Güçlü alan cezası (-10 puan) ─────────────────
    // Zaten iyi olduğu konularda puan düşür
    const strongMatches = problem.relatedTopics.filter((t) => strongTopicsLower.has(t.toLowerCase()));
    if (strongMatches.length > 0 && weakMatches.length === 0) {
      score -= Math.min(10, strongMatches.length * 5);
    }

    scored.push({
      leetcodeId: problem.leetcodeId,
      title: problem.title,
      difficulty: problem.difficulty,
      url: problem.url,
      relatedTopics: problem.relatedTopics,
      companies: problem.companies,
      frequency: problem.frequency,
      acceptanceRate: problem.acceptanceRate,
      rating: problem.rating,
      relevanceScore: Math.round(Math.max(0, score) * 10) / 10,
      matchReasons: reasons,
    });
  }

  // Sırala: yüksek skor → düşük skor
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const limit = options.limit ?? 30;
  return scored.slice(0, limit);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Tam Akış: Analiz Et + DB'ye Kaydet + Önerileri Döndür
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Bir resume için tam öneri akışı:
 * 1. Resume verisini DB'den al
 * 2. LLM ile analiz et (veya mevcut analizi kullan)
 * 3. Analizi DB'ye kaydet
 * 4. LeetCode problemlerini puanla
 * 5. Sonuçları döndür
 */
export async function getRecommendations(
  userId: string,
  resumeId: string,
  options: {
    forceReanalyze?: boolean;
    limit?: number;
    difficulty?: "easy" | "medium" | "hard";
  } = {},
): Promise<RecommendationResult> {
  // 1. Mevcut analiz var mı kontrol et
  let analysis = await convex.query(api.resumeAnalysis.getByResume, {
    resumeId: resumeId as any,
  });

  // 2. Yoksa veya yeniden analiz isteniyorsa → LLM'e gönder
  if (!analysis || options.forceReanalyze) {
    const resume = await convex.query(api.resumes.getById, {
      id: resumeId as any,
    });

    const llmResult = await analyzeResumeForRecommendation({
      name: resume.name ?? undefined,
      title: resume.title ?? undefined,
      summary: resume.summary ?? undefined,
      yearsOfExperience: resume.yearsOfExperience ?? undefined,
      skills: resume.skills,
      categorizedSkills: resume.categorizedSkills ?? undefined,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects ?? undefined,
      certifications: resume.certifications ?? undefined,
    });

    // 3. DB'ye kaydet
    analysis = await convex.mutation(api.resumeAnalysis.create, {
      userId: userId as any,
      resumeId: resumeId as any,
      experienceLevel: llmResult.experienceLevel,
      topicProficiency: llmResult.topicProficiency,
      targetCompanies: llmResult.targetCompanies,
      strongTopics: llmResult.strongTopics,
      weakTopics: llmResult.weakTopics,
      difficultyDistribution: llmResult.difficultyDistribution,
      reasoning: llmResult.reasoning,
    });
  }

  if (!analysis) throw new Error("Resume analysis failed");

  // 4. LeetCode problemlerini çek
  const { problems: allProblems } = await convex.query(api.leetcodeProblems.list, {
    limit: 2000,
  });

  // 5. Puanla ve sırala
  const scored = scoreProblems(
    allProblems as unknown as LeetcodeProblemRow[],
    {
      experienceLevel: analysis.experienceLevel,
      topicProficiency: analysis.topicProficiency,
      targetCompanies: analysis.targetCompanies,
      strongTopics: analysis.strongTopics,
      weakTopics: analysis.weakTopics,
      difficultyDistribution: analysis.difficultyDistribution,
    },
    { limit: options.limit, difficulty: options.difficulty },
  );

  return {
    problems: scored,
    totalMatched: scored.length,
    analysisId: analysis._id,
    summary: {
      focusTopics: analysis.weakTopics,
      difficultyBreakdown: analysis.difficultyDistribution,
      targetCompanies: analysis.targetCompanies,
      experienceLevel: analysis.experienceLevel,
    },
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

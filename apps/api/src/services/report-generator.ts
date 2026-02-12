import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import type {
  InterviewType,
  HireRecommendation,
  CategoryScores,
  CodeAnalysis,
} from "@ffh/types";

// ─── Report shape from LLM ──────────────────────────────

interface LLMReportOutput {
  overallScore: number;
  hireRecommendation: HireRecommendation;
  categoryScores: CategoryScores;
  codeAnalysis?: CodeAnalysis;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  nextSteps: string[];
}

// ─── System prompt for report generation ─────────────────

function getReportPrompt(interviewType: InterviewType): string {
  const codeSection =
    interviewType === "live-coding" || interviewType === "practice"
      ? `
- "codeAnalysis" alanını DOLDUR:
  - "timeComplexity": Adayın çözümünün zaman karmaşıklığı (ör: "O(n²)")
  - "spaceComplexity": Adayın çözümünün alan karmaşıklığı (ör: "O(n)")
  - "userSolution": Adayın yazdığı son kodu (transkriptten veya kod güncellemelerinden)
  - "optimalSolution": Bu problem için optimal çözüm kodu
  - "optimizationSuggestions": Kodun nasıl iyileştirilebileceğine dair öneriler dizisi`
      : `- "codeAnalysis" alanını BOŞ bırak (null)`;

  const systemThinkingNote =
    interviewType === "system-design"
      ? `- "categoryScores.systemThinking": 0-100 arası puan VER`
      : `- "categoryScores.systemThinking": null bırak`;

  const codeQualityNote =
    interviewType === "live-coding" || interviewType === "practice"
      ? `- "categoryScores.codeQuality": 0-100 arası puan VER`
      : `- "categoryScores.codeQuality": null bırak`;

  return `Sen deneyimli bir teknik mülakat değerlendiricisisin. Sana bir mülakat transkripti verilecek.
Bu transkripti analiz edip aşağıdaki JSON formatında bir rapor üreteceksin.

Mülakat türü: ${interviewType}

KURALLAR:
- Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir şey ekleme.
- Markdown code block (backtick) KULLANMA.
- Tüm skorlar 0-100 arasında tam sayı olmalı.
- Türkçe yaz (strengths, weaknesses, summary, nextSteps).
- Adayın performansını objektif değerlendir.
${codeSection}
${codeQualityNote}
${systemThinkingNote}

JSON FORMATI:
{
  "overallScore": <0-100>,
  "hireRecommendation": "<strong-hire|hire|lean-hire|no-hire>",
  "categoryScores": {
    "problemSolving": <0-100>,
    "communication": <0-100>,
    "codeQuality": <0-100 veya null>,
    "systemThinking": <0-100 veya null>,
    "analyticalThinking": <0-100>
  },
  "codeAnalysis": <obje veya null>,
  "strengths": ["güçlü yön 1", "güçlü yön 2", ...],
  "weaknesses": ["zayıf yön 1", "zayıf yön 2", ...],
  "summary": "Detaylı değerlendirme paragrafı...",
  "nextSteps": ["öneri 1", "öneri 2", ...]
}`;
}

// ─── Build context from interview data ───────────────────

async function buildInterviewContext(
  interviewId: string,
): Promise<{ transcript: string; metadata: string }> {
  const interview = await convex.query(api.interviews.getById, {
    id: interviewId as any,
  });

  const messages = await convex.query(api.messages.listByInterview, {
    interviewId: interviewId as any,
  });

  // Build transcript
  const transcriptLines = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const speaker = m.role === "user" ? "ADAY" : "MÜLAKATÇı";
      return `[${speaker}]: ${m.content}`;
    });

  const transcript = transcriptLines.join("\n\n");

  // Build metadata
  const durationMs =
    interview.startedAt && interview.endedAt
      ? interview.endedAt - interview.startedAt
      : 0;
  const durationMin = Math.round(durationMs / 60000);

  let metadata = `Mülakat Türü: ${interview.type}\n`;
  metadata += `Zorluk: ${interview.difficulty}\n`;
  metadata += `Süre: ${durationMin} dakika\n`;
  metadata += `Mesaj Sayısı: ${messages.length}\n`;

  // If there's code saved
  if (interview.finalCode) {
    metadata += `\nAdayın Son Kodu (${interview.codeLanguage ?? "unknown"}):\n\`\`\`\n${interview.finalCode}\n\`\`\`\n`;
  }

  // Load problem info if linked
  if (interview.problemId) {
    try {
      const problem = await convex.query(api.problems.getById, {
        id: interview.problemId as any,
      });
      if (problem) {
        metadata += `\nProblem: ${problem.title}\n`;
        metadata += `Kategori: ${problem.category}\n`;
        metadata += `Zorluk: ${problem.difficulty}\n`;
        metadata += `Açıklama: ${problem.description}\n`;
        if (problem.timeComplexity) {
          metadata += `Optimal Zaman Karmaşıklığı: ${problem.timeComplexity}\n`;
        }
        if (problem.spaceComplexity) {
          metadata += `Optimal Alan Karmaşıklığı: ${problem.spaceComplexity}\n`;
        }
      }
    } catch {
      // non-fatal
    }
  }

  return { transcript, metadata };
}

// ─── Call LLM for report ─────────────────────────────────

async function callLLMForReport(
  interviewType: InterviewType,
  transcript: string,
  metadata: string,
): Promise<LLMReportOutput> {
  const systemPrompt = getReportPrompt(interviewType);

  const userMessage = `## Mülakat Bilgileri\n${metadata}\n\n## Transkript\n${transcript}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM report generation failed: ${response.status} — ${errorText}`);
  }

  const result = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  // Parse JSON — handle potential markdown code blocks
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as LLMReportOutput;

  // Validate and clamp scores
  parsed.overallScore = clamp(parsed.overallScore ?? 50, 0, 100);
  parsed.categoryScores.problemSolving = clamp(
    parsed.categoryScores.problemSolving ?? 50,
    0,
    100,
  );
  parsed.categoryScores.communication = clamp(
    parsed.categoryScores.communication ?? 50,
    0,
    100,
  );
  parsed.categoryScores.analyticalThinking = clamp(
    parsed.categoryScores.analyticalThinking ?? 50,
    0,
    100,
  );

  if (parsed.categoryScores.codeQuality != null) {
    parsed.categoryScores.codeQuality = clamp(
      parsed.categoryScores.codeQuality,
      0,
      100,
    );
  }
  if (parsed.categoryScores.systemThinking != null) {
    parsed.categoryScores.systemThinking = clamp(
      parsed.categoryScores.systemThinking,
      0,
      100,
    );
  }

  // Validate hireRecommendation
  const validRecs: HireRecommendation[] = [
    "strong-hire",
    "hire",
    "lean-hire",
    "no-hire",
  ];
  if (!validRecs.includes(parsed.hireRecommendation)) {
    parsed.hireRecommendation = parsed.overallScore >= 70 ? "hire" : "lean-hire";
  }

  // Ensure arrays
  parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
  parsed.weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
  parsed.nextSteps = Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [];
  parsed.summary = parsed.summary || "Rapor oluşturuldu.";

  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

// ─── Main: Generate Report ───────────────────────────────

export async function generateReport(interviewId: string): Promise<string> {
  // 1. Get interview info
  const interview = await convex.query(api.interviews.getById, {
    id: interviewId as any,
  });

  // 2. Check if report already exists
  const existing = await convex.query(api.interviewResults.getByInterview, {
    interviewId: interviewId as any,
  });
  if (existing) {
    return existing._id;
  }

  // 3. Build context
  const { transcript, metadata } = await buildInterviewContext(interviewId);

  if (!transcript || transcript.length < 20) {
    throw new Error("Yeterli transkript verisi yok — rapor oluşturulamadı.");
  }

  // 4. Call LLM
  const report = await callLLMForReport(
    interview.type as InterviewType,
    transcript,
    metadata,
  );

  // 5. Save to Convex — convert null to undefined for optional fields
  const sanitizedCategoryScores: Record<string, number | undefined> = {
    problemSolving: report.categoryScores.problemSolving,
    communication: report.categoryScores.communication,
    analyticalThinking: report.categoryScores.analyticalThinking,
  };
  // Convex v.optional(v.number()) rejects null — only undefined or number allowed
  if (report.categoryScores.codeQuality != null) {
    sanitizedCategoryScores.codeQuality = report.categoryScores.codeQuality;
  }
  if (report.categoryScores.systemThinking != null) {
    sanitizedCategoryScores.systemThinking = report.categoryScores.systemThinking;
  }

  // Sanitize codeAnalysis — ensure all required string fields are present
  let sanitizedCodeAnalysis: {
    timeComplexity: string;
    spaceComplexity: string;
    userSolution: string;
    optimalSolution: string;
    optimizationSuggestions: string[];
  } | undefined;
  if (report.codeAnalysis) {
    sanitizedCodeAnalysis = {
      timeComplexity: report.codeAnalysis.timeComplexity ?? "Bilinmiyor",
      spaceComplexity: report.codeAnalysis.spaceComplexity ?? "Bilinmiyor",
      userSolution: report.codeAnalysis.userSolution ?? "",
      optimalSolution: report.codeAnalysis.optimalSolution ?? "",
      optimizationSuggestions: Array.isArray(report.codeAnalysis.optimizationSuggestions)
        ? report.codeAnalysis.optimizationSuggestions
        : [],
    };
  }

  const result = await convex.mutation(api.interviewResults.create, {
    interviewId: interviewId as any,
    userId: interview.userId,
    overallScore: report.overallScore,
    hireRecommendation: report.hireRecommendation,
    categoryScores: sanitizedCategoryScores as any,
    codeAnalysis: sanitizedCodeAnalysis,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    summary: report.summary,
    nextSteps: report.nextSteps,
  });

  // 6. Update interview status to "evaluated"
  try {
    await convex.mutation(api.interviews.evaluate, {
      id: interviewId as any,
    });
  } catch {
    // non-fatal — interview might already be in a different state
  }

  // 7. Update user memory with cumulative data (Faz 6)
  try {
    await updateUserMemory(interview.userId, report);
  } catch {
    // non-fatal
  }

  return result!._id;
}

// ─── Update User Memory after report ─────────────────────

async function updateUserMemory(
  userId: string,
  report: LLMReportOutput,
): Promise<void> {
  // Get existing memory
  const existingMemory = await convex.query(api.userMemory.getAllByUser, {
    userId: userId as any,
  });

  const getEntry = (key: string): string | null => {
    const entry = existingMemory.find((e) => e.key === key);
    return entry?.value ?? null;
  };

  // Update weak topics
  const existingWeak: string[] = (() => {
    try {
      return JSON.parse(getEntry("weak_topics") ?? "[]");
    } catch {
      return [];
    }
  })();
  const newWeak = [...new Set([...existingWeak, ...report.weaknesses])].slice(0, 10);
  await convex.mutation(api.userMemory.upsert, {
    userId: userId as any,
    key: "weak_topics",
    value: JSON.stringify(newWeak),
  });

  // Update strong topics
  const existingStrong: string[] = (() => {
    try {
      return JSON.parse(getEntry("strong_topics") ?? "[]");
    } catch {
      return [];
    }
  })();
  const newStrong = [...new Set([...existingStrong, ...report.strengths])].slice(0, 10);
  await convex.mutation(api.userMemory.upsert, {
    userId: userId as any,
    key: "strong_topics",
    value: JSON.stringify(newStrong),
  });

  // Update average score (running average)
  const existingAvg = Number(getEntry("avg_score") ?? "0");
  const existingTotal = Number(getEntry("total_interviews") ?? "0");
  const newTotal = existingTotal + 1;
  const newAvg = Math.round(
    (existingAvg * existingTotal + report.overallScore) / newTotal,
  );
  await convex.mutation(api.userMemory.upsert, {
    userId: userId as any,
    key: "avg_score",
    value: JSON.stringify(newAvg),
  });
  await convex.mutation(api.userMemory.upsert, {
    userId: userId as any,
    key: "total_interviews",
    value: JSON.stringify(newTotal),
  });

  // Update improvement notes
  const note = `Mülakat #${newTotal}: Skor ${report.overallScore}/100, ${report.hireRecommendation}`;
  await convex.mutation(api.userMemory.upsert, {
    userId: userId as any,
    key: "improvement_notes",
    value: JSON.stringify(note),
  });
}

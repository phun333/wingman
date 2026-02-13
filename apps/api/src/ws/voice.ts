import { fal } from "@fal-ai/client";
import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { getSystemPrompt } from "../prompts";
import { getClientIP, getGeolocationFromIP, formatLocation, getCountryFlag } from "../services/geolocation";
import { optimizeForTTS } from "../prompts/pronunciation-guide";
import { getProblemIntro } from "../services/problem-intros";
import type {
  ClientMessage,
  ServerMessage,
  VoicePipelineState,
  MessageRole,
  InterviewType,
  Difficulty,
  CodeLanguage,
  TestResult,
  WhiteboardState,
} from "@ffh/types";

// ─── fal.ai config ──────────────────────────────────────

fal.config({ credentials: ENV.FAL_KEY });

// ─── Types ───────────────────────────────────────────────

interface ChatMessage {
  role: MessageRole;
  content: string;
}

interface SessionConfig {
  language: string;
  speed: number;
}

interface InterviewInfo {
  id: string;
  type: InterviewType;
  difficulty: Difficulty;
  language: string;
  userId: string;
  jobPostingId?: string;
  resumeId?: string;
  memoryEnabled?: boolean;
}

// ─── Voice Session ───────────────────────────────────────

export class VoiceSession {
  private state: VoicePipelineState = "idle";
  private audioChunks: string[] = [];
  private conversationHistory: ChatMessage[] = [];
  private userLocation: string = "Unknown";
  private userCountry: string = "Unknown";
  private userIP: string = "Unknown";
  private isFirstInteraction: boolean = true;
  private config: SessionConfig = { language: "tr", speed: 1.0 };
  private abortController: AbortController | null = null;
  private send: (msg: ServerMessage) => void;
  private interview: InterviewInfo | null = null;
  private initialized = false;
  private currentCode: string = "";
  private currentCodeLanguage: CodeLanguage = "javascript";
  private hintCount: number = 0;
  private processing = false; // Guards against concurrent pipeline runs
  private currentWhiteboardState: WhiteboardState | null = null;

  // Question tracking (phone-screen)
  private currentQuestion: number = 0;
  private totalQuestions: number = 5;
  private recommendedSecondsPerQuestion: number = 300; // default 5 min

  // Time limit tracking
  private timeLimitMs: number = 0; // 0 = no limit
  private startTime: number = 0;
  private timeWarningTimer: ReturnType<typeof setTimeout> | null = null;
  private timeUpTimer: ReturnType<typeof setTimeout> | null = null;

  // Design problem reference for system-design intro
  private currentDesignProblem: {
    title?: string;
    description?: string;
    difficulty?: string;
    requirements?: {
      functional: string[];
      nonFunctional: string[];
    };
    discussionPoints?: string[];
  } | null = null;

  // Problem reference for solution comparison and intro generation
  private currentProblem: {
    title?: string;
    slug?: string;
    description?: string;
    difficulty?: string;
    relatedTopics?: string[];
    optimalSolution?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  } | null = null;

  constructor(send: (msg: ServerMessage) => void) {
    this.send = send;
  }

  /**
   * Initialize with interview data — loads config, prompt, and history from Convex.
   */
  async init(interviewId: string, problemId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      const interview = await convex.query(api.interviews.getById, {
        id: interviewId as any,
      });

      this.interview = {
        id: interview._id,
        type: interview.type as InterviewType,
        difficulty: interview.difficulty as Difficulty,
        language: interview.language,
        userId: interview.userId,
        jobPostingId: interview.jobPostingId ?? undefined,
        resumeId: interview.resumeId ?? undefined,
        memoryEnabled: interview.memoryEnabled ?? undefined,
      };

      this.config.language = interview.language;
      this.totalQuestions = interview.questionCount ?? 5;

      // Time limits per type
      if (this.interview.type === "phone-screen") {
        const timeLimitsMin: Record<string, number> = { easy: 15, medium: 25, hard: 35 };
        this.timeLimitMs = (timeLimitsMin[this.interview.difficulty] ?? 25) * 60 * 1000;
      } else if (this.interview.type === "live-coding") {
        const timeLimitsMin: Record<string, number> = { easy: 20, medium: 30, hard: 45 };
        this.timeLimitMs = (timeLimitsMin[this.interview.difficulty] ?? 30) * 60 * 1000;
      } else if (this.interview.type === "system-design") {
        const timeLimitsMin: Record<string, number> = { easy: 25, medium: 35, hard: 45 };
        this.timeLimitMs = (timeLimitsMin[this.interview.difficulty] ?? 35) * 60 * 1000;
      }

      // Build system prompt based on interview config
      const systemPrompt = getSystemPrompt(
        this.interview.type,
        this.interview.difficulty,
        this.interview.language,
      );
      this.conversationHistory.push({ role: "system", content: systemPrompt });

      // ── Personalization Context (Faz 6) ──────────────────
      await this.loadPersonalizationContext();

      // For system-design interviews, load a design problem
      if (this.interview.type === "system-design") {
        try {
          let designProblem = await convex.query(api.designProblems.getRandom, {
            difficulty: this.interview.difficulty as any,
          });

          // If no design problems exist, seed the table and retry
          if (!designProblem) {
            console.log("[init] No design problems found, seeding...");
            try {
              await convex.mutation(api.designProblems.seedIfEmpty, {});
              designProblem = await convex.query(api.designProblems.getRandom, {
                difficulty: this.interview.difficulty as any,
              });
            } catch (seedErr) {
              console.error("Failed to seed design problems:", seedErr);
            }
          }

          if (designProblem) {
            this.send({ type: "design_problem_loaded", problem: designProblem as any });
            // Store design problem info for intro generation
            this.currentDesignProblem = designProblem as any;
            // Add design problem context to conversation
            const reqText = [
              "Fonksiyonel Gereksinimler:",
              ...designProblem.requirements.functional.map((r: string) => `  - ${r}`),
              "Non-Fonksiyonel Gereksinimler:",
              ...designProblem.requirements.nonFunctional.map((r: string) => `  - ${r}`),
            ].join("\n");

            this.conversationHistory.push({
              role: "system",
              content: `[Mülakata atanan system design problemi]\nBaşlık: ${designProblem.title}\nZorluk: ${designProblem.difficulty}\nAçıklama: ${designProblem.description}\n\n${reqText}\n\nBu problemi adaya sor. Problemi kısaca sesli olarak açıkla, gereksinimleri paylaş ve adayın whiteboard üzerinde tasarım yapmasını bekle. Whiteboard'daki değişiklikleri takip edip yorumlayacaksın.`,
            });
            // Link design problem to interview
            try {
              await convex.mutation(api.interviews.setDesignProblem, {
                id: interviewId as any,
                designProblemId: designProblem._id,
              });
            } catch {
              // Non-fatal
            }
          } else {
            console.error("[init] No design problems available even after seeding");
          }
        } catch (err) {
          console.error("Failed to load design problem:", err);
        }
      }

      // For live-coding and practice interviews, load a specific or random problem
      if (this.interview.type === "live-coding" || this.interview.type === "practice") {
        console.log(`Loading problem for ${this.interview.type}, difficulty: ${this.interview.difficulty}, problemId: ${problemId || 'random'}`);
        try {
          let problem: any;
          if (problemId) {
            // Try leetcodeProblems first, then fall back to legacy problems
            try {
              const lc = await convex.query(api.leetcodeProblems.getById, {
                id: problemId as any,
              });
              if (lc) {
                problem = {
                  ...lc,
                  category: lc.relatedTopics?.[0] ?? "general",
                  testCases: [],
                };
              }
            } catch {
              // Not a leetcode problem ID, try legacy
              problem = await convex.query(api.problems.getById, {
                id: problemId as any,
              });
            }
            console.log("Specific problem loaded:", problem?._id);
          } else {
            // Load random problem by difficulty
            problem = await convex.query(api.problems.getRandom, {
              difficulty: this.interview.difficulty as any,
            });
            console.log("Random problem loaded:", problem?._id);
          }
          if (problem) {
            this.send({ type: "problem_loaded", problem: problem as any });
            // Store problem info for solution comparison and intro generation
            this.currentProblem = {
              title: problem.title,
              slug: problem.slug || problem.title.toLowerCase().replace(/\s+/g, '-'),
              description: problem.description,
              difficulty: problem.difficulty,
              relatedTopics: problem.relatedTopics ?? [],
              optimalSolution: problem.optimalSolution ?? undefined,
              timeComplexity: problem.timeComplexity ?? undefined,
              spaceComplexity: problem.spaceComplexity ?? undefined,
            };
            // Build rich problem context for AI
            const contextParts: string[] = [
              `[Mülakata atanan problem]`,
              `Başlık: ${problem.title}`,
              `Zorluk: ${problem.difficulty}`,
            ];

            // Category / topics
            if (problem.relatedTopics?.length > 0) {
              contextParts.push(`İlgili Konular: ${problem.relatedTopics.join(", ")}`);
            } else if (problem.category) {
              contextParts.push(`Kategori: ${problem.category}`);
            }

            // Companies context (shows this is a real interview question)
            if (problem.companies?.length > 0) {
              contextParts.push(`Bu soru şu şirketlerde sorulmuştur: ${problem.companies.slice(0, 5).join(", ")}`);
            }

            // Full description
            contextParts.push(`\nProblem Açıklaması:\n${problem.description}`);

            // Test cases (from problems table)
            if (problem.testCases?.length > 0) {
              const visibleTests = problem.testCases.filter((tc: any) => !tc.isHidden);
              if (visibleTests.length > 0) {
                contextParts.push(`\nÖrnek Test Case'ler:`);
                for (const tc of visibleTests.slice(0, 3)) {
                  contextParts.push(`  Girdi: ${tc.input} → Beklenen Çıktı: ${tc.expectedOutput}`);
                }
              }
            }

            // Complexity hints
            if (problem.timeComplexity) {
              contextParts.push(`Beklenen Zaman Karmaşıklığı: ${problem.timeComplexity}`);
            }
            if (problem.spaceComplexity) {
              contextParts.push(`Beklenen Alan Karmaşıklığı: ${problem.spaceComplexity}`);
            }

            // Interview behavior instructions
            contextParts.push(`\n--- MÜLAKAT TALİMATLARI ---`);
            contextParts.push(`Bu bir teknik mülakat sorusudur. Sen mülakatçısın, aday bu problemi çözmeye çalışacak.`);
            contextParts.push(`1. Problemi doğal bir dille açıkla (kod syntax'ı kullanma).`);
            contextParts.push(`2. Adayın yaklaşımını sor, direkt çözüm verme.`);
            contextParts.push(`3. Aday kodlarken sessiz kal, sadece takılırsa veya hata yaparsa yönlendir.`);
            contextParts.push(`4. Test sonuçlarını değerlendir, edge case'leri hatırlat.`);
            contextParts.push(`5. Her zaman bu probleme odaklan — konu dışına çıkma.`);

            this.conversationHistory.push({
              role: "system",
              content: contextParts.join("\n"),
            });
            // Link problem to interview (only for legacy problems table)
            if (!problem.leetcodeId) {
              try {
                await convex.mutation(api.interviews.setProblem, {
                  id: interviewId as any,
                  problemId: problem._id,
                });
              } catch {
                // Non-fatal
              }
            }
          }
        } catch (err) {
          console.error("Failed to load problem:", err);
        }
      }

      // Load existing messages from Convex (reconnect support)
      const existingMessages = await convex.query(api.messages.getRecent, {
        interviewId: interviewId as any,
        limit: 50,
      });

      for (const msg of existingMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          this.conversationHistory.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      this.initialized = true;

      // Send initial question counter for phone-screen
      if (this.interview.type === "phone-screen") {
        this.currentQuestion = 1;
        // Recommended seconds per question based on total time / question count
        const totalMinutes: Record<string, number> = { easy: 15, medium: 25, hard: 35 };
        const totalMin = totalMinutes[this.interview.difficulty] ?? 25;
        this.recommendedSecondsPerQuestion = Math.floor((totalMin * 60) / this.totalQuestions);
        this.send({
          type: "question_update",
          current: this.currentQuestion,
          total: this.totalQuestions,
          questionStartTime: Date.now(),
          recommendedSeconds: this.recommendedSecondsPerQuestion,
        });
      }

      // Start time limit timers
      if (this.timeLimitMs > 0) {
        this.startTime = Date.now();
        // Warning at 80% of time
        const warningMs = this.timeLimitMs * 0.8;
        this.timeWarningTimer = setTimeout(() => {
          const minutesLeft = Math.ceil((this.timeLimitMs - (Date.now() - this.startTime)) / 60000);
          this.send({ type: "time_warning", minutesLeft });
          // Inject time warning into conversation so AI knows
          this.conversationHistory.push({
            role: "system",
            content: `[SYSTEM: Mülakatın bitmesine yaklaşık ${minutesLeft} dakika kaldı. Eğer henüz sormadıysan son bir soru sor ve mülakatı nazikçe sonlandırmaya başla.]`,
          });
        }, warningMs);
        // Time up
        this.timeUpTimer = setTimeout(() => {
          this.conversationHistory.push({
            role: "system",
            content: `[SYSTEM: Mülakat süresi doldu. Adaya teşekkür et ve mülakatı sonlandır. Kısa ve nazik ol.]`,
          });
          // Trigger AI to wrap up
          this.triggerAIResponse();
        }, this.timeLimitMs);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Interview yüklenemedi";
      this.send({ type: "error", message });
    }
  }

  /**
   * Initialize without an interview — free mode with default prompt.
   */
  initFreeMode(): void {
    if (this.initialized) return;

    this.conversationHistory.push({
      role: "system",
      content: `Sen Wingman adında deneyimli bir teknik mülakatçısın. Türkçe konuşuyorsun. 
Adayı profesyonel ama samimi bir şekilde karşıla. Sorularını net ve anlaşılır sor.
Cevapları değerlendirirken yapıcı ol. Kısa ve öz konuş — her cevabın 2-3 cümleyi geçmesin.`,
    });
    this.initialized = true;
  }

  async handleMessage(raw: string): Promise<void> {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      this.send({ type: "error", message: "Geçersiz mesaj formatı" });
      return;
    }

    switch (msg.type) {
      case "config":
        if (msg.language) this.config.language = msg.language;
        if (msg.speed) this.config.speed = msg.speed;
        break;

      case "start_listening":
        this.audioChunks = [];
        this.setState("listening");

        // İlk mikrofon açıldığında intro sesini çal
        console.log(`[start_listening] isFirstInteraction: ${this.isFirstInteraction}, type: ${this.interview?.type}`);
        if (this.isFirstInteraction && this.interview) {
          this.isFirstInteraction = false;

          if (this.interview.type === "live-coding" || this.interview.type === "practice") {
            console.log("[start_listening] Playing pre-generated intro audio...");

            // Check if problem is loaded
            if (this.currentProblem?.slug) {
              const problemSlug = this.currentProblem.slug;
              console.log("[start_listening] Using problem slug:", problemSlug);

              const introText = getProblemIntro(problemSlug, this.currentProblem);
              console.log("[start_listening] Intro text:", introText.substring(0, 100) + "...");

              // Send the intro text to the client immediately
              this.send({ type: "ai_text", text: introText, done: true });

              // Generate TTS audio
              this.generateIntroAudio(introText);
            } else {
              // If problem not loaded yet, wait a bit and retry
              console.log("[start_listening] Problem not loaded yet, waiting...");
              setTimeout(() => {
                if (this.currentProblem?.slug) {
                  const problemSlug = this.currentProblem.slug;
                  const introText = getProblemIntro(problemSlug, this.currentProblem);
                  this.send({ type: "ai_text", text: introText, done: true });
                  this.generateIntroAudio(introText);
                } else {
                  // Fallback to LLM
                  this.conversationHistory.push({
                    role: "user",
                    content: "[SYSTEM: Kullanıcı hazır, problemi açıklamaya başla]",
                  });
                  this.triggerAIResponse();
                }
              }, 500); // Wait 500ms for problem to load
            }
          } else if (this.interview.type === "system-design") {
            // System design: AI introduces the design problem verbally
            console.log("[start_listening] System design — triggering AI intro for design problem...");

            if (this.currentDesignProblem?.title) {
              // Generate a natural intro for the design problem
              const introText = `Merhaba! Bugünkü system design mülakatımıza hoş geldin. Seninle "${this.currentDesignProblem.title}" konusunu tartışacağız. ${this.currentDesignProblem.description} Şimdi senden bu sistemi tasarlamanı istiyorum. Önce gereksinimleri birlikte netleştirelim. Sence bu sistemin en önemli fonksiyonel gereksinimleri neler olmalı?`;

              this.send({ type: "ai_text", text: introText, done: true });

              // Persist AI intro
              this.conversationHistory.push({ role: "assistant", content: introText });
              this.persistMessage("assistant", introText);

              // Generate TTS audio for the intro
              this.generateIntroAudio(introText);
            } else {
              // No design problem loaded, use LLM to generate the question
              console.log("[start_listening] No design problem loaded, using LLM...");
              this.conversationHistory.push({
                role: "user",
                content: "[SYSTEM: Kullanıcı hazır, system design problemi sor ve açıkla]",
              });
              this.triggerAIResponse();
            }
          } else if (this.interview.type === "phone-screen") {
            // Phone screen: AI introduces itself and starts with the first question
            console.log("[start_listening] Phone screen — triggering AI intro...");
            this.conversationHistory.push({
              role: "user",
              content: "[SYSTEM: Kullanıcı hazır, mülakata başla ve ilk soruyu sor]",
            });
            this.triggerAIResponse();
          }
        }
        break;

      case "audio_chunk":
        if (this.state === "listening") {
          this.audioChunks.push(msg.data);
        }
        break;

      case "stop_listening":
        if (this.state === "listening" && this.audioChunks.length > 0 && !this.processing) {
          await this.processAudio();
        } else if (!this.processing) {
          this.setState("idle");
        }
        break;

      case "interrupt":
        this.handleInterrupt();
        break;

      case "code_update":
        this.currentCode = msg.code;
        this.currentCodeLanguage = msg.language;
        break;

      case "code_result":
        await this.handleCodeResult(msg.results, msg.stdout, msg.stderr, msg.error);
        break;

      case "hint_request":
        if (!this.processing) {
          await this.handleHintRequest();
        }
        break;

      case "whiteboard_update":
        this.handleWhiteboardUpdate(msg.state);
        break;
    }
  }

  // ─── Personalization Context (Faz 6) ──────────────────

  private async loadPersonalizationContext(): Promise<void> {
    if (!this.interview) return;

    const parts: string[] = [];

    // 1. Job Posting context
    if (this.interview.jobPostingId) {
      try {
        const job = await convex.query(api.jobPostings.getById, {
          id: this.interview.jobPostingId as any,
        });
        if (job) {
          parts.push(
            `[Hedef Pozisyon Bilgisi]\nBaşlık: ${job.title}${job.company ? `\nŞirket: ${job.company}` : ""}${job.level ? `\nSeviye: ${job.level}` : ""}\nGereksinimler:\n${job.requirements.map((r) => `  - ${r}`).join("\n")}\nAranan Yetenekler: ${job.skills.join(", ")}\n\nBu pozisyona uygun sorular sor. İlandaki gereksinimlere ve yeteneklere odaklan. Adayın bu pozisyona uygunluğunu değerlendir.`,
          );
        }
      } catch {
        // non-fatal
      }
    }

    // 2. Resume context
    if (this.interview.resumeId) {
      try {
        const resume = await convex.query(api.resumes.getById, {
          id: this.interview.resumeId as any,
        });
        if (resume) {
          const expText = resume.experience
            .slice(0, 3)
            .map(
              (e) =>
                `  - ${e.role} @ ${e.company} (${e.duration})${e.highlights.length > 0 ? `: ${e.highlights.slice(0, 2).join(", ")}` : ""}`,
            )
            .join("\n");
          const eduText = resume.education
            .map((e) => `  - ${e.degree}, ${e.school}`)
            .join("\n");

          parts.push(
            `[Aday Özgeçmiş Bilgisi]${resume.name ? `\nİsim: ${resume.name}` : ""}${resume.title ? `\nMevcut Pozisyon: ${resume.title}` : ""}${resume.yearsOfExperience ? `\nDeneyim: ${resume.yearsOfExperience} yıl` : ""}\nYetenekler: ${resume.skills.join(", ")}\nDeneyim:\n${expText}\nEğitim:\n${eduText}\n\nÖzgeçmişindeki deneyimlere ve projelerine referans vererek sorular sor. "Özgeçmişinde X gördüm, bunu detaylandırır mısın?" gibi kişiselleştirilmiş sorular sor.`,
          );
        }
      } catch {
        // non-fatal
      }
    }

    // 3. User Profile context
    try {
      const profile = await convex.query(api.userProfiles.getByUser, {
        userId: this.interview.userId as any,
      });
      if (profile && (profile.interests.length > 0 || profile.goals)) {
        let profileText = "[Aday Profil Bilgisi]";
        if (profile.interests.length > 0) {
          profileText += `\nİlgi Alanları: ${profile.interests.join(", ")}`;
        }
        if (profile.goals) {
          profileText += `\nHedefler: ${profile.goals}`;
        }
        parts.push(profileText);
      }
    } catch {
      // non-fatal
    }

    // 4. Memory context (past performance)
    if (this.interview.memoryEnabled) {
      try {
        const memoryEntries = await convex.query(api.userMemory.getAllByUser, {
          userId: this.interview.userId as any,
        });

        if (memoryEntries.length > 0) {
          const memoryLines: string[] = ["[Geçmiş Performans Hafızası]"];

          for (const entry of memoryEntries) {
            try {
              const parsed = JSON.parse(entry.value);
              if (entry.key === "weak_topics" && Array.isArray(parsed) && parsed.length > 0) {
                memoryLines.push(`Zayıf Konular: ${parsed.join(", ")}`);
              } else if (entry.key === "strong_topics" && Array.isArray(parsed) && parsed.length > 0) {
                memoryLines.push(`Güçlü Konular: ${parsed.join(", ")}`);
              } else if (entry.key === "avg_score") {
                memoryLines.push(`Ortalama Skor: ${parsed}`);
              } else if (entry.key === "total_interviews") {
                memoryLines.push(`Toplam Mülakat: ${parsed}`);
              } else if (entry.key === "improvement_notes" && typeof parsed === "string") {
                memoryLines.push(`Gelişim Notları: ${parsed}`);
              }
            } catch {
              // skip unparseable
            }
          }

          if (memoryLines.length > 1) {
            memoryLines.push(
              "\nBu bilgileri kullanarak adayın zayıf yönlerinde daha fazla soru sor. Gelişim gösterdiği konularda bunu takdir et. Geçmiş performansına göre zorluk seviyesini ayarla.",
            );
            parts.push(memoryLines.join("\n"));
          }
        }
      } catch {
        // non-fatal
      }
    }

    // Inject all personalization parts as a single system message
    if (parts.length > 0) {
      this.conversationHistory.push({
        role: "system",
        content: parts.join("\n\n"),
      });
    }
  }

  // ─── Whiteboard Update ────────────────────────────────

  private handleWhiteboardUpdate(state: WhiteboardState): void {
    this.currentWhiteboardState = state;

    // Persist whiteboard state to Convex periodically
    if (this.interview) {
      convex
        .mutation(api.interviews.saveWhiteboardState, {
          id: this.interview.id as any,
          whiteboardState: JSON.stringify(state),
        })
        .catch(() => {
          // Non-fatal
        });
    }
  }

  // ─── Code Result → AI Analysis ───────────────────────

  private async handleCodeResult(
    results: TestResult[],
    stdout: string,
    stderr: string,
    error?: string,
  ): Promise<void> {
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    let summary = `\n[Kod Çalıştırma Sonucu]\n`;
    summary += `${passed}/${total} test geçti.\n`;

    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      summary += `Test ${i + 1}: ${r.passed ? "✅ Geçti" : `❌ Kaldı — Beklenen: ${r.expected}, Gerçek: ${r.actual}`}\n`;
    }

    if (error) summary += `Hata: ${error}\n`;
    if (stderr) summary += `Stderr: ${stderr}\n`;

    // Add to conversation so AI can respond
    this.conversationHistory.push({ role: "user", content: summary });
    this.persistMessage("user", summary);

    // Check if all tests passed for solution comparison (practice mode)
    this.checkSolutionComparison(results);

    // Auto-trigger AI response to comment on the results
    if (this.processing) return;
    this.processing = true;
    this.setState("processing");
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const aiResponse = await this.generateResponse(signal);
      if (!aiResponse || signal.aborted) return;

      this.conversationHistory.push({ role: "assistant", content: aiResponse });
      this.persistMessage("assistant", aiResponse);

      if (!signal.aborted) {
        this.setState("speaking");
        await this.synthesizeSpeech(aiResponse, signal);
      }
    } catch (err) {
      if (!signal.aborted) {
        const message = err instanceof Error ? err.message : "Code result response hatası";
        this.send({ type: "error", message });
      }
    } finally {
      this.processing = false;
      if (!signal.aborted) {
        this.send({ type: "ai_audio_done" });
        this.setState("idle");
      }
      this.abortController = null;
    }
  }

  // ─── Hint Request ────────────────────────────────────

  private async handleHintRequest(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.hintCount++;
    const level = Math.min(this.hintCount, 3);

    const hintLevelDescriptions: Record<number, string> = {
      1: "Genel yaklaşım ipucu ver. Hangi veri yapısı veya algoritma kullanılabilir sadece onu söyle. Detaya girme.",
      2: "Daha detaylı bir yönlendirme ver. Adımları kabaca açıkla ama kodu yazma.",
      3: "Pseudo-code seviyesinde ipucu ver. Çözümün iskeletini göster ama tam kodu verme.",
    };

    const hintPrompt = `[SYSTEM: Kullanıcı ipucu istedi (${level}. ipucu, toplam ${this.hintCount} kez istendi). ${hintLevelDescriptions[level]} Kısa ve öz ol, 2-3 cümleyi geçme.]`;

    // Notify client about hint level
    this.send({ type: "hint_given", level, totalHints: this.hintCount });

    // Inject hint request into conversation and trigger AI response
    this.conversationHistory.push({ role: "user", content: hintPrompt });
    this.persistMessage("user", `[İpucu istendi — Seviye ${level}]`);

    // Process the hint through the pipeline (LLM → TTS)
    this.setState("processing");
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const aiResponse = await this.generateResponse(signal);
      if (!aiResponse || signal.aborted) return;

      this.conversationHistory.push({ role: "assistant", content: aiResponse });
      this.persistMessage("assistant", aiResponse);

      if (!signal.aborted) {
        this.setState("speaking");
        await this.synthesizeSpeech(aiResponse, signal);
      }
    } catch (err) {
      if (!signal.aborted) {
        const message = err instanceof Error ? err.message : "Hint hatası";
        this.send({ type: "error", message });
      }
    } finally {
      this.processing = false;
      if (!signal.aborted) {
        this.send({ type: "ai_audio_done" });
        this.setState("idle");
      }
      this.abortController = null;
    }
  }

  // ─── Trigger AI response (for system-injected messages) ─

  private async triggerAIResponse(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.setState("processing");
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const aiResponse = await this.generateResponse(signal);
      if (!aiResponse || signal.aborted) return;

      this.conversationHistory.push({ role: "assistant", content: aiResponse });
      this.persistMessage("assistant", aiResponse);
      this.trackQuestionProgress(aiResponse);

      if (!signal.aborted) {
        this.setState("speaking");
        await this.synthesizeSpeech(aiResponse, signal);
      }
    } catch (err) {
      if (!signal.aborted) {
        const message = err instanceof Error ? err.message : "AI response hatası";
        this.send({ type: "error", message });
      }
    } finally {
      this.processing = false;
      if (!signal.aborted) {
        this.send({ type: "ai_audio_done" });
        this.setState("idle");
      }
      this.abortController = null;
    }
  }

  // ─── Question tracking ───────────────────────────────

  private trackQuestionProgress(aiResponse: string): void {
    if (!this.interview || this.interview.type !== "phone-screen") return;

    // Heuristic: detect new question in AI response (ends with ?)
    const questionMarks = (aiResponse.match(/\?/g) || []).length;
    const isAskingQuestion = questionMarks > 0 && aiResponse.trim().endsWith("?");

    if (isAskingQuestion && this.currentQuestion < this.totalQuestions) {
      this.currentQuestion++;
      this.send({
        type: "question_update",
        current: Math.min(this.currentQuestion, this.totalQuestions),
        total: this.totalQuestions,
        questionStartTime: Date.now(),
        recommendedSeconds: this.recommendedSecondsPerQuestion,
      });
    }

    // Inject question count awareness into conversation
    if (this.currentQuestion >= this.totalQuestions) {
      const alreadyInjected = this.conversationHistory.some((m) =>
        m.content.includes("[SYSTEM: Tüm sorular soruldu"),
      );
      if (!alreadyInjected) {
        this.conversationHistory.push({
          role: "system",
          content: `[SYSTEM: Tüm sorular soruldu (${this.totalQuestions}/${this.totalQuestions}). Adaya teşekkür et ve mülakatı sonlandır.]`,
        });
      }
    }
  }

  // ─── Solution comparison (practice mode) ─────────────

  private checkSolutionComparison(results: { passed: boolean }[]): void {
    if (!this.interview) return;
    if (this.interview.type !== "practice") return;
    if (!this.currentProblem?.optimalSolution) return;

    const allPassed = results.length > 0 && results.every((r) => r.passed);
    if (allPassed) {
      this.send({
        type: "solution_comparison",
        userSolution: this.currentCode,
        optimalSolution: this.currentProblem.optimalSolution,
        timeComplexity: this.currentProblem.timeComplexity,
        spaceComplexity: this.currentProblem.spaceComplexity,
      });
    }
  }

  // ─── Pipeline ────────────────────────────────────────

  private async processAudio(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.setState("processing");
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      // 1) STT
      const transcript = await this.transcribe(signal);
      if (!transcript || signal.aborted) {
        // STT returned nothing (too short / noise) — go back to idle
        if (!signal.aborted) {
          this.setState("idle");
        }
        return;
      }

      this.send({ type: "transcript", text: transcript, final: true });

      // Add user message to history
      this.conversationHistory.push({ role: "user", content: transcript });

      // Persist user message to Convex
      await this.persistMessage("user", transcript);

      // 2) LLM → streaming text
      const aiResponse = await this.generateResponse(signal);
      if (!aiResponse || signal.aborted) return;

      // Add assistant message to history
      this.conversationHistory.push({ role: "assistant", content: aiResponse });

      // Persist assistant message to Convex
      await this.persistMessage("assistant", aiResponse);

      // Track question progress for phone-screen
      this.trackQuestionProgress(aiResponse);

      // 3) TTS — send full response as audio
      if (!signal.aborted) {
        this.setState("speaking");
        await this.synthesizeSpeech(aiResponse, signal);
      }
    } catch (err) {
      if (!signal.aborted) {
        const message = err instanceof Error ? err.message : "Pipeline hatası";
        this.send({ type: "error", message });
      }
    } finally {
      this.processing = false;
      if (!signal.aborted) {
        this.send({ type: "ai_audio_done" });
        this.setState("idle");
      }
      this.abortController = null;
    }
  }

  // ─── Persist ─────────────────────────────────────────

  private async persistMessage(role: MessageRole, content: string): Promise<void> {
    if (!this.interview) return;

    try {
      await convex.mutation(api.messages.add, {
        interviewId: this.interview.id as any,
        role,
        content,
      });
    } catch {
      // Non-fatal — log but don't break pipeline
      console.error(`Failed to persist ${role} message for interview ${this.interview.id}`);
    }
  }

  // ─── STT ─────────────────────────────────────────────

  private async transcribe(signal: AbortSignal): Promise<string | null> {
    // Merge all base64 audio chunks into one buffer
    const combined = Buffer.concat(
      this.audioChunks.map((chunk) => Buffer.from(chunk, "base64")),
    );
    this.audioChunks = [];

    if (combined.length < 1000) return null; // too short

    const formData = new FormData();
    const blob = new Blob([combined], { type: "audio/webm" });
    formData.append("file", blob, "audio.webm");
    formData.append("language", this.config.language);

    const response = await fetch(
      `https://fal.run/${ENV.STT_ENDPOINT}/audio/transcriptions`,
      {
        method: "POST",
        headers: { Authorization: `Key ${ENV.FAL_KEY}` },
        body: formData,
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(`STT failed: ${response.status}`);
    }

    const result = (await response.json()) as { text: string };
    return result.text?.trim() || null;
  }

  // ─── LLM ─────────────────────────────────────────────

  private async generateResponse(signal: AbortSignal): Promise<string | null> {
    // Inject current code context if available
    const messages = [...this.conversationHistory];
    if (this.currentCode) {
      const codeContext: ChatMessage = {
        role: "system",
        content: `[Adayın şu anki kodu (${this.currentCodeLanguage})]:\n\`\`\`${this.currentCodeLanguage}\n${this.currentCode}\n\`\`\``,
      };
      // Insert code context before the last user message
      const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
      if (lastUserIdx >= 0) {
        messages.splice(lastUserIdx, 0, codeContext);
      } else {
        messages.push(codeContext);
      }
    }

    // Inject current whiteboard state for system-design interviews
    if (this.currentWhiteboardState) {
      const wbContext: ChatMessage = {
        role: "system",
        content: `[Adayın şu anki whiteboard tasarımı]\n${this.currentWhiteboardState.textRepresentation}`,
      };
      const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
      if (lastUserIdx >= 0) {
        messages.splice(lastUserIdx, 0, wbContext);
      } else {
        messages.push(wbContext);
      }
    }

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
          messages,
          stream: true,
        }),
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(`LLM failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (!token) continue;

          fullText += token;

          // Send token to client
          this.send({ type: "ai_text", text: token, done: false });
        } catch {
          // skip unparseable
        }
      }
    }

    this.send({ type: "ai_text", text: "", done: true });
    return fullText || null;
  }

  // ─── TTS ─────────────────────────────────────────────

  private async synthesizeSpeech(
    text: string,
    signal: AbortSignal,
  ): Promise<void> {
    // TTS için telaffuz optimizasyonu uygula (sadece Türkçe için)
    const optimizedText = this.interview?.language === "tr" ? optimizeForTTS(text) : text;

    // Split into sentences for lower latency
    const sentences = optimizedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [optimizedText];

    for (const sentence of sentences) {
      if (signal.aborted) return;
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      try {
        const stream = await fal.stream(ENV.TTS_ENDPOINT as any, {
          input: { input: trimmed, speed: this.config.speed },
          path: "/stream",
        } as any);

        for await (const event of stream as AsyncIterable<{
          audio?: string;
          done?: boolean;
          error?: { message: string };
        }>) {
          if (signal.aborted) return;
          if (event.audio) {
            this.send({ type: "ai_audio", data: event.audio });
          }
          if (event.error) {
            this.send({ type: "error", message: event.error.message });
          }
        }
      } catch {
        if (signal.aborted) return;
        // Fallback: generate full audio via /audio/speech
        await this.ttsFallback(trimmed, signal);
      }
    }
  }

  private async ttsFallback(
    text: string,
    signal: AbortSignal,
  ): Promise<void> {
    // TTS için telaffuz optimizasyonu uygula (sadece Türkçe için)
    const optimizedText = this.interview?.language === "tr" ? optimizeForTTS(text) : text;

    const response = await fetch(
      `https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${ENV.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: optimizedText,
          response_format: "pcm",
          speed: this.config.speed,
        }),
        signal,
      },
    );

    if (!response.ok) return;

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    this.send({ type: "ai_audio", data: base64 });
  }

  // ─── Interrupt ───────────────────────────────────────

  private handleInterrupt(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.processing = false;
    this.send({ type: "ai_audio_done" });
    this.setState("idle");
    this.audioChunks = [];
  }

  // ─── State ───────────────────────────────────────────

  private setState(state: VoicePipelineState): void {
    this.state = state;
    this.send({ type: "state_change", state });
  }

  cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.timeWarningTimer) {
      clearTimeout(this.timeWarningTimer);
      this.timeWarningTimer = null;
    }
    if (this.timeUpTimer) {
      clearTimeout(this.timeUpTimer);
      this.timeUpTimer = null;
    }
  }

  /**
   * Generate and stream intro audio for problems
   */
  private async generateIntroAudio(text: string): Promise<void> {
    try {
      this.setState("speaking");

      // Stream TTS audio
      const stream = await fal.stream(ENV.TTS_ENDPOINT as any, {
        input: { input: text, speed: this.config.speed },
        path: "/stream",
      } as any);

      for await (const event of stream as AsyncIterable<{
        audio?: string;
        done?: boolean;
        error?: { message: string };
      }>) {
        if (event.audio) {
          this.send({ type: "ai_audio", data: event.audio });
        }
        if (event.error) {
          this.send({ type: "error", message: event.error.message });
        }
        if (event.done) {
          this.setState("idle");
        }
      }
    } catch (error) {
      console.error("Error generating intro audio:", error);
      this.setState("idle");
      // Fallback to LLM if TTS fails
      this.conversationHistory.push({
        role: "user",
        content: "[SYSTEM: Kullanıcı hazır, problemi açıklamaya başla]",
      });
      this.triggerAIResponse();
    }
  }
}

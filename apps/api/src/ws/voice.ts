import { fal } from "@fal-ai/client";
import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { getSystemPrompt } from "../prompts";
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
}

// ─── Voice Session ───────────────────────────────────────

export class VoiceSession {
  private state: VoicePipelineState = "idle";
  private audioChunks: string[] = [];
  private conversationHistory: ChatMessage[] = [];
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

  // Time limit tracking
  private timeLimitMs: number = 0; // 0 = no limit
  private startTime: number = 0;
  private timeWarningTimer: ReturnType<typeof setTimeout> | null = null;
  private timeUpTimer: ReturnType<typeof setTimeout> | null = null;

  // Problem reference for solution comparison
  private currentProblem: { optimalSolution?: string; timeComplexity?: string; spaceComplexity?: string } | null = null;

  constructor(send: (msg: ServerMessage) => void) {
    this.send = send;
  }

  /**
   * Initialize with interview data — loads config, prompt, and history from Convex.
   */
  async init(interviewId: string): Promise<void> {
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
      }

      // Build system prompt based on interview config
      const systemPrompt = getSystemPrompt(
        this.interview.type,
        this.interview.difficulty,
        this.interview.language,
      );
      this.conversationHistory.push({ role: "system", content: systemPrompt });

      // For system-design interviews, load a design problem
      if (this.interview.type === "system-design") {
        try {
          const designProblem = await convex.query(api.designProblems.getRandom, {
            difficulty: this.interview.difficulty as any,
          });
          if (designProblem) {
            this.send({ type: "design_problem_loaded", problem: designProblem as any });
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
          }
        } catch (err) {
          console.error("Failed to load design problem:", err);
        }
      }

      // For live-coding and practice interviews, load a random problem
      if (this.interview.type === "live-coding" || this.interview.type === "practice") {
        try {
          const problem = await convex.query(api.problems.getRandom, {
            difficulty: this.interview.difficulty as any,
          });
          if (problem) {
            this.send({ type: "problem_loaded", problem: problem as any });
            // Store problem info for solution comparison
            this.currentProblem = {
              optimalSolution: problem.optimalSolution ?? undefined,
              timeComplexity: problem.timeComplexity ?? undefined,
              spaceComplexity: problem.spaceComplexity ?? undefined,
            };
            // Add problem context to conversation
            this.conversationHistory.push({
              role: "system",
              content: `[Mülakata atanan problem]\nBaşlık: ${problem.title}\nZorluk: ${problem.difficulty}\nKategori: ${problem.category}\nAçıklama: ${problem.description}\n\nBu problemi adaya sor. Problemi kısaca sesli olarak açıkla ve adayın çözmesini bekle.`,
            });
            // Link problem to interview
            try {
              await convex.mutation(api.interviews.setProblem, {
                id: interviewId as any,
                problemId: problem._id,
              });
            } catch {
              // Non-fatal
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
        this.send({ type: "question_update", current: this.currentQuestion, total: this.totalQuestions });
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
      content: `Sen Freya adında deneyimli bir teknik mülakatçısın. Türkçe konuşuyorsun. 
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
          "X-Title": "Freya AI Interview",
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
    // Split into sentences for lower latency
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];

    for (const sentence of sentences) {
      if (signal.aborted) return;
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      try {
        const stream = await fal.stream(`${ENV.TTS_ENDPOINT}/stream` as any, {
          input: { input: trimmed, speed: this.config.speed },
        });

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
    const response = await fetch(
      `https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${ENV.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
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
}

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

      // Build system prompt based on interview config
      const systemPrompt = getSystemPrompt(
        this.interview.type,
        this.interview.difficulty,
        this.interview.language,
      );
      this.conversationHistory.push({ role: "system", content: systemPrompt });

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
        if (this.state === "listening" && this.audioChunks.length > 0) {
          await this.processAudio();
        } else {
          this.setState("idle");
        }
        break;

      case "interrupt":
        this.handleInterrupt();
        break;
    }
  }

  // ─── Pipeline ────────────────────────────────────────

  private async processAudio(): Promise<void> {
    this.setState("processing");
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      // 1) STT
      const transcript = await this.transcribe(signal);
      if (!transcript || signal.aborted) return;

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
          messages: this.conversationHistory,
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
    this.send({ type: "ai_audio_done" });
    this.setState("listening");
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
  }
}

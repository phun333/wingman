import { os } from "@orpc/server";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../convex/_generated/api";
import { ENV } from "@ffh/env";

const base = os;

// ─── Users ───────────────────────────────────────────────

export const listUsers = base
  .route({ method: "GET", path: "/users", summary: "List all users" })
  .handler(async () => {
    return await convex.query(api.users.list);
  });

export const getUserById = base
  .route({ method: "GET", path: "/users/{id}", summary: "Get user by ID" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await convex.query(api.users.getById, { id: input.id as any });
  });

export const createUser = base
  .route({ method: "POST", path: "/users", summary: "Create a new user" })
  .input(
    z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })
  )
  .handler(async ({ input }) => {
    return await convex.mutation(api.users.create, input);
  });

export const updateUser = base
  .route({ method: "PUT", path: "/users/{id}", summary: "Update a user" })
  .input(
    z.object({
      id: z.string(),
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
    })
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return await convex.mutation(api.users.update, { id: id as any, ...data });
  });

export const deleteUser = base
  .route({ method: "DELETE", path: "/users/{id}", summary: "Delete a user" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await convex.mutation(api.users.remove, { id: input.id as any });
  });

// ─── Proxy: TTS ──────────────────────────────────────────

export const proxyTts = base
  .route({ method: "POST", path: "/proxy/tts", summary: "Proxy fal.ai TTS — generate speech from text" })
  .input(
    z.object({
      text: z.string().min(1).max(5000),
      response_format: z.enum(["mp3", "opus", "aac", "flac", "wav", "pcm"]).optional().default("wav"),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
    })
  )
  .handler(async ({ input }) => {
    const url = `https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: input.text,
        response_format: input.response_format,
        speed: input.speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS failed: ${response.status} — ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return {
      audio: base64Audio,
      content_type: response.headers.get("content-type") || "audio/wav",
      inference_time_ms: response.headers.get("X-Inference-Time-Ms") ?? null,
      audio_duration_sec: response.headers.get("X-Audio-Duration-Sec") ?? null,
    };
  });

// ─── Proxy: STT ──────────────────────────────────────────

export const proxyStt = base
  .route({ method: "POST", path: "/proxy/stt", summary: "Proxy fal.ai STT — transcribe audio" })
  .input(
    z.object({
      audio: z.string().describe("Base64-encoded audio data"),
      filename: z.string().optional().default("audio.wav"),
      language: z.string().optional().default("tr"),
    })
  )
  .handler(async ({ input }) => {
    const url = `https://fal.run/${ENV.STT_ENDPOINT}/audio/transcriptions`;

    const audioBuffer = Buffer.from(input.audio, "base64");
    const blob = new Blob([audioBuffer], { type: "audio/wav" });

    const formData = new FormData();
    formData.append("file", blob, input.filename);
    formData.append("language", input.language);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`STT failed: ${response.status} — ${errorText}`);
    }

    const result = await response.json();
    return result as { text: string };
  });

// ─── Proxy: LLM (OpenRouter) ────────────────────────────

export const proxyLlm = base
  .route({ method: "POST", path: "/proxy/llm", summary: "Proxy OpenRouter LLM — chat completion" })
  .input(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })
      ),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().optional(),
    })
  )
  .handler(async ({ input }) => {
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ENV.SITE_URL,
        "X-Title": "Freya Fal Hackathon",
      },
      body: JSON.stringify({
        model: input.model || ENV.OPENROUTER_MODEL,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM failed: ${response.status} — ${errorText}`);
    }

    return await response.json();
  });

// ─── Router ──────────────────────────────────────────────

export const router = {
  // Users
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // Proxies
  proxyTts,
  proxyStt,
  proxyLlm,
};

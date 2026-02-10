import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../convex/_generated/api";
import { ENV } from "@ffh/env";

export const apiRoutes = new Hono();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

apiRoutes.get(
  "/users",
  describeRoute({
    tags: ["Users"],
    summary: "List all users",
    responses: {
      200: {
        description: "List of users",
        content: { "application/json": { schema: resolver(z.array(z.object({ _id: z.string(), email: z.string(), name: z.string() }))) } },
      },
    },
  }),
  async (c) => {
    const users = await convex.query(api.users.list);
    return c.json(users);
  },
);

apiRoutes.get(
  "/users/:id",
  describeRoute({
    tags: ["Users"],
    summary: "Get user by ID",
    responses: { 200: { description: "User found" }, 404: { description: "Not found" } },
  }),
  validator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await convex.query(api.users.getById, { id: id as any });
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user);
  },
);

apiRoutes.post(
  "/users",
  describeRoute({
    tags: ["Users"],
    summary: "Create a new user",
    responses: { 201: { description: "User created" } },
  }),
  validator("json", z.object({ email: z.string().email(), name: z.string().min(1) })),
  async (c) => {
    const body = c.req.valid("json");
    const user = await convex.mutation(api.users.create, body);
    return c.json(user, 201);
  },
);

apiRoutes.put(
  "/users/:id",
  describeRoute({
    tags: ["Users"],
    summary: "Update a user",
    responses: { 200: { description: "User updated" } },
  }),
  validator("param", z.object({ id: z.string() })),
  validator("json", z.object({ email: z.string().email().optional(), name: z.string().min(1).optional() })),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = await convex.mutation(api.users.update, { id: id as any, ...body });
    return c.json(user);
  },
);

apiRoutes.delete(
  "/users/:id",
  describeRoute({
    tags: ["Users"],
    summary: "Delete a user",
    responses: { 200: { description: "User deleted" } },
  }),
  validator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");
    await convex.mutation(api.users.remove, { id: id as any });
    return c.json({ deleted: true });
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: TTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

apiRoutes.post(
  "/proxy/tts",
  describeRoute({
    tags: ["Proxy"],
    summary: "Proxy fal.ai TTS — generate speech from text",
    responses: { 200: { description: "Base64-encoded audio" } },
  }),
  validator(
    "json",
    z.object({
      text: z.string().min(1).max(5000),
      response_format: z.enum(["mp3", "opus", "aac", "flac", "wav", "pcm"]).optional().default("wav"),
      speed: z.number().min(0.25).max(4.0).optional().default(1.0),
    }),
  ),
  async (c) => {
    const { text, response_format, speed } = c.req.valid("json");
    const url = `https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, response_format, speed }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: `TTS failed: ${response.status} — ${errorText}` }, 502);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return c.json({
      audio: base64Audio,
      content_type: response.headers.get("content-type") || "audio/wav",
      inference_time_ms: response.headers.get("X-Inference-Time-Ms") ?? null,
      audio_duration_sec: response.headers.get("X-Audio-Duration-Sec") ?? null,
    });
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: STT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

apiRoutes.post(
  "/proxy/stt",
  describeRoute({
    tags: ["Proxy"],
    summary: "Proxy fal.ai STT — transcribe audio",
    responses: { 200: { description: "Transcription result" } },
  }),
  validator(
    "json",
    z.object({
      audio: z.string().describe("Base64-encoded audio data"),
      filename: z.string().optional().default("audio.wav"),
      language: z.string().optional().default("tr"),
    }),
  ),
  async (c) => {
    const { audio, filename, language } = c.req.valid("json");
    const url = `https://fal.run/${ENV.STT_ENDPOINT}/audio/transcriptions`;

    const audioBuffer = Buffer.from(audio, "base64");
    const blob = new Blob([audioBuffer], { type: "audio/wav" });

    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("language", language);

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Key ${ENV.FAL_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: `STT failed: ${response.status} — ${errorText}` }, 502);
    }

    const result = await response.json();
    return c.json(result as { text: string });
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: LLM (OpenRouter)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

apiRoutes.post(
  "/proxy/llm",
  describeRoute({
    tags: ["Proxy"],
    summary: "Proxy OpenRouter LLM — chat completion",
    responses: { 200: { description: "Chat completion response" } },
  }),
  validator(
    "json",
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        }),
      ),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().optional(),
    }),
  ),
  async (c) => {
    const { messages, model, temperature, max_tokens } = c.req.valid("json");
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
        model: model || ENV.OPENROUTER_MODEL,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: `LLM failed: ${response.status} — ${errorText}` }, 502);
    }

    return c.json(await response.json());
  },
);

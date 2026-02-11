import { ENV } from "@ffh/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar as apiReference } from "@scalar/hono-api-reference";
import { apiRoutes } from "./router";
import { VoiceSession } from "./ws/voice";
import type { ServerMessage } from "@ffh/types";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

// Middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Mount API routes
app.route("/api", apiRoutes);

// OpenAPI spec (auto-generated from hono-openapi)
app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "FFH API",
        version: "0.1.0",
        description: "Freya Fal Hackathon API",
      },
      tags: [
        { name: "Users", description: "User management" },
        { name: "Interviews", description: "Interview session management" },
        { name: "Proxy", description: "fal.ai & OpenRouter proxy endpoints" },
      ],
    },
  }),
);

// Scalar API docs
app.get(
  "/docs",
  apiReference({
    url: "/openapi.json",
    theme: "kepler",
  }),
);

// ─── WebSocket: Voice Pipeline ───────────────────────────

app.get(
  "/ws/voice",
  upgradeWebSocket((c) => {
    let session: VoiceSession | null = null;
    const url = new URL(c.req.url);
    const interviewId = url.searchParams.get("interviewId");
    const problemId = url.searchParams.get("problemId");

    return {
      onOpen(_event, ws) {
        console.log(`[WS] Connected: ${interviewId || 'free mode'}`);
        const send = (msg: ServerMessage) => {
          ws.send(JSON.stringify(msg));
        };
        session = new VoiceSession(send);

        // Initialize with interview data or free mode
        if (interviewId) {
          console.log(`[WS] Initializing session for interview: ${interviewId}, problemId: ${problemId || 'random'}`);
          session.init(interviewId, problemId || undefined).then(() => {
            console.log(`[WS] Session initialized successfully`);
            send({ type: "state_change", state: "idle" });
          }).catch((err) => {
            console.error(`[WS] Failed to init session:`, err);
            send({ type: "error", message: "Session init failed" });
          });
        } else {
          session.initFreeMode();
          send({ type: "state_change", state: "idle" });
        }
      },

      onMessage(event, _ws) {
        if (!session) return;
        const data =
          typeof event.data === "string"
            ? event.data
            : event.data.toString();
        // handleMessage is async — fire and catch errors
        session.handleMessage(data).catch((err) => {
          console.error("WS message handler error:", err);
        });
      },

      onClose() {
        session?.cleanup();
        session = null;
      },
    };
  }),
);

// ─── Start ───────────────────────────────────────────────

export default {
  port: ENV.PORT_API,
  fetch: app.fetch,
  websocket,
};

console.log(`🚀 API  → http://localhost:${ENV.PORT_API}`);
console.log(`📖 Docs → http://localhost:${ENV.PORT_API}/docs`);
console.log(`🔌 WS   → ws://localhost:${ENV.PORT_API}/ws/voice`);
console.log(`📋 Spec → http://localhost:${ENV.PORT_API}/openapi.json`);

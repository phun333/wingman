import { ENV } from "@ffh/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { serveStatic } from "hono/bun";
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

// ─── Auth Proxy → Convex HTTP (production'da .convex.site) ─
app.all("/api/auth/*", async (c) => {
  const convexHttpUrl = ENV.CONVEX_HTTP_URL;
  if (!convexHttpUrl) {
    // Dev'de proxy yok — Vite halleder
    return c.json({ error: "CONVEX_HTTP_URL not configured" }, 503);
  }

  const url = new URL(c.req.url);
  const target = `${convexHttpUrl}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.delete("host");

  const res = await fetch(target, {
    method: c.req.method,
    headers,
    body: ["GET", "HEAD"].includes(c.req.method) ? undefined : c.req.raw.body,
    duplex: "half",
  });

  // Cookie header'larını koru (Set-Cookie vs.)
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

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
        description: "Wingman AI Interview API",
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

// ─── Static Files + SPA Fallback (Production) ───────────
// Vite build output'u ./public'den serve edilir.
// Dev'de Vite kendi dev server'ından serve eder, buraya düşmez.

app.use("*", serveStatic({ root: "./public" }));
app.get("*", serveStatic({ root: "./public", path: "/index.html" }));

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

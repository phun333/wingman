import { ENV } from "@ffh/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { RPCHandler } from "@orpc/server/fetch";
import { Scalar as apiReference } from "@scalar/hono-api-reference";
import { router } from "./router";
import { generateOpenAPISpec } from "./openapi";
import { VoiceSession } from "./ws/voice";
import type { ServerMessage } from "@ffh/types";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

// Middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// OpenAPI spec
app.get("/openapi.json", async (c) => {
  const spec = await generateOpenAPISpec();
  return c.json(spec);
});

// Scalar API docs
app.get(
  "/docs",
  apiReference({
    url: "/openapi.json",
    theme: "kepler",
  }),
);

// oRPC handler
const rpcHandler = new RPCHandler(router);

app.all("/rpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
  });

  if (matched) return response;
  return c.json({ error: "Not Found" }, 404);
});

// ─── WebSocket: Voice Pipeline ───────────────────────────

app.get(
  "/ws/voice",
  upgradeWebSocket(() => {
    let session: VoiceSession | null = null;

    return {
      onOpen(_event, ws) {
        const send = (msg: ServerMessage) => {
          ws.send(JSON.stringify(msg));
        };
        session = new VoiceSession(send);
        send({ type: "state_change", state: "idle" });
      },

      onMessage(event, _ws) {
        if (!session) return;
        const data =
          typeof event.data === "string"
            ? event.data
            : event.data.toString();
        session.handleMessage(data);
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

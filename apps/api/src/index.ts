import { ENV } from "@ffh/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { Scalar as apiReference } from "@scalar/hono-api-reference";
import { router } from "./router";
import { generateOpenAPISpec } from "./openapi";

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
  })
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

// Start
export default {
  port: ENV.PORT_API,
  fetch: app.fetch,
};

console.log(`🚀 API  → http://localhost:${ENV.PORT_API}`);
console.log(`📖 Docs → http://localhost:${ENV.PORT_API}/docs`);
console.log(`📋 Spec → http://localhost:${ENV.PORT_API}/openapi.json`);

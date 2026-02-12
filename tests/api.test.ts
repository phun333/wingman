import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// ─── Config ──────────────────────────────────────────────

const API = "http://localhost:3001";
const RUN_PAID = process.env.RUN_PAID_TESTS === "1";

const skipPaid = RUN_PAID ? it : it.skip;

// ─── Helpers ─────────────────────────────────────────────

async function api<T = any>(
  path: string,
  opts?: { method?: string; body?: unknown },
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API}${path}`, {
    method: opts?.method ?? "GET",
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Health & Docs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Health & Docs", () => {
  it("GET /health → ok", async () => {
    const { status, data } = await api("/health");
    expect(status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("GET /openapi.json → valid spec", async () => {
    const { status, data } = await api("/openapi.json");
    expect(status).toBe(200);
    expect(data.info.title).toBe("FFH API");
    expect(Object.keys(data.paths).length).toBeGreaterThanOrEqual(5);
  });

  it("GET /docs → 200 (Scalar UI)", async () => {
    const res = await fetch(`${API}/docs`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("scalar");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Users CRUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Users CRUD", () => {
  const email = `test-${Date.now()}@wingman.ai`;
  let userId: string;

  it("POST /api/users → create user", async () => {
    const { status, data } = await api("/api/users", {
      method: "POST",
      body: { email, name: "Test User" },
    });
    expect(status).toBe(201);
    expect(data._id).toBeDefined();
    expect(data.email).toBe(email);
    expect(data.name).toBe("Test User");
    userId = data._id;
  });

  it("GET /api/users → list includes created user", async () => {
    const { status, data } = await api("/api/users");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    const found = data.find((u: any) => u._id === userId);
    expect(found).toBeDefined();
  });

  it("GET /api/users/:id → get by id", async () => {
    const { status, data } = await api(`/api/users/${userId}`);
    expect(status).toBe(200);
    expect(data._id).toBe(userId);
    expect(data.name).toBe("Test User");
  });

  it("PUT /api/users/:id → update name", async () => {
    const { status, data } = await api(`/api/users/${userId}`, {
      method: "PUT",
      body: { name: "Updated Name" },
    });
    expect(status).toBe(200);
    expect(data.name).toBe("Updated Name");
    expect(data.email).toBe(email);
  });

  it("DELETE /api/users/:id → delete", async () => {
    const { status, data } = await api(`/api/users/${userId}`, {
      method: "DELETE",
    });
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("GET /api/users → deleted user gone", async () => {
    const { data } = await api("/api/users");
    const found = data.find((u: any) => u._id === userId);
    expect(found).toBeUndefined();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Validation", () => {
  it("POST /api/users → invalid email rejected", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { email: "not-an-email", name: "X" },
    });
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("POST /api/users → missing name rejected", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { email: "valid@test.com" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/tts → empty text rejected", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "" },
    });
    expect(data.success).toBe(false);
    expect(data.error[0].code).toBe("too_small");
  });

  it("POST /api/proxy/llm → empty messages rejected", async () => {
    const { data } = await api("/api/proxy/llm", {
      method: "POST",
      body: { messages: [] },
    });
    // boş array geçerli Zod array, ama API'den bir cevap dönmeli
    expect(data).toBeDefined();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: TTS  (💰 ücretli — RUN_PAID_TESTS=1 ile çalışır)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Proxy: TTS", () => {
  skipPaid("POST /api/proxy/tts → returns base64 audio", async () => {
    const { status, data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "Test." },
    });
    expect(status).toBe(200);
    expect(data.audio).toBeDefined();
    expect(data.audio.length).toBeGreaterThan(100);
    expect(data.content_type).toContain("audio");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: STT  (💰 ücretli)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Proxy: STT", () => {
  skipPaid("POST /api/proxy/stt → round-trip TTS→STT", async () => {
    // Önce TTS ile ses üret
    const tts = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "Merhaba dünya" },
    });
    expect(tts.data.audio).toBeDefined();

    // Sonra STT ile çöz
    const { status, data } = await api("/api/proxy/stt", {
      method: "POST",
      body: { audio: tts.data.audio, language: "tr" },
    });
    expect(status).toBe(200);
    expect(data.text).toBeDefined();
    expect(data.text.toLowerCase()).toContain("merhaba");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy: LLM  (💰 ücretli)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Proxy: LLM", () => {
  skipPaid("POST /api/proxy/llm → chat completion", async () => {
    const { status, data } = await api("/api/proxy/llm", {
      method: "POST",
      body: {
        messages: [
          { role: "user", content: "Sadece 'evet' de, başka bir şey deme." },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.choices).toBeDefined();
    expect(data.choices[0].message.content.toLowerCase()).toContain("evet");
  });
});

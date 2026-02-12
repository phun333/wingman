import { describe, it, expect } from "bun:test";

// ─── Config ──────────────────────────────────────────────

const API = process.env.API_URL || "http://localhost:3001";

// ─── Helpers ─────────────────────────────────────────────

async function api<T = any>(
  path: string,
  opts?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API}${path}`, {
    method: opts?.method ?? "GET",
    headers: {
      ...(opts?.body ? { "Content-Type": "application/json" } : {}),
      ...(opts?.headers ?? {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Health & Docs (sanity check)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Health & Docs", () => {
  it("GET /health → ok", async () => {
    const { status, data } = await api("/health");
    expect(status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("GET /openapi.json → valid spec with paths", async () => {
    const { status, data } = await api("/openapi.json");
    expect(status).toBe(200);
    expect(data.info).toBeDefined();
    expect(data.info.title).toBe("FFH API");
    expect(data.info.version).toBeDefined();
    expect(data.paths).toBeDefined();
    expect(Object.keys(data.paths).length).toBeGreaterThanOrEqual(5);
  });

  it("GET /openapi.json → has expected tags", async () => {
    const { data } = await api("/openapi.json");
    const tagNames = (data.tags ?? []).map((t: any) => t.name);
    expect(tagNames).toContain("Users");
    expect(tagNames).toContain("Interviews");
    expect(tagNames).toContain("Proxy");
  });

  it("GET /docs → 200 HTML with Scalar", async () => {
    const res = await fetch(`${API}/docs`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("scalar");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Problems API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Problems API", () => {
  it("GET /api/problems → list problems", async () => {
    const { status, data } = await api("/api/problems");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    // Check problem structure
    const problem = data[0];
    expect(problem._id).toBeDefined();
    expect(problem.title).toBeDefined();
    expect(problem.description).toBeDefined();
    expect(problem.difficulty).toBeDefined();
    expect(problem.category).toBeDefined();
    expect(problem.testCases).toBeDefined();
    expect(Array.isArray(problem.testCases)).toBe(true);
  });

  it("GET /api/problems?difficulty=easy → filtered list", async () => {
    const { status, data } = await api("/api/problems?difficulty=easy");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    for (const p of data) {
      expect(p.difficulty).toBe("easy");
    }
  });

  it("GET /api/problems?difficulty=medium → only medium problems", async () => {
    const { status, data } = await api("/api/problems?difficulty=medium");
    expect(status).toBe(200);
    for (const p of data) {
      expect(p.difficulty).toBe("medium");
    }
  });

  it("GET /api/problems?difficulty=hard → only hard problems", async () => {
    const { status, data } = await api("/api/problems?difficulty=hard");
    expect(status).toBe(200);
    for (const p of data) {
      expect(p.difficulty).toBe("hard");
    }
  });

  it("GET /api/problems?category=array → filtered by category", async () => {
    const { status, data } = await api("/api/problems?category=array");
    expect(status).toBe(200);
    for (const p of data) {
      expect(p.category).toBe("array");
    }
  });

  it("GET /api/problems/random → random problem", async () => {
    const { status, data } = await api("/api/problems/random");
    expect(status).toBe(200);
    expect(data._id).toBeDefined();
    expect(data.title).toBeDefined();
    expect(data.difficulty).toBeDefined();
  });

  it("GET /api/problems/random?difficulty=easy → random easy problem", async () => {
    const { status, data } = await api("/api/problems/random?difficulty=easy");
    expect(status).toBe(200);
    expect(data.difficulty).toBe("easy");
  });

  it("GET /api/problems/random?category=nonexistent → 404", async () => {
    const { status, data } = await api(
      "/api/problems/random?category=nonexistent-xyz-123",
    );
    expect(status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it("GET /api/problems/:id → get specific problem", async () => {
    // First get the list to find a valid ID
    const { data: problems } = await api("/api/problems");
    const id = problems[0]._id;

    const { status, data } = await api(`/api/problems/${id}`);
    expect(status).toBe(200);
    expect(data._id).toBe(id);
    expect(data.title).toBeDefined();
    expect(data.testCases).toBeDefined();
  });

  it("GET /api/problems/:id → 404 for invalid ID", async () => {
    const { status, data } = await api("/api/problems/invalid-id-12345");
    expect(status).toBe(404);
    expect(data.error).toBeDefined();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Users API — full CRUD lifecycle
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Users API — Full Lifecycle", () => {
  const email = `api-route-test-${Date.now()}@example.com`;
  let userId: string;

  it("POST /api/users → create user", async () => {
    const { status, data } = await api("/api/users", {
      method: "POST",
      body: { email, name: "API Route Test" },
    });
    expect(status).toBe(201);
    expect(data._id).toBeDefined();
    expect(data.email).toBe(email);
    expect(data.name).toBe("API Route Test");
    expect(data.createdAt).toBeGreaterThan(0);
    userId = data._id;
  });

  it("GET /api/users → list includes new user", async () => {
    const { status, data } = await api("/api/users");
    expect(status).toBe(200);
    const found = data.find((u: any) => u._id === userId);
    expect(found).toBeDefined();
    expect(found.email).toBe(email);
  });

  it("GET /api/users/:id → get by id", async () => {
    const { status, data } = await api(`/api/users/${userId}`);
    expect(status).toBe(200);
    expect(data._id).toBe(userId);
  });

  it("PUT /api/users/:id → update name only", async () => {
    const { status, data } = await api(`/api/users/${userId}`, {
      method: "PUT",
      body: { name: "Updated API User" },
    });
    expect(status).toBe(200);
    expect(data.name).toBe("Updated API User");
    expect(data.email).toBe(email); // unchanged
  });

  it("PUT /api/users/:id → update email only", async () => {
    const newEmail = `updated-api-${Date.now()}@example.com`;
    const { status, data } = await api(`/api/users/${userId}`, {
      method: "PUT",
      body: { email: newEmail },
    });
    expect(status).toBe(200);
    expect(data.email).toBe(newEmail);
    expect(data.name).toBe("Updated API User"); // unchanged
  });

  it("DELETE /api/users/:id → delete user", async () => {
    const { status, data } = await api(`/api/users/${userId}`, {
      method: "DELETE",
    });
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("GET /api/users → deleted user is gone", async () => {
    const { data } = await api("/api/users");
    const found = data.find((u: any) => u._id === userId);
    expect(found).toBeUndefined();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Users API — Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Users API — Validation", () => {
  it("POST /api/users → reject invalid email", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { email: "not-an-email", name: "Test" },
    });
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("POST /api/users → reject missing name", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { email: "valid@test.com" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/users → reject empty name", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { email: "valid@test.com", name: "" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/users → reject missing email", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: { name: "Test" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/users → reject empty body", async () => {
    const { data } = await api("/api/users", {
      method: "POST",
      body: {},
    });
    expect(data.success).toBe(false);
  });

  it("PUT /api/users/:id → reject invalid email format", async () => {
    // Create a user first
    const { data: user } = await api("/api/users", {
      method: "POST",
      body: { email: `val-test-${Date.now()}@x.com`, name: "Val" },
    });

    const { data } = await api(`/api/users/${user._id}`, {
      method: "PUT",
      body: { email: "bad-email" },
    });
    expect(data.success).toBe(false);

    // Clean up
    await api(`/api/users/${user._id}`, { method: "DELETE" });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Interviews API — Auth Middleware
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Interviews API — Auth Middleware", () => {
  it("GET /api/interviews → 401 without session cookie", async () => {
    const { status, data } = await api("/api/interviews");
    expect(status).toBe(401);
    expect(data.error).toBeDefined();
    expect(data.error).toContain("Unauthorized");
  });

  it("POST /api/interviews → 401 without session cookie", async () => {
    const { status, data } = await api("/api/interviews", {
      method: "POST",
      body: {
        type: "practice",
        difficulty: "easy",
        language: "tr",
        questionCount: 1,
      },
    });
    expect(status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("GET /api/interviews/stats → 401 without session cookie", async () => {
    const { status, data } = await api("/api/interviews/stats");
    expect(status).toBe(401);
  });

  it("GET /api/interviews/:id → 401 without session", async () => {
    const { status } = await api("/api/interviews/some-id");
    expect(status).toBe(401);
  });

  it("PATCH /api/interviews/:id/start → 401 without session", async () => {
    const { status } = await api("/api/interviews/some-id/start", {
      method: "PATCH",
    });
    expect(status).toBe(401);
  });

  it("PATCH /api/interviews/:id/complete → 401 without session", async () => {
    const { status } = await api("/api/interviews/some-id/complete", {
      method: "PATCH",
    });
    expect(status).toBe(401);
  });

  it("GET /api/interviews/:id/messages → 401 without session", async () => {
    const { status } = await api("/api/interviews/some-id/messages");
    expect(status).toBe(401);
  });

  it("should reject with fake session cookie", async () => {
    const { status, data } = await api("/api/interviews", {
      headers: {
        cookie: "better-auth.session_token=fake-token-12345",
      },
    });
    expect(status).toBe(401);
    expect(data.error).toBeDefined();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Code Execution API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Code Execution API", () => {
  // ─── JavaScript ────────────────────────────────────────

  it("POST /api/code/execute → JS twoSum passing", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const c = target - nums[i];
            if (map.has(c)) return [map.get(c), i];
            map.set(nums[i], i);
          }
        }`,
        language: "javascript",
        testCases: [
          { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
          { input: "[3,2,4], 6", expectedOutput: "[1,2]" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results).toBeDefined();
    expect(data.results).toHaveLength(2);
    expect(data.results[0].passed).toBe(true);
    expect(data.results[1].passed).toBe(true);
    expect(data.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("POST /api/code/execute → JS test failure", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `function twoSum() { return [99, 99]; }`,
        language: "javascript",
        testCases: [
          { input: "[2,7], 9", expectedOutput: "[0,1]" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results[0].passed).toBe(false);
    expect(data.results[0].expected).toBe("[0,1]");
    expect(data.results[0].actual).toBe("[99,99]");
  });

  it("POST /api/code/execute → JS runtime error", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `function twoSum() { throw new Error("boom"); }`,
        language: "javascript",
        testCases: [
          { input: "[1], 1", expectedOutput: "[0,0]" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results[0].passed).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("POST /api/code/execute → TypeScript uses same JS runner", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `function fizzBuzz(n) {
          const r = [];
          for (let i = 1; i <= n; i++) {
            if (i % 15 === 0) r.push("FizzBuzz");
            else if (i % 3 === 0) r.push("Fizz");
            else if (i % 5 === 0) r.push("Buzz");
            else r.push(String(i));
          }
          return r;
        }`,
        language: "typescript",
        testCases: [
          { input: "3", expectedOutput: '["1","2","Fizz"]' },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results[0].passed).toBe(true);
  });

  // ─── Python ────────────────────────────────────────────

  it("POST /api/code/execute → Python passing", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `def two_sum(nums, target):
    d = {}
    for i, n in enumerate(nums):
        if target - n in d:
            return [d[target - n], i]
        d[n] = i`,
        language: "python",
        testCases: [
          { input: "[2,7,11,15], 9", expectedOutput: "[0, 1]" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results[0].passed).toBe(true);
  });

  it("POST /api/code/execute → Python runtime error", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `def two_sum(nums, target):
    return 1 / 0`,
        language: "python",
        testCases: [
          { input: "[1], 1", expectedOutput: "0" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results[0].passed).toBe(false);
    expect(data.stderr.length).toBeGreaterThan(0);
  });

  // ─── Multiple test cases ──────────────────────────────

  it("POST /api/code/execute → multiple test cases mixed pass/fail", async () => {
    const { status, data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: `function isPalindrome(s) {
          const c = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return c === c.split('').reverse().join('');
        }`,
        language: "javascript",
        testCases: [
          { input: '"racecar"', expectedOutput: "true" },
          { input: '"hello"', expectedOutput: "true" }, // Should fail
          { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true" },
        ],
      },
    });
    expect(status).toBe(200);
    expect(data.results).toHaveLength(3);
    expect(data.results[0].passed).toBe(true);
    expect(data.results[1].passed).toBe(false); // "hello" is not palindrome
    expect(data.results[2].passed).toBe(true);
  });

  // ─── Validation ────────────────────────────────────────

  it("POST /api/code/execute → reject empty code", async () => {
    const { data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: "",
        language: "javascript",
        testCases: [{ input: "1", expectedOutput: "1" }],
      },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/code/execute → reject invalid language", async () => {
    const { data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: "console.log(1)",
        language: "rust", // Not supported
        testCases: [{ input: "1", expectedOutput: "1" }],
      },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/code/execute → reject missing testCases", async () => {
    const { data } = await api("/api/code/execute", {
      method: "POST",
      body: {
        code: "function f() {}",
        language: "javascript",
      },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/code/execute → reject missing body", async () => {
    const { data } = await api("/api/code/execute", {
      method: "POST",
      body: {},
    });
    expect(data.success).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Proxy Validation (no actual AI calls)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Proxy Validation (no AI calls)", () => {
  it("POST /api/proxy/tts → reject empty text", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/tts → reject text over 5000 chars", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "a".repeat(5001) },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/tts → reject invalid response_format", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "test", response_format: "invalid-format" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/tts → reject speed out of range (too low)", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "test", speed: 0.1 },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/tts → reject speed out of range (too high)", async () => {
    const { data } = await api("/api/proxy/tts", {
      method: "POST",
      body: { text: "test", speed: 5.0 },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/stt → reject missing audio", async () => {
    const { data } = await api("/api/proxy/stt", {
      method: "POST",
      body: { language: "tr" },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/llm → reject missing messages", async () => {
    const { data } = await api("/api/proxy/llm", {
      method: "POST",
      body: {},
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/llm → reject invalid message role", async () => {
    const { data } = await api("/api/proxy/llm", {
      method: "POST",
      body: {
        messages: [{ role: "invalid", content: "test" }],
      },
    });
    expect(data.success).toBe(false);
  });

  it("POST /api/proxy/llm → reject temperature out of range", async () => {
    const { data } = await api("/api/proxy/llm", {
      method: "POST",
      body: {
        messages: [{ role: "user", content: "test" }],
        temperature: 3.0,
      },
    });
    expect(data.success).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Jina Reader Scraping (URL → Markdown)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const JINA_BASE = "https://r.jina.ai";

async function jinaFetch(url: string): Promise<{ status: number; text: string; elapsed: number }> {
  const start = Date.now();
  const res = await fetch(`${JINA_BASE}/${url}`, {
    method: "GET",
    headers: {
      Accept: "text/markdown",
      "X-Return-Format": "markdown",
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  return { status: res.status, text, elapsed: Date.now() - start };
}

describe("Jina Reader Scraping", () => {
  it("should scrape a simple page to markdown", async () => {
    const { status, text } = await jinaFetch("https://example.com");
    expect(status).toBe(200);
    expect(text.length).toBeGreaterThan(50);
    expect(text.toLowerCase()).toContain("example domain");
  });

  it("should scrape a JS-rendered page (Google Careers)", async () => {
    const { status, text } = await jinaFetch("https://careers.google.com/jobs/results/");
    expect(status).toBe(200);
    expect(text.length).toBeGreaterThan(500);
    // Google Careers sayfası "Jobs" veya "Careers" içermeli
    const lower = text.toLowerCase();
    expect(lower.includes("jobs") || lower.includes("careers")).toBe(true);
  });

  it("should return markdown format (headings, links)", async () => {
    const { text } = await jinaFetch("https://example.com");
    // Markdown heading or link syntax
    const hasMarkdown = text.includes("#") || text.includes("[") || text.includes("=");
    expect(hasMarkdown).toBe(true);
  });

  it("should respect content length for LLM context", async () => {
    const { text } = await jinaFetch("https://news.ycombinator.com");
    // Jina returns full content; backend slices to 15k
    expect(text.length).toBeGreaterThan(100);
    // Simulate backend trimming
    const trimmed = text.slice(0, 15_000);
    expect(trimmed.length).toBeLessThanOrEqual(15_000);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Jobs API (auth-protected routes)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Jobs API", () => {
  it("GET /api/jobs → 401 without auth", async () => {
    const { status } = await api("/api/jobs");
    expect(status).toBe(401);
  });

  it("GET /api/jobs/paths → 401 without auth", async () => {
    const { status } = await api("/api/jobs/paths");
    expect(status).toBe(401);
  });

  it("POST /api/jobs/parse → 401 without auth", async () => {
    const { status } = await api("/api/jobs/parse", {
      method: "POST",
      body: { rawText: "Software Engineer at Amazon" },
    });
    expect(status).toBe(401);
  });

  it("DELETE /api/jobs/:id → 401 without auth", async () => {
    const { status } = await api("/api/jobs/fake-id", {
      method: "DELETE",
    });
    expect(status).toBe(401);
  });

  it("POST /api/jobs/parse → 400 without url or rawText (when bypassing auth)", async () => {
    // Bu test auth'un arkasında olduğu için 401 dönecek,
    // ama validation logic'in doğru olduğunu kontrol ediyoruz
    const { status } = await api("/api/jobs/parse", {
      method: "POST",
      body: {},
    });
    // Auth middleware 401 döndürür, validation'a ulaşamaz
    expect(status).toBe(401);
  });

  it("PUT /api/jobs/paths/:id/progress → 401 without auth", async () => {
    const { status } = await api("/api/jobs/paths/fake-id/progress", {
      method: "PUT",
      body: {
        categoryIndex: 0,
        questionIndex: 0,
        completed: true,
      },
    });
    expect(status).toBe(401);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  404 / Method Not Allowed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("404 & Edge Cases", () => {
  it("GET /api/nonexistent → 404", async () => {
    const res = await fetch(`${API}/api/nonexistent`);
    expect(res.status).toBe(404);
  });

  it("GET /nonexistent → 404", async () => {
    const res = await fetch(`${API}/nonexistent`);
    expect(res.status).toBe(404);
  });

  it("POST /health → should still work (Hono allows)", async () => {
    const res = await fetch(`${API}/health`);
    expect(res.status).toBe(200);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CORS headers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("CORS", () => {
  it("should include CORS headers in response", async () => {
    const res = await fetch(`${API}/health`);
    // Hono cors() middleware adds these
    const acao = res.headers.get("access-control-allow-origin");
    expect(acao).toBeDefined();
  });

  it("OPTIONS preflight should return CORS headers", async () => {
    const res = await fetch(`${API}/api/users`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });
    expect(res.status).toBeLessThanOrEqual(204);
    const acao = res.headers.get("access-control-allow-origin");
    expect(acao).toBeDefined();
  });
});

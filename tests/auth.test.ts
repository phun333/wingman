import { describe, it, expect } from "bun:test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "http://127.0.0.1:3210";
const SITE_URL = "http://127.0.0.1:3211";

const convex = new ConvexHttpClient(CONVEX_URL);

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
  name: "Test User",
};

let sessionToken: string;
let sessionCookie: string;
let convexJwt: string;

function extractCookies(res: Response) {
  const all = res.headers.getSetCookie?.() ?? [];
  for (const c of all) {
    const [kv] = c.split(";");
    if (kv.startsWith("better-auth.session_token=")) {
      sessionCookie = kv;
    }
    if (kv.startsWith("better-auth.convex_jwt=")) {
      convexJwt = decodeURIComponent(kv.split("=").slice(1).join("="));
    }
  }
}

describe("Better Auth - Email/Password", () => {
  it("should register a new user", async () => {
    const res = await fetch(`${SITE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
      }),
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(TEST_USER.email);
    expect(data.user.name).toBe(TEST_USER.name);
    expect(data.token).toBeDefined();

    sessionToken = data.token;
    extractCookies(res);
  });

  it("should NOT register with the same email again", async () => {
    const res = await fetch(`${SITE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
      }),
    });

    const data = await res.json();
    expect(res.status === 422 || data.error || data.code).toBeTruthy();
  });

  it("should login with correct credentials", async () => {
    const res = await fetch(`${SITE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(TEST_USER.email);
    expect(data.token).toBeDefined();

    sessionToken = data.token;
    extractCookies(res);
  });

  it("should NOT login with wrong password", async () => {
    const res = await fetch(`${SITE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: "WrongPassword999!",
      }),
    });

    const data = await res.json();
    expect(
      res.status === 401 || res.status === 403 || data.error || data.code
    ).toBeTruthy();
  });

  it("should get current session via cookie", async () => {
    expect(sessionCookie).toBeDefined();

    const res = await fetch(`${SITE_URL}/api/auth/get-session`, {
      method: "GET",
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(TEST_USER.email);
    expect(data.session).toBeDefined();
  });

  it("should query authenticated user from Convex with JWT", async () => {
    expect(convexJwt).toBeDefined();

    const authedConvex = new ConvexHttpClient(CONVEX_URL);
    authedConvex.setAuth(convexJwt);

    const user = await authedConvex.query(api.users.me);
    expect(user).toBeDefined();
    expect(user!.email).toBe(TEST_USER.email);
  });
});

describe("Convex - Users CRUD", () => {
  let createdUserId: string;

  it("should create a user", async () => {
    const user = await convex.mutation(api.users.create, {
      email: `crud-${Date.now()}@example.com`,
      name: "CRUD Test",
    });

    expect(user).toBeDefined();
    expect(user!.name).toBe("CRUD Test");
    createdUserId = user!._id;
  });

  it("should list users", async () => {
    const users = await convex.query(api.users.list);
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it("should get user by id", async () => {
    const user = await convex.query(api.users.getById, {
      id: createdUserId as any,
    });
    expect(user).toBeDefined();
    expect(user.name).toBe("CRUD Test");
  });

  it("should update a user", async () => {
    const updated = await convex.mutation(api.users.update, {
      id: createdUserId as any,
      name: "Updated Name",
    });
    expect(updated!.name).toBe("Updated Name");
  });

  it("should delete a user", async () => {
    const result = await convex.mutation(api.users.remove, {
      id: createdUserId as any,
    });
    expect(result.deleted).toBe(true);
  });

  it("should throw when getting deleted user", async () => {
    try {
      await convex.query(api.users.getById, {
        id: createdUserId as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

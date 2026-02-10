import { createMiddleware } from "hono/factory";
import { ENV } from "@ffh/env";

/**
 * Auth middleware — better-auth session cookie'sini doğrular.
 * Başarılıysa c.set("userId", ...) ile Convex user ID'sini context'e ekler.
 */
export const authMiddleware = createMiddleware<{
  Variables: { userId: string; userName: string; userEmail: string };
}>(async (c, next) => {
  // Cookie header'ından session token çek
  const cookieHeader = c.req.header("cookie") ?? "";

  if (!cookieHeader.includes("better-auth.session_token")) {
    return c.json({ error: "Unauthorized — no session" }, 401);
  }

  try {
    // better-auth'a session validate isteği at
    const siteUrl = ENV.SITE_URL;
    const res = await fetch(`${siteUrl}/api/auth/get-session`, {
      method: "GET",
      headers: { cookie: cookieHeader },
    });

    if (!res.ok) {
      return c.json({ error: "Unauthorized — invalid session" }, 401);
    }

    const data = (await res.json()) as {
      user?: { id: string; name: string; email: string; convexUserId?: string };
      session?: { userId: string };
    };

    if (!data.user) {
      return c.json({ error: "Unauthorized — no user" }, 401);
    }

    // better-auth convex plugin user ID'yi convexUserId olarak set ediyor olabilir
    // yoksa user.id kullan
    const userId = data.user.convexUserId ?? data.user.id;

    c.set("userId", userId);
    c.set("userName", data.user.name);
    c.set("userEmail", data.user.email);

    await next();
  } catch {
    return c.json({ error: "Unauthorized — session check failed" }, 401);
  }
});

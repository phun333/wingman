import { createMiddleware } from "hono/factory";
import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

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

    // Better-auth user ID'si (authId)
    const authId = data.user.id;

    // Convex'te user'ı bul veya oluştur
    const convexUser = await convex.mutation(api.users.getOrCreateByAuthId, {
      authId: authId,
      email: data.user.email,
      name: data.user.name,
    });

    if (!convexUser) {
      return c.json({ error: "User not found in database" }, 401);
    }

    c.set("userId", convexUser._id);
    c.set("userName", convexUser.name);
    c.set("userEmail", convexUser.email);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Unauthorized — session check failed" }, 401);
  }
});

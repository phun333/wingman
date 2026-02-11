import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const profileRoutes = new Hono<AuthEnv>();

profileRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /profile — Get current user's profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

profileRoutes.get(
  "/",
  describeRoute({
    tags: ["Profile"],
    summary: "Get current user's profile",
    responses: {
      200: { description: "Profile data" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");

    const [profile, resumes, jobs, memory] = await Promise.all([
      convex.query(api.userProfiles.getByUser, { userId: userId as any }),
      convex.query(api.resumes.listByUser, { userId: userId as any }),
      convex.query(api.jobPostings.listByUser, { userId: userId as any }),
      convex.query(api.userMemory.getAllByUser, { userId: userId as any }),
    ]);

    return c.json({
      userId,
      name: c.get("userName"),
      email: c.get("userEmail"),
      profile: profile ?? null,
      resumes,
      jobPostings: jobs,
      memory,
    });
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUT /profile — Update user profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

profileRoutes.put(
  "/",
  describeRoute({
    tags: ["Profile"],
    summary: "Update user profile (interests, goals, language)",
    responses: {
      200: { description: "Profile updated" },
      401: { description: "Unauthorized" },
    },
  }),
  validator(
    "json",
    z.object({
      interests: z.array(z.string()).optional(),
      goals: z.string().optional(),
      preferredLanguage: z.string().optional(),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const profile = await convex.mutation(api.userProfiles.upsert, {
      userId: userId as any,
      interests: body.interests,
      goals: body.goals,
      preferredLanguage: body.preferredLanguage,
    });

    return c.json(profile);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /profile/memory — Get user memory entries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

profileRoutes.get(
  "/memory",
  describeRoute({
    tags: ["Profile"],
    summary: "Get all memory entries for user",
    responses: {
      200: { description: "Memory entries" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const entries = await convex.query(api.userMemory.getAllByUser, {
      userId: userId as any,
    });
    return c.json(entries);
  },
);

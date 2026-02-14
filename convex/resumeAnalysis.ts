import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: {
    userId: v.id("users"),
    resumeId: v.id("resumes"),
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
    ),
    topicProficiency: v.array(
      v.object({
        topic: v.string(),
        level: v.number(),
        shouldPractice: v.boolean(),
      }),
    ),
    targetCompanies: v.array(v.string()),
    strongTopics: v.array(v.string()),
    weakTopics: v.array(v.string()),
    difficultyDistribution: v.object({
      easy: v.number(),
      medium: v.number(),
      hard: v.number(),
    }),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Aynı resume için eski analiz varsa sil (her zaman güncel kalsın)
    const existing = await ctx.db
      .query("resumeAnalysis")
      .withIndex("by_resume", (q) => q.eq("resumeId", args.resumeId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    const id = await ctx.db.insert("resumeAnalysis", {
      ...args,
      analyzedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

// ─── Get by Resume ID ────────────────────────────────────

export const getByResume = query({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resumeAnalysis")
      .withIndex("by_resume", (q) => q.eq("resumeId", args.resumeId))
      .first();
  },
});

// ─── Get by User ID (en güncel) ──────────────────────────

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resumeAnalysis")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
  },
});

// ─── List all by User ────────────────────────────────────

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resumeAnalysis")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// ─── Delete ──────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("resumeAnalysis") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Resume analysis not found");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

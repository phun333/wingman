import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: {
    userId: v.id("users"),
    fileName: v.string(),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
    skills: v.array(v.string()),
    experience: v.array(
      v.object({
        company: v.string(),
        role: v.string(),
        duration: v.string(),
        highlights: v.array(v.string()),
      }),
    ),
    education: v.array(
      v.object({
        school: v.string(),
        degree: v.string(),
      }),
    ),
    rawText: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("resumes", {
      ...args,
      parsedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── Get by ID ───────────────────────────────────────────

export const getById = query({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    const resume = await ctx.db.get(args.id);
    if (!resume) throw new Error("Resume not found");
    return resume;
  },
});

// ─── List by User ────────────────────────────────────────

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// ─── Delete ──────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Resume not found");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

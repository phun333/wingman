import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    company: v.optional(v.string()),
    requirements: v.array(v.string()),
    skills: v.array(v.string()),
    level: v.optional(v.string()),
    rawContent: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("jobPostings", {
      ...args,
      parsedAt: Date.now(),
    });

    // Automatically create interview path for this job
    await ctx.scheduler.runAfter(0, api.jobInterviewPaths.createForJob, {
      userId: args.userId,
      jobPostingId: id,
    });

    return await ctx.db.get(id);
  },
});

// ─── Get by ID ───────────────────────────────────────────

export const getById = query({
  args: { id: v.id("jobPostings") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job posting not found");
    return job;
  },
});

// ─── List by User ────────────────────────────────────────

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobPostings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// ─── Delete ──────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("jobPostings") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Job posting not found");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

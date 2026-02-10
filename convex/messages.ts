import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Add ─────────────────────────────────────────────────

export const add = mutation({
  args: {
    interviewId: v.id("interviews"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    audioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    const id = await ctx.db.insert("messages", {
      interviewId: args.interviewId,
      role: args.role,
      content: args.content,
      audioUrl: args.audioUrl,
      timestamp: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── List by Interview ───────────────────────────────────

export const listByInterview = query({
  args: { interviewId: v.id("interviews") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_interview_timestamp", (q) =>
        q.eq("interviewId", args.interviewId),
      )
      .order("asc")
      .collect();
  },
});

// ─── Get Recent ──────────────────────────────────────────

export const getRecent = query({
  args: {
    interviewId: v.id("interviews"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_interview_timestamp", (q) =>
        q.eq("interviewId", args.interviewId),
      )
      .order("desc")
      .take(limit);
    // Return in chronological order
    return messages.reverse();
  },
});

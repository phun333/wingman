import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("live-coding"),
      v.literal("system-design"),
      v.literal("phone-screen"),
      v.literal("practice"),
    ),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    language: v.string(),
    questionCount: v.number(),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("interviews", {
      userId: args.userId,
      type: args.type,
      difficulty: args.difficulty,
      language: args.language,
      questionCount: args.questionCount,
      config: args.config,
      status: "created",
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── Start ───────────────────────────────────────────────

export const start = mutation({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    if (interview.status !== "created") {
      throw new Error(`Cannot start interview with status: ${interview.status}`);
    }
    await ctx.db.patch(args.id, {
      status: "in-progress",
      startedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

// ─── Complete ────────────────────────────────────────────

export const complete = mutation({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    if (interview.status !== "in-progress") {
      throw new Error(`Cannot complete interview with status: ${interview.status}`);
    }
    await ctx.db.patch(args.id, {
      status: "completed",
      endedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

// ─── Save Code ───────────────────────────────────────────

export const saveCode = mutation({
  args: {
    id: v.id("interviews"),
    code: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    await ctx.db.patch(args.id, {
      finalCode: args.code,
      codeLanguage: args.language,
    });
    return await ctx.db.get(args.id);
  },
});

// ─── Set Problem ─────────────────────────────────────────

export const setProblem = mutation({
  args: {
    id: v.id("interviews"),
    problemId: v.id("problems"),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    await ctx.db.patch(args.id, { problemId: args.problemId });
    return await ctx.db.get(args.id);
  },
});

// ─── Set Design Problem ──────────────────────────────────

export const setDesignProblem = mutation({
  args: {
    id: v.id("interviews"),
    designProblemId: v.id("designProblems"),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    await ctx.db.patch(args.id, { designProblemId: args.designProblemId });
    return await ctx.db.get(args.id);
  },
});

// ─── Save Whiteboard State ───────────────────────────────

export const saveWhiteboardState = mutation({
  args: {
    id: v.id("interviews"),
    whiteboardState: v.string(),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    await ctx.db.patch(args.id, { whiteboardState: args.whiteboardState });
  },
});

// ─── Evaluate (set status to evaluated) ──────────────────

export const evaluate = mutation({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    await ctx.db.patch(args.id, { status: "evaluated" });
    return await ctx.db.get(args.id);
  },
});

// ─── Get by ID ───────────────────────────────────────────

export const getById = query({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) throw new Error("Interview not found");
    return interview;
  },
});

// ─── List by User ────────────────────────────────────────

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return interviews;
  },
});

// ─── Get Active ──────────────────────────────────────────

export const getActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("interviews")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "in-progress"),
      )
      .first();
    return active;
  },
});

// ─── User Stats ──────────────────────────────────────────

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("interviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const total = all.length;
    const completed = all.filter((i) => i.status === "completed" || i.status === "evaluated").length;

    // This week
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = all.filter((i) => i.createdAt > weekAgo).length;

    return { total, completed, thisWeek };
  },
});

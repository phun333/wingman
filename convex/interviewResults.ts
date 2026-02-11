import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: {
    interviewId: v.id("interviews"),
    userId: v.id("users"),
    overallScore: v.number(),
    hireRecommendation: v.union(
      v.literal("strong-hire"),
      v.literal("hire"),
      v.literal("lean-hire"),
      v.literal("no-hire"),
    ),
    categoryScores: v.object({
      problemSolving: v.number(),
      communication: v.number(),
      codeQuality: v.optional(v.number()),
      systemThinking: v.optional(v.number()),
      analyticalThinking: v.number(),
    }),
    codeAnalysis: v.optional(
      v.object({
        timeComplexity: v.string(),
        spaceComplexity: v.string(),
        userSolution: v.string(),
        optimalSolution: v.string(),
        optimizationSuggestions: v.array(v.string()),
      }),
    ),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    summary: v.string(),
    nextSteps: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("interviewResults", {
      ...args,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── Get by Interview ────────────────────────────────────

export const getByInterview = query({
  args: { interviewId: v.id("interviews") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewResults")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();
  },
});

// ─── List by User ────────────────────────────────────────

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("interviewResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// ─── Get User Progress Stats ─────────────────────────────

export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("interviewResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (results.length === 0) {
      return {
        totalEvaluated: 0,
        averageScore: 0,
        highestScore: 0,
        thisMonth: 0,
        streak: 0,
        results: [],
      };
    }

    const scores = results.map((r) => r.overallScore);
    const averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );
    const highestScore = Math.max(...scores);

    // This month count
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const thisMonth = results.filter((r) => r.createdAt > monthAgo).length;

    // Streak: consecutive days with at least one interview
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const resultDays = new Set(
      results.map((r) => {
        const d = new Date(r.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );

    for (let i = 0; i < 365; i++) {
      const checkDay = today.getTime() - i * dayMs;
      if (resultDays.has(checkDay)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Top strengths/weaknesses across last 10
    const recent = results.slice(0, 10);
    const strengthCounts = new Map<string, number>();
    const weaknessCounts = new Map<string, number>();

    for (const r of recent) {
      for (const s of r.strengths) {
        strengthCounts.set(s, (strengthCounts.get(s) ?? 0) + 1);
      }
      for (const w of r.weaknesses) {
        weaknessCounts.set(w, (weaknessCounts.get(w) ?? 0) + 1);
      }
    }

    const topStrengths = [...strengthCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const topWeaknesses = [...weaknessCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    return {
      totalEvaluated: results.length,
      averageScore,
      highestScore,
      thisMonth,
      streak,
      topStrengths,
      topWeaknesses,
      results,
    };
  },
});

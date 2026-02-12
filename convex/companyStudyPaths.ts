import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Generate Company Study Path ────────────────────────

export const generate = mutation({
  args: {
    userId: v.id("users"),
    company: v.string(),
    difficulty: v.optional(
      v.union(
        v.literal("mixed"),
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard"),
      ),
    ),
    maxProblems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const difficulty = args.difficulty ?? "mixed";
    const maxProblems = args.maxProblems ?? 50;

    // Aynı kullanıcı + şirket için mevcut path var mı?
    const existing = await ctx.db
      .query("companyStudyPaths")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("company", args.company),
      )
      .first();

    if (existing) {
      return existing;
    }

    // Şirketin problemlerini bul
    const all = await ctx.db.query("leetcodeProblems").collect();
    const companyLower = args.company.toLowerCase();

    let problems = all.filter((p) =>
      p.companies.some((c) => c.toLowerCase() === companyLower),
    );

    // Difficulty filtresi
    if (difficulty !== "mixed") {
      problems = problems.filter((p) => p.difficulty === difficulty);
    }

    // Frequency'ye göre sırala (en çok sorulan önce)
    problems.sort((a, b) => b.frequency - a.frequency);

    // Max limitine kes
    problems = problems.slice(0, maxProblems);

    if (problems.length === 0) {
      throw new Error(
        `"${args.company}" için LeetCode problemi bulunamadı.`,
      );
    }

    // Topic bazlı grupla
    const topicMap = new Map<
      string,
      typeof problems
    >();

    for (const p of problems) {
      // Ana topic (ilk related topic ya da "Other")
      const topic =
        p.relatedTopics.length > 0 ? p.relatedTopics[0]! : "Other";
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      topicMap.get(topic)!.push(p);
    }

    // Section'ları oluştur: topic içinde difficulty sırasıyla (easy → medium → hard)
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    const sections = Array.from(topicMap.entries())
      .sort((a, b) => b[1].length - a[1].length) // En çok problemli topic önce
      .map(([topic, topicProblems]) => ({
        topic,
        problems: topicProblems
          .sort(
            (a, b) =>
              diffOrder[a.difficulty] - diffOrder[b.difficulty] ||
              b.frequency - a.frequency,
          )
          .map((p) => ({
            leetcodeId: p.leetcodeId,
            leetcodeProblemId: p._id,
            title: p.title,
            difficulty: p.difficulty,
            url: p.url,
            completed: false,
          })),
      }));

    const totalProblems = sections.reduce(
      (acc, s) => acc + s.problems.length,
      0,
    );

    const stats = {
      easy: {
        total: problems.filter((p) => p.difficulty === "easy").length,
        completed: 0,
      },
      medium: {
        total: problems.filter((p) => p.difficulty === "medium").length,
        completed: 0,
      },
      hard: {
        total: problems.filter((p) => p.difficulty === "hard").length,
        completed: 0,
      },
    };

    const now = Date.now();
    const id = await ctx.db.insert("companyStudyPaths", {
      userId: args.userId,
      company: args.company,
      title: `${args.company} Mülakat Hazırlığı`,
      difficulty,
      sections,
      totalProblems,
      completedProblems: 0,
      progress: 0,
      stats,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

// ─── Get by ID ──────────────────────────────────────────

export const getById = query({
  args: { id: v.id("companyStudyPaths") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── List User's Paths ─────────────────────────────────

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companyStudyPaths")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// ─── Get User's Path for Company ────────────────────────

export const getByUserAndCompany = query({
  args: {
    userId: v.id("users"),
    company: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companyStudyPaths")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("company", args.company),
      )
      .first();
  },
});

// ─── Mark Problem as Completed ──────────────────────────

export const markProblemCompleted = mutation({
  args: {
    pathId: v.id("companyStudyPaths"),
    sectionIndex: v.number(),
    problemIndex: v.number(),
    completed: v.boolean(),
    interviewId: v.optional(v.id("interviews")),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.pathId);
    if (!path) throw new Error("Study path not found");

    const sections = [...path.sections];
    const section = sections[args.sectionIndex];
    if (!section) throw new Error("Section not found");

    const problem = section.problems[args.problemIndex];
    if (!problem) throw new Error("Problem not found");

    const wasCompleted = problem.completed;
    problem.completed = args.completed;
    if (args.interviewId) problem.interviewId = args.interviewId;
    if (args.score !== undefined) problem.score = args.score;
    if (args.completed) problem.completedAt = Date.now();

    // Stats güncelle
    const stats = { ...path.stats };
    const diff = problem.difficulty;
    if (args.completed && !wasCompleted) {
      stats[diff] = {
        ...stats[diff],
        completed: stats[diff].completed + 1,
      };
    } else if (!args.completed && wasCompleted) {
      stats[diff] = {
        ...stats[diff],
        completed: Math.max(0, stats[diff].completed - 1),
      };
    }

    // Progress hesapla
    const completedProblems =
      stats.easy.completed + stats.medium.completed + stats.hard.completed;
    const progress =
      path.totalProblems > 0
        ? Math.round((completedProblems / path.totalProblems) * 100)
        : 0;

    await ctx.db.patch(args.pathId, {
      sections,
      completedProblems,
      progress,
      stats,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.pathId);
  },
});

// ─── Delete Path ────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("companyStudyPaths") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

// ─── Reset Path Progress ────────────────────────────────

export const resetProgress = mutation({
  args: { id: v.id("companyStudyPaths") },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.id);
    if (!path) throw new Error("Study path not found");

    const sections = path.sections.map((s) => ({
      ...s,
      problems: s.problems.map((p) => ({
        ...p,
        completed: false,
        interviewId: undefined,
        score: undefined,
        completedAt: undefined,
      })),
    }));

    const stats = {
      easy: { total: path.stats.easy.total, completed: 0 },
      medium: { total: path.stats.medium.total, completed: 0 },
      hard: { total: path.stats.hard.total, completed: 0 },
    };

    await ctx.db.patch(args.id, {
      sections,
      completedProblems: 0,
      progress: 0,
      stats,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

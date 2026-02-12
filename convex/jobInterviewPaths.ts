import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create Interview Path for Job ──────────────────────
export const createForJob = mutation({
  args: {
    userId: v.id("users"),
    jobPostingId: v.id("jobPostings"),
  },
  handler: async (ctx, args) => {
    // Check if path already exists
    const existing = await ctx.db
      .query("jobInterviewPaths")
      .withIndex("by_user_job", (q) =>
        q.eq("userId", args.userId).eq("jobPostingId", args.jobPostingId)
      )
      .first();

    if (existing) {
      return existing;
    }

    // Get job posting details
    const job = await ctx.db.get(args.jobPostingId);
    if (!job) throw new Error("Job posting not found");

    // Generate questions from LeetCode DB + role-specific behavioral
    const questions = await generateQuestionsForJob(ctx, job);

    const now = Date.now();
    const id = await ctx.db.insert("jobInterviewPaths", {
      userId: args.userId,
      jobPostingId: args.jobPostingId,
      title: `${job.company} - ${job.title}`,
      description: `İş ilanına özel hazırlanmış mülakat soruları`,
      totalQuestions: questions.reduce((acc, cat) => acc + cat.questions.length, 0),
      completedQuestions: 0,
      categories: questions,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

// ─── Get Path by ID ─────────────────────────────────────
export const getById = query({
  args: {
    id: v.id("jobInterviewPaths"),
  },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.id);
    if (!path) return null;

    const job = await ctx.db.get(path.jobPostingId);
    return {
      ...path,
      job: job ? {
        title: job.title,
        company: job.company,
        level: job.level,
      } : null,
    };
  },
});

// ─── Get Path by Job ────────────────────────────────────
export const getByJob = query({
  args: {
    userId: v.id("users"),
    jobPostingId: v.id("jobPostings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobInterviewPaths")
      .withIndex("by_user_job", (q) =>
        q.eq("userId", args.userId).eq("jobPostingId", args.jobPostingId)
      )
      .first();
  },
});

// ─── List User's Paths ───────────────────────────────────
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const paths = await ctx.db
      .query("jobInterviewPaths")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get job details for each path
    const pathsWithJobs = await Promise.all(
      paths.map(async (path) => {
        const job = await ctx.db.get(path.jobPostingId);
        return {
          ...path,
          job: job ? {
            title: job.title,
            company: job.company,
            level: job.level,
          } : null,
        };
      })
    );

    return pathsWithJobs;
  },
});

// ─── Update Question Progress ───────────────────────────
export const updateQuestionProgress = mutation({
  args: {
    pathId: v.id("jobInterviewPaths"),
    categoryIndex: v.number(),
    questionIndex: v.number(),
    completed: v.boolean(),
    interviewId: v.optional(v.id("interviews")),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.pathId);
    if (!path) throw new Error("Path not found");

    // Update question status
    const categories = [...path.categories];
    const category = categories[args.categoryIndex];
    if (!category) throw new Error("Category not found");
    const question = category.questions[args.questionIndex];
    if (!question) throw new Error("Question not found");
    question.completed = args.completed;
    if (args.interviewId) question.interviewId = args.interviewId;
    if (args.score !== undefined) question.score = args.score;

    // Calculate progress
    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
    const completedQuestions = categories.reduce(
      (acc, cat) => acc + cat.questions.filter(q => q.completed).length,
      0
    );
    const progress = Math.round((completedQuestions / totalQuestions) * 100);

    await ctx.db.patch(args.pathId, {
      categories,
      completedQuestions,
      progress,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.pathId);
  },
});

// ─── Helper: Generate Questions from LeetCode DB ────────

interface PathQuestion {
  id: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  leetcodeId?: number;
  leetcodeUrl?: string;
}

interface PathCategory {
  name: string;
  type: "live-coding" | "system-design" | "phone-screen";
  questions: PathQuestion[];
}

async function generateQuestionsForJob(
  ctx: any,
  job: any,
): Promise<PathCategory[]> {
  const categories: PathCategory[] = [];
  const company = job.company ?? "";
  const companyLower = company.toLowerCase();

  // ── 1. LeetCode'dan şirketin gerçek sorularını çek ──
  const allProblems = await ctx.db.query("leetcodeProblems").collect();
  const companyProblems = allProblems
    .filter((p: any) =>
      p.companies.some((c: string) => c.toLowerCase() === companyLower),
    )
    .sort((a: any, b: any) => b.frequency - a.frequency);

  // ── 2. Live Coding — Şirketin en çok sorduğu LeetCode soruları ──
  if (companyProblems.length > 0) {
    // Difficulty dengesine göre seç: 2 easy, 4 medium, 2 hard (max 8)
    const easy = companyProblems.filter((p: any) => p.difficulty === "easy").slice(0, 2);
    const medium = companyProblems.filter((p: any) => p.difficulty === "medium").slice(0, 4);
    const hard = companyProblems.filter((p: any) => p.difficulty === "hard").slice(0, 2);
    const selected = [...easy, ...medium, ...hard];

    if (selected.length > 0) {
      categories.push({
        name: `Live Coding — ${company}`,
        type: "live-coding",
        questions: selected.map((p: any, i: number) => ({
          id: `lc-${p.leetcodeId}`,
          question: `#${p.leetcodeId}. ${p.title}`,
          difficulty: p.difficulty,
          completed: false,
          leetcodeId: p.leetcodeId,
          leetcodeUrl: p.url,
        })),
      });
    }
  }

  // Şirket sorusu yoksa, ilgili skill/topic'lere göre genel sorular çek
  if (companyProblems.length === 0) {
    const skillSet = new Set<string>(
      (job.skills ?? []).map((s: string) => s.toLowerCase()),
    );

    // Skill → LeetCode topic eşleşmesi
    const topicMap: Record<string, string[]> = {
      "array": ["Array"],
      "string": ["String"],
      "dynamic programming": ["Dynamic Programming"],
      "tree": ["Tree", "Binary Tree"],
      "graph": ["Graph"],
      "sql": ["Database"],
      "python": ["Array", "String", "Hash Table"],
      "java": ["Array", "String", "Hash Table"],
      "javascript": ["Array", "String", "Hash Table"],
      "typescript": ["Array", "String", "Hash Table"],
    };

    const matchedTopics = new Set<string>();
    for (const skill of skillSet) {
      const topics = topicMap[skill];
      if (topics) topics.forEach((t) => matchedTopics.add(t));
    }

    // Hiç match yoksa genel popüler sorulardan al
    if (matchedTopics.size === 0) {
      matchedTopics.add("Array");
      matchedTopics.add("String");
      matchedTopics.add("Hash Table");
    }

    const topicProblems = allProblems
      .filter((p: any) =>
        p.relatedTopics.some((t: string) => matchedTopics.has(t)),
      )
      .sort((a: any, b: any) => b.frequency - a.frequency)
      .slice(0, 8);

    if (topicProblems.length > 0) {
      categories.push({
        name: "Live Coding",
        type: "live-coding",
        questions: topicProblems.map((p: any) => ({
          id: `lc-${p.leetcodeId}`,
          question: `#${p.leetcodeId}. ${p.title}`,
          difficulty: p.difficulty,
          completed: false,
          leetcodeId: p.leetcodeId,
          leetcodeUrl: p.url,
        })),
      });
    }
  }

  // ── 3. Phone Screen — Pozisyona özel davranışsal sorular ──
  const phoneQuestions: PathQuestion[] = [];

  if (company) {
    phoneQuestions.push({
      id: "ps-company-1",
      question: `${company} hakkında ne biliyorsunuz ve neden burada çalışmak istiyorsunuz?`,
      difficulty: "easy",
      completed: false,
    });
  }

  phoneQuestions.push({
    id: "ps-role-1",
    question: `${job.title} pozisyonunda başarıyı nasıl tanımlarsınız?`,
    difficulty: "medium",
    completed: false,
  });

  if (
    job.level?.includes("senior") ||
    job.level?.includes("lead") ||
    job.level?.includes("staff")
  ) {
    phoneQuestions.push({
      id: "ps-leadership-1",
      question:
        "Teknik bir karar konusunda ekiptekileri ikna etmeniz gereken bir durumu anlatır mısınız?",
      difficulty: "hard",
      completed: false,
    });
  }

  categories.push({
    name: "Phone Screen",
    type: "phone-screen",
    questions: phoneQuestions,
  });

  // ── 4. System Design — Senior+ roller veya ilanda geçiyorsa ──
  const isDesignRole =
    job.level?.includes("senior") ||
    job.level?.includes("lead") ||
    job.level?.includes("staff") ||
    job.level?.includes("architect") ||
    (job.skills ?? []).some((s: string) =>
      s.toLowerCase().includes("system design"),
    );

  if (isDesignRole) {
    categories.push({
      name: "System Design",
      type: "system-design",
      questions: [
        {
          id: "sd-1",
          question: "URL kısaltma servisi (bit.ly) tasarlayın",
          difficulty: "hard" as const,
          completed: false,
        },
        {
          id: "sd-2",
          question: "Chat uygulaması (WhatsApp) tasarlayın",
          difficulty: "hard" as const,
          completed: false,
        },
      ],
    });
  }

  return categories;
}
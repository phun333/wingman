import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create interview path from a scraped job ───────────

export const createForJob = mutation({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    // Check if path already exists
    const existing = await ctx.db
      .query("explorePaths")
      .withIndex("by_user_job", (q) =>
        q.eq("userId", args.userId).eq("jobId", args.jobId)
      )
      .first();

    if (existing) return existing;

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    const categories = await generateQuestionsForScrapedJob(ctx, job);
    const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);

    const now = Date.now();
    const id = await ctx.db.insert("explorePaths", {
      userId: args.userId,
      jobId: args.jobId,
      title: `${job.company} — ${job.title}`,
      description: `${job.company} ${job.title} pozisyonuna özel hazırlık planı`,
      totalQuestions,
      completedQuestions: 0,
      categories,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

// ─── List user's explore paths ──────────────────────────

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const paths = await ctx.db
      .query("explorePaths")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(
      paths.map(async (path) => {
        const job = await ctx.db.get(path.jobId);
        return { ...path, job: job ?? null };
      })
    );
  },
});

// ─── Get path by ID ─────────────────────────────────────

export const getById = query({
  args: { id: v.id("explorePaths") },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.id);
    if (!path) return null;
    const job = await ctx.db.get(path.jobId);
    return { ...path, job: job ?? null };
  },
});

// ─── Get path for a specific user+job combo ─────────────

export const getByUserJob = query({
  args: {
    userId: v.id("users"),
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("explorePaths")
      .withIndex("by_user_job", (q) =>
        q.eq("userId", args.userId).eq("jobId", args.jobId)
      )
      .first();
  },
});

// ─── Update question progress ───────────────────────────

export const updateQuestionProgress = mutation({
  args: {
    pathId: v.id("explorePaths"),
    categoryIndex: v.number(),
    questionIndex: v.number(),
    completed: v.boolean(),
    interviewId: v.optional(v.id("interviews")),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.pathId);
    if (!path) throw new Error("Path not found");

    const categories = [...path.categories];
    const cat = categories[args.categoryIndex];
    if (!cat) throw new Error("Category not found");
    const q = cat.questions[args.questionIndex];
    if (!q) throw new Error("Question not found");

    q.completed = args.completed;
    if (args.interviewId) q.interviewId = args.interviewId;
    if (args.score !== undefined) q.score = args.score;

    const totalQuestions = categories.reduce((a, c) => a + c.questions.length, 0);
    const completedQuestions = categories.reduce(
      (a, c) => a + c.questions.filter((q) => q.completed).length, 0
    );
    const progress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

    await ctx.db.patch(args.pathId, {
      categories,
      completedQuestions,
      progress,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.pathId);
  },
});

// ─── Delete path ─────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("explorePaths") },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.id);
    if (!path) throw new Error("Path not found");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

// ─── Question Generation ─────────────────────────────────

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

async function generateQuestionsForScrapedJob(
  ctx: any,
  job: any,
): Promise<PathCategory[]> {
  const categories: PathCategory[] = [];
  const company = job.company ?? "";
  const companyLower = company.toLowerCase();
  const seniority = (job.seniorityLevel ?? "").toLowerCase();

  // Map seniority to level string for logic
  const isSenior = seniority.includes("senior") || seniority.includes("lead") || seniority.includes("staff");
  const isEntry = seniority.includes("entry") || seniority.includes("intern") || seniority.includes("no prior");

  // ── 1. Live Coding — Company LeetCode problems ──
  const allProblems = await ctx.db.query("leetcodeProblems").collect();
  const companyProblems = allProblems
    .filter((p: any) =>
      p.companies.some((c: string) => c.toLowerCase() === companyLower),
    )
    .sort((a: any, b: any) => b.frequency - a.frequency);

  if (companyProblems.length > 0) {
    const easy = companyProblems.filter((p: any) => p.difficulty === "easy").slice(0, isEntry ? 3 : 2);
    const medium = companyProblems.filter((p: any) => p.difficulty === "medium").slice(0, isSenior ? 3 : 4);
    const hard = companyProblems.filter((p: any) => p.difficulty === "hard").slice(0, isSenior ? 3 : 1);
    const selected = [...easy, ...medium, ...hard];

    if (selected.length > 0) {
      categories.push({
        name: `Live Coding — ${company}`,
        type: "live-coding",
        questions: selected.map((p: any) => ({
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

  // Fallback: match by skills/topics
  if (companyProblems.length === 0) {
    const skillSet = new Set<string>(
      (job.skills ?? []).map((s: string) => s.toLowerCase()),
    );

    const topicMap: Record<string, string[]> = {
      array: ["Array"], string: ["String"], "dynamic programming": ["Dynamic Programming"],
      tree: ["Tree", "Binary Tree"], graph: ["Graph"], sql: ["Database"],
      python: ["Array", "String", "Hash Table"], java: ["Array", "String", "Hash Table"],
      javascript: ["Array", "String", "Hash Table"], typescript: ["Array", "String", "Hash Table"],
      react: ["Array", "String", "Design"], "c++": ["Array", "Two Pointers", "Binary Search"],
      go: ["Array", "String", "Hash Table"], rust: ["Array", "Two Pointers", "Stack"],
    };

    const matchedTopics = new Set<string>();
    for (const skill of skillSet) {
      const topics = topicMap[skill.toLowerCase()];
      if (topics) topics.forEach((t) => matchedTopics.add(t));
    }
    if (matchedTopics.size === 0) {
      matchedTopics.add("Array");
      matchedTopics.add("String");
      matchedTopics.add("Hash Table");
    }

    const topicProblems = allProblems
      .filter((p: any) => p.relatedTopics.some((t: string) => matchedTopics.has(t)))
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

  // ── 2. Phone Screen ──
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

  if (isSenior) {
    phoneQuestions.push({
      id: "ps-leadership-1",
      question: "Teknik bir karar konusunda ekiptekileri ikna etmeniz gereken bir durumu anlatır mısınız?",
      difficulty: "hard",
      completed: false,
    });
    phoneQuestions.push({
      id: "ps-leadership-2",
      question: "Junior bir geliştiriciyi mentorluk sürecinde nasıl yönlendirdiniz?",
      difficulty: "medium",
      completed: false,
    });
  }

  phoneQuestions.push({
    id: "ps-behavioral-1",
    question: "Zor bir teknik problem ile karşılaştığınız ve çözdüğünüz bir durumu anlatın.",
    difficulty: "medium",
    completed: false,
  });

  categories.push({
    name: "Phone Screen",
    type: "phone-screen",
    questions: phoneQuestions,
  });

  // ── 3. System Design — Senior+ ──
  if (isSenior || (job.skills ?? []).some((s: string) =>
    s.toLowerCase().includes("system design") || s.toLowerCase().includes("architecture")
  )) {
    categories.push({
      name: "System Design",
      type: "system-design",
      questions: [
        { id: "sd-1", question: "URL kısaltma servisi (bit.ly) tasarlayın", difficulty: "hard" as const, completed: false },
        { id: "sd-2", question: "Gerçek zamanlı chat uygulaması tasarlayın", difficulty: "hard" as const, completed: false },
      ],
    });
  }

  return categories;
}

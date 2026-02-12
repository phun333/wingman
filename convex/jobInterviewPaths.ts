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

    // Generate questions based on job requirements and skills
    const questions = await generateQuestionsForJob(job);

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
    const question = categories[args.categoryIndex].questions[args.questionIndex];
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

// ─── Helper: Generate Questions for Job ─────────────────

interface PathQuestion {
  id: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
}

interface PathCategory {
  name: string;
  type: "live-coding" | "system-design" | "phone-screen";
  questions: PathQuestion[];
}

async function generateQuestionsForJob(job: any) {
  const categories: PathCategory[] = [];

  // Phone Screen Questions
  const phoneQuestions: PathQuestion[] = [];

  // Company-specific questions
  if (job.company) {
    phoneQuestions.push({
      id: `ps-company-1`,
      question: `${job.company} hakkında ne biliyorsunuz ve neden burada çalışmak istiyorsunuz?`,
      difficulty: "easy" as const,
      completed: false,
    });
  }

  // Role-specific questions
  phoneQuestions.push({
    id: `ps-role-1`,
    question: `${job.title} pozisyonu için en uygun adayın siz olduğunuzu düşünmenizin nedenleri nelerdir?`,
    difficulty: "medium" as const,
    completed: false,
  });

  // Level-specific questions
  if (job.level?.includes("senior") || job.level?.includes("lead")) {
    phoneQuestions.push({
      id: `ps-level-1`,
      question: "Liderlik ettiğiniz bir projeden ve karşılaştığınız zorluklardan bahseder misiniz?",
      difficulty: "hard" as const,
      completed: false,
    });
  }

  categories.push({
    name: "Phone Screen",
    type: "phone-screen" as const,
    questions: phoneQuestions,
  });

  // Technical/Coding Questions based on skills
  const codingQuestions = [];
  const skillSet = new Set(job.skills?.map((s: string) => s.toLowerCase()) || []);

  // Algorithm questions for technical roles
  if (skillSet.has("algorithms") || skillSet.has("data structures")) {
    codingQuestions.push({
      id: `lc-algo-1`,
      question: "İki sayının toplamı (Two Sum) problemini çözün",
      difficulty: "easy" as const,
      completed: false,
    });
    codingQuestions.push({
      id: `lc-algo-2`,
      question: "Binary tree'nin maksimum derinliğini bulun",
      difficulty: "medium" as const,
      completed: false,
    });
  }

  // Frontend-specific
  if (skillSet.has("react") || skillSet.has("javascript") || skillSet.has("frontend")) {
    codingQuestions.push({
      id: `lc-fe-1`,
      question: "React'te bir todo list komponenti implement edin",
      difficulty: "medium" as const,
      completed: false,
    });
    codingQuestions.push({
      id: `lc-fe-2`,
      question: "Debounce fonksiyonu yazın ve kullanım örneği verin",
      difficulty: "medium" as const,
      completed: false,
    });
  }

  // Backend-specific
  if (skillSet.has("nodejs") || skillSet.has("backend") || skillSet.has("api")) {
    codingQuestions.push({
      id: `lc-be-1`,
      question: "REST API rate limiting middleware'i implement edin",
      difficulty: "medium" as const,
      completed: false,
    });
  }

  // Database-specific
  if (skillSet.has("sql") || skillSet.has("database") || skillSet.has("mongodb")) {
    codingQuestions.push({
      id: `lc-db-1`,
      question: "Veritabanı sorgularını optimize etme stratejilerini açıklayın",
      difficulty: "medium" as const,
      completed: false,
    });
  }

  if (codingQuestions.length > 0) {
    categories.push({
      name: "Live Coding",
      type: "live-coding" as const,
      questions: codingQuestions,
    });
  }

  // System Design Questions for senior roles
  if (job.level?.includes("senior") || job.level?.includes("architect") || skillSet.has("system design")) {
    const designQuestions = [];

    // General system design
    designQuestions.push({
      id: `sd-general-1`,
      question: "URL kısaltma servisi (like bit.ly) tasarlayın",
      difficulty: "hard" as const,
      completed: false,
    });

    // Domain-specific design
    if (job.title?.toLowerCase().includes("frontend")) {
      designQuestions.push({
        id: `sd-fe-1`,
        question: "Real-time collaborative editor (Google Docs gibi) tasarlayın",
        difficulty: "hard" as const,
        completed: false,
      });
    }

    if (job.title?.toLowerCase().includes("backend")) {
      designQuestions.push({
        id: `sd-be-1`,
        question: "Distributed message queue sistemi tasarlayın",
        difficulty: "hard" as const,
        completed: false,
      });
    }

    categories.push({
      name: "System Design",
      type: "system-design" as const,
      questions: designQuestions,
    });
  }

  // Add general technical questions based on requirements
  const requirements = job.requirements || [];
  requirements.forEach((req: string, idx: number) => {
    if (idx < 3) { // Limit to first 3 requirements
      const category = categories.find(c => c.type === "phone-screen");
      if (category) {
        category.questions.push({
          id: `ps-req-${idx}`,
          question: `"${req}" konusundaki deneyimlerinizden bahseder misiniz?`,
          difficulty: "medium" as const,
          completed: false,
        });
      }
    }
  });

  return categories;
}
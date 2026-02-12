import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    authId: v.optional(v.string()), // Better-auth user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_auth_id", ["authId"]),

  interviews: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("live-coding"),
      v.literal("system-design"),
      v.literal("phone-screen"),
      v.literal("practice"),
    ),
    status: v.union(
      v.literal("created"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("evaluated"),
    ),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    language: v.string(),
    questionCount: v.number(),
    config: v.optional(v.any()),
    problemId: v.optional(v.id("problems")),
    designProblemId: v.optional(v.id("designProblems")),
    finalCode: v.optional(v.string()),
    codeLanguage: v.optional(v.string()),
    whiteboardState: v.optional(v.string()),
    jobPostingId: v.optional(v.id("jobPostings")),
    resumeId: v.optional(v.id("resumes")),
    memoryEnabled: v.optional(v.boolean()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  messages: defineTable({
    interviewId: v.id("interviews"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    audioUrl: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_interview_timestamp", ["interviewId", "timestamp"]),

  interviewResults: defineTable({
    interviewId: v.id("interviews"),
    userId: v.id("users"),

    // Genel skor
    overallScore: v.number(), // 0-100
    hireRecommendation: v.union(
      v.literal("strong-hire"),
      v.literal("hire"),
      v.literal("lean-hire"),
      v.literal("no-hire"),
    ),

    // Kategori skorları
    categoryScores: v.object({
      problemSolving: v.number(),
      communication: v.number(),
      codeQuality: v.optional(v.number()),
      systemThinking: v.optional(v.number()),
      analyticalThinking: v.number(),
    }),

    // Kod analizi (Live Coding)
    codeAnalysis: v.optional(
      v.object({
        timeComplexity: v.string(),
        spaceComplexity: v.string(),
        userSolution: v.string(),
        optimalSolution: v.string(),
        optimizationSuggestions: v.array(v.string()),
      }),
    ),

    // Güçlü ve zayıf yönler
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),

    // Genel yorum
    summary: v.string(),
    nextSteps: v.array(v.string()),

    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),

  designProblems: defineTable({
    title: v.string(),
    description: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    requirements: v.object({
      functional: v.array(v.string()),
      nonFunctional: v.array(v.string()),
    }),
    expectedComponents: v.array(v.string()),
    discussionPoints: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_difficulty", ["difficulty"]),

  problems: defineTable({
    title: v.string(),
    description: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    category: v.string(),
    starterCode: v.optional(
      v.object({
        javascript: v.optional(v.string()),
        python: v.optional(v.string()),
        typescript: v.optional(v.string()),
      }),
    ),
    testCases: v.array(
      v.object({
        input: v.string(),
        expectedOutput: v.string(),
        isHidden: v.boolean(),
      }),
    ),
    optimalSolution: v.optional(v.string()),
    timeComplexity: v.optional(v.string()),
    spaceComplexity: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_category", ["category"]),

  // ─── Faz 6: Kişiselleştirme ────────────────────────────

  jobPostings: defineTable({
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    company: v.optional(v.string()),
    requirements: v.array(v.string()),
    skills: v.array(v.string()),
    level: v.optional(v.string()),
    rawContent: v.string(),
    parsedAt: v.number(),
  }).index("by_user", ["userId"]),

  resumes: defineTable({
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
    parsedAt: v.number(),
  }).index("by_user", ["userId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    interests: v.array(v.string()),
    goals: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userMemory: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.string(), // JSON string
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_key", ["userId", "key"]),

  jobInterviewPaths: defineTable({
    userId: v.id("users"),
    jobPostingId: v.id("jobPostings"),
    title: v.string(),
    description: v.string(),
    totalQuestions: v.number(),
    completedQuestions: v.number(),
    categories: v.array(v.object({
      name: v.string(),
      type: v.union(
        v.literal("live-coding"),
        v.literal("system-design"),
        v.literal("phone-screen")
      ),
      questions: v.array(v.object({
        id: v.string(),
        question: v.string(),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        completed: v.boolean(),
        interviewId: v.optional(v.id("interviews")),
        score: v.optional(v.number()),
      })),
    })),
    progress: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_job", ["jobPostingId"])
    .index("by_user_job", ["userId", "jobPostingId"]),
});

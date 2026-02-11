import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

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
    finalCode: v.optional(v.string()),
    codeLanguage: v.optional(v.string()),
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
});

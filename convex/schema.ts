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
      v.literal("abandoned"),
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

  leetcodeProblems: defineTable({
    leetcodeId: v.number(),
    title: v.string(),
    description: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    isPremium: v.boolean(),
    acceptanceRate: v.number(),
    frequency: v.number(),
    url: v.string(),
    solutionLink: v.optional(v.string()),
    discussCount: v.number(),
    accepted: v.string(),
    submissions: v.string(),
    companies: v.array(v.string()),
    relatedTopics: v.array(v.string()),
    likes: v.number(),
    dislikes: v.number(),
    rating: v.number(),
    askedByFaang: v.boolean(),
    similarQuestions: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_leetcode_id", ["leetcodeId"])
    .index("by_rating", ["rating"])
    .index("by_frequency", ["frequency"]),

  // ─── Şirket Bazlı Çalışma Yol Haritaları ──────────────

  companyStudyPaths: defineTable({
    userId: v.id("users"),
    company: v.string(), // "Amazon", "Google", etc.
    title: v.string(), // "Amazon Mülakat Hazırlığı"
    difficulty: v.union(
      v.literal("mixed"),
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    // Topic bazlı gruplandırılmış problemler
    sections: v.array(
      v.object({
        topic: v.string(), // "Array", "Dynamic Programming", etc.
        problems: v.array(
          v.object({
            leetcodeId: v.number(),
            leetcodeProblemId: v.id("leetcodeProblems"),
            title: v.string(),
            difficulty: v.union(
              v.literal("easy"),
              v.literal("medium"),
              v.literal("hard"),
            ),
            url: v.string(),
            completed: v.boolean(),
            interviewId: v.optional(v.id("interviews")),
            score: v.optional(v.number()),
            completedAt: v.optional(v.number()),
          }),
        ),
      }),
    ),
    totalProblems: v.number(),
    completedProblems: v.number(),
    progress: v.number(), // 0-100
    stats: v.object({
      easy: v.object({ total: v.number(), completed: v.number() }),
      medium: v.object({ total: v.number(), completed: v.number() }),
      hard: v.object({ total: v.number(), completed: v.number() }),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["company"])
    .index("by_user_company", ["userId", "company"]),

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

  // ─── hiring.cafe Job Listings (global, scraper ile doldurulur) ─

  jobs: defineTable({
    // Unique ID from hiring.cafe
    externalId: v.string(),

    // Core
    title: v.string(),
    company: v.string(),
    applyUrl: v.string(),
    source: v.string(), // "lever", "greenhouse", "successfactors", etc.

    // Location
    location: v.string(), // formatted workplace location
    workplaceType: v.string(), // "Remote", "Hybrid", "Onsite"
    countries: v.array(v.string()),

    // Job details
    seniorityLevel: v.optional(v.string()),
    commitment: v.array(v.string()), // ["Full Time"]
    category: v.optional(v.string()), // "Software Development", "Marketing"
    roleType: v.optional(v.string()), // "Individual Contributor", "People Manager"
    minYoe: v.optional(v.number()), // minimum years of experience
    skills: v.array(v.string()), // technical_tools
    requirements: v.optional(v.string()), // requirements_summary
    description: v.optional(v.string()), // job description (cleaned/truncated)

    // Compensation
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    salaryCurrency: v.optional(v.string()),
    salaryFrequency: v.optional(v.string()),
    isCompensationTransparent: v.boolean(),

    // Company info
    companyLogo: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companyLinkedin: v.optional(v.string()),
    companyIndustry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    companyTagline: v.optional(v.string()),

    // Metadata
    publishedAt: v.optional(v.number()), // estimated_publish_date_millis
    scrapedAt: v.number(),
    isExpired: v.boolean(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_company", ["company"])
    .index("by_category", ["category"])
    .index("by_workplace_type", ["workplaceType"])
    .index("by_seniority", ["seniorityLevel"])
    .index("by_published", ["publishedAt"])
    .index("by_scraped", ["scrapedAt"])
    .searchIndex("search_jobs", {
      searchField: "title",
      filterFields: ["company", "workplaceType", "seniorityLevel", "category"],
    }),

  // ─── Explore Interview Paths (scraped jobs üzerinden) ───

  explorePaths: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
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
        leetcodeId: v.optional(v.number()),
        leetcodeUrl: v.optional(v.string()),
      })),
    })),
    progress: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_job", ["jobId"])
    .index("by_user_job", ["userId", "jobId"]),

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
    summary: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
    skills: v.array(v.string()),
    categorizedSkills: v.optional(
      v.object({
        programmingLanguages: v.array(v.string()),
        frameworks: v.array(v.string()),
        databases: v.array(v.string()),
        tools: v.array(v.string()),
        cloud: v.array(v.string()),
        methodologies: v.array(v.string()),
        other: v.array(v.string()),
      }),
    ),
    experience: v.array(
      v.object({
        company: v.string(),
        role: v.string(),
        duration: v.string(),
        highlights: v.array(v.string()),
        technologies: v.optional(v.array(v.string())),
      }),
    ),
    education: v.array(
      v.object({
        school: v.string(),
        degree: v.string(),
        year: v.optional(v.string()),
        gpa: v.optional(v.string()),
      }),
    ),
    projects: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          technologies: v.array(v.string()),
          highlights: v.array(v.string()),
        }),
      ),
    ),
    certifications: v.optional(
      v.array(
        v.object({
          name: v.string(),
          issuer: v.string(),
          year: v.optional(v.string()),
        }),
      ),
    ),
    languages: v.optional(v.array(v.string())),
    keyAchievements: v.optional(v.array(v.string())),
    interviewTopics: v.optional(v.array(v.string())),
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
        leetcodeId: v.optional(v.number()),
        leetcodeUrl: v.optional(v.string()),
      })),
    })),
    progress: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_job", ["jobPostingId"])
    .index("by_user_job", ["userId", "jobPostingId"]),

  // ─── CV → LeetCode Öneri Sistemi ───────────────────────

  resumeAnalysis: defineTable({
    userId: v.id("users"),
    resumeId: v.id("resumes"),

    // Deneyim seviyesi (LLM çıkarımı)
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
    ),

    // Topic bazlı beceri seviyeleri (LLM çıkarımı)
    topicProficiency: v.array(
      v.object({
        topic: v.string(), // LeetCode relatedTopics ile eşleşen isim
        level: v.number(), // 0-100
        shouldPractice: v.boolean(),
      }),
    ),

    // Hedef şirketler (CV'den çıkarılan veya kullanıcının belirttiği)
    targetCompanies: v.array(v.string()),

    // Güçlü ve zayıf alanlar
    strongTopics: v.array(v.string()),
    weakTopics: v.array(v.string()),

    // Önerilen zorluk dağılımı (toplamı 100)
    difficultyDistribution: v.object({
      easy: v.number(),
      medium: v.number(),
      hard: v.number(),
    }),

    // LLM'in ürettiği açıklama (debug / UI için)
    reasoning: v.optional(v.string()),

    analyzedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_resume", ["resumeId"]),
});

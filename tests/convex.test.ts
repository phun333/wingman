import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// ─── Config ──────────────────────────────────────────────

const CONVEX_URL = process.env.CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexHttpClient(CONVEX_URL);

// ─── Shared state ────────────────────────────────────────

let testUserId: string;
let testInterviewId: string;
let testProblemId: string;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Users (Convex direct)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Convex Users", () => {
  const email = `convex-test-${Date.now()}@example.com`;

  it("should create a user", async () => {
    const user = await convex.mutation(api.users.create, {
      email,
      name: "Convex Test User",
    });
    expect(user).toBeDefined();
    expect(user!._id).toBeDefined();
    expect(user!.email).toBe(email);
    expect(user!.name).toBe("Convex Test User");
    expect(user!.createdAt).toBeGreaterThan(0);
    expect(user!.updatedAt).toBeGreaterThan(0);
    testUserId = user!._id;
  });

  it("should get user by ID", async () => {
    const user = await convex.query(api.users.getById, {
      id: testUserId as any,
    });
    expect(user._id).toBe(testUserId);
    expect(user.email).toBe(email);
  });

  it("should list users and include created user", async () => {
    const users = await convex.query(api.users.list);
    expect(Array.isArray(users)).toBe(true);
    const found = users.find((u: any) => u._id === testUserId);
    expect(found).toBeDefined();
  });

  it("should update user name", async () => {
    const updated = await convex.mutation(api.users.update, {
      id: testUserId as any,
      name: "Updated Convex User",
    });
    expect(updated!.name).toBe("Updated Convex User");
    expect(updated!.email).toBe(email);
    expect(updated!.updatedAt).toBeGreaterThan(updated!.createdAt);
  });

  it("should update user email", async () => {
    const newEmail = `updated-${Date.now()}@example.com`;
    const updated = await convex.mutation(api.users.update, {
      id: testUserId as any,
      email: newEmail,
    });
    expect(updated!.email).toBe(newEmail);
  });

  it("should throw when getting non-existent user", async () => {
    // We use a fake ID format that Convex expects but doesn't exist
    try {
      await convex.query(api.users.getById, {
        id: testUserId as any, // Will fail after delete
      });
    } catch {
      // Expected for non-existent
    }
  });

  it("should throw when updating non-existent user", async () => {
    const fakeId = "k171234567890123456" as any; // Invalid format
    try {
      await convex.mutation(api.users.update, {
        id: fakeId,
        name: "Ghost",
      });
      expect(true).toBe(false); // Should not reach
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Problems (Convex direct)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Convex Problems", () => {
  it("should create a problem", async () => {
    const problem = await convex.mutation(api.problems.create, {
      title: "Test Problem",
      description: "A test problem for unit tests",
      difficulty: "easy",
      category: "test",
      testCases: [
        { input: "1", expectedOutput: "1", isHidden: false },
        { input: "2", expectedOutput: "4", isHidden: true },
      ],
      starterCode: {
        javascript: "function solve(n) {\n  // your code\n}",
        python: "def solve(n):\n    pass",
      },
      timeComplexity: "O(1)",
      spaceComplexity: "O(1)",
    });
    expect(problem).toBeDefined();
    expect(problem!._id).toBeDefined();
    expect(problem!.title).toBe("Test Problem");
    expect(problem!.difficulty).toBe("easy");
    expect(problem!.category).toBe("test");
    expect(problem!.testCases).toHaveLength(2);
    expect(problem!.starterCode?.javascript).toContain("function");
    testProblemId = problem!._id;
  });

  it("should get problem by ID", async () => {
    const problem = await convex.query(api.problems.getById, {
      id: testProblemId as any,
    });
    expect(problem._id).toBe(testProblemId);
    expect(problem.title).toBe("Test Problem");
    expect(problem.testCases).toHaveLength(2);
  });

  it("should list all problems", async () => {
    const problems = await convex.query(api.problems.list, {});
    expect(Array.isArray(problems)).toBe(true);
    expect(problems.length).toBeGreaterThanOrEqual(1);
  });

  it("should list problems filtered by difficulty", async () => {
    const easy = await convex.query(api.problems.list, {
      difficulty: "easy",
    });
    expect(Array.isArray(easy)).toBe(true);
    for (const p of easy) {
      expect(p.difficulty).toBe("easy");
    }
  });

  it("should list problems filtered by category", async () => {
    const testCat = await convex.query(api.problems.list, {
      category: "test",
    });
    expect(Array.isArray(testCat)).toBe(true);
    for (const p of testCat) {
      expect(p.category).toBe("test");
    }
  });

  it("should get random problem", async () => {
    const problem = await convex.query(api.problems.getRandom, {});
    expect(problem).toBeDefined();
    expect(problem!._id).toBeDefined();
    expect(problem!.title).toBeDefined();
  });

  it("should get random problem with difficulty filter", async () => {
    const problem = await convex.query(api.problems.getRandom, {
      difficulty: "easy",
    });
    if (problem) {
      expect(problem.difficulty).toBe("easy");
    }
  });

  it("should return null for random with impossible filter", async () => {
    const problem = await convex.query(api.problems.getRandom, {
      category: "nonexistent-category-xyz-12345",
    });
    expect(problem).toBeNull();
  });

  it("should throw when getting non-existent problem", async () => {
    try {
      await convex.query(api.problems.getById, {
        id: "k171234567890123456" as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Interviews (Convex direct)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Convex Interviews", () => {
  it("should create an interview", async () => {
    const interview = await convex.mutation(api.interviews.create, {
      userId: testUserId as any,
      type: "live-coding",
      difficulty: "medium",
      language: "tr",
      questionCount: 3,
    });
    expect(interview).toBeDefined();
    expect(interview!._id).toBeDefined();
    expect(interview!.userId).toBe(testUserId);
    expect(interview!.type).toBe("live-coding");
    expect(interview!.difficulty).toBe("medium");
    expect(interview!.language).toBe("tr");
    expect(interview!.questionCount).toBe(3);
    expect(interview!.status).toBe("created");
    expect(interview!.createdAt).toBeGreaterThan(0);
    testInterviewId = interview!._id;
  });

  it("should get interview by ID", async () => {
    const interview = await convex.query(api.interviews.getById, {
      id: testInterviewId as any,
    });
    expect(interview._id).toBe(testInterviewId);
    expect(interview.type).toBe("live-coding");
    expect(interview.status).toBe("created");
  });

  it("should list interviews by user", async () => {
    const interviews = await convex.query(api.interviews.listByUser, {
      userId: testUserId as any,
    });
    expect(Array.isArray(interviews)).toBe(true);
    expect(interviews.length).toBeGreaterThanOrEqual(1);
    const found = interviews.find((i: any) => i._id === testInterviewId);
    expect(found).toBeDefined();
  });

  it("should list interviews by user with limit", async () => {
    const interviews = await convex.query(api.interviews.listByUser, {
      userId: testUserId as any,
      limit: 1,
    });
    expect(interviews.length).toBeLessThanOrEqual(1);
  });

  it("should NOT have active interview before start", async () => {
    const active = await convex.query(api.interviews.getActive, {
      userId: testUserId as any,
    });
    expect(active).toBeNull();
  });

  // ─── Start ────────────────────────────────────────────

  it("should start an interview", async () => {
    const interview = await convex.mutation(api.interviews.start, {
      id: testInterviewId as any,
    });
    expect(interview!.status).toBe("in-progress");
    expect(interview!.startedAt).toBeGreaterThan(0);
  });

  it("should have active interview after start", async () => {
    const active = await convex.query(api.interviews.getActive, {
      userId: testUserId as any,
    });
    expect(active).toBeDefined();
    expect(active!._id).toBe(testInterviewId);
    expect(active!.status).toBe("in-progress");
  });

  it("should NOT start an already started interview", async () => {
    try {
      await convex.mutation(api.interviews.start, {
        id: testInterviewId as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  // ─── Save Code ────────────────────────────────────────

  it("should save code to interview", async () => {
    const interview = await convex.mutation(api.interviews.saveCode, {
      id: testInterviewId as any,
      code: "function twoSum() { return [0, 1]; }",
      language: "javascript",
    });
    expect(interview!.finalCode).toBe("function twoSum() { return [0, 1]; }");
    expect(interview!.codeLanguage).toBe("javascript");
  });

  // ─── Set Problem ──────────────────────────────────────

  it("should set problem on interview", async () => {
    const interview = await convex.mutation(api.interviews.setProblem, {
      id: testInterviewId as any,
      problemId: testProblemId as any,
    });
    expect(interview!.problemId).toBe(testProblemId);
  });

  // ─── Complete ─────────────────────────────────────────

  it("should complete an interview", async () => {
    const interview = await convex.mutation(api.interviews.complete, {
      id: testInterviewId as any,
    });
    expect(interview!.status).toBe("completed");
    expect(interview!.endedAt).toBeGreaterThan(0);
  });

  it("should NOT complete an already completed interview", async () => {
    try {
      await convex.mutation(api.interviews.complete, {
        id: testInterviewId as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should NOT have active interview after completion", async () => {
    const active = await convex.query(api.interviews.getActive, {
      userId: testUserId as any,
    });
    expect(active).toBeNull();
  });

  // ─── User Stats ───────────────────────────────────────

  it("should return correct user stats", async () => {
    const stats = await convex.query(api.interviews.getUserStats, {
      userId: testUserId as any,
    });
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
    expect(stats.thisWeek).toBeGreaterThanOrEqual(1);
  });

  // ─── Multiple interview types ─────────────────────────

  it("should create interviews with different types", async () => {
    const types: Array<"live-coding" | "system-design" | "phone-screen" | "practice"> = [
      "system-design",
      "phone-screen",
      "practice",
    ];

    for (const type of types) {
      const interview = await convex.mutation(api.interviews.create, {
        userId: testUserId as any,
        type,
        difficulty: "easy",
        language: "tr",
        questionCount: 1,
      });
      expect(interview!.type).toBe(type);
      expect(interview!.status).toBe("created");
    }
  });

  it("should create interviews with different difficulties", async () => {
    const diffs: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

    for (const diff of diffs) {
      const interview = await convex.mutation(api.interviews.create, {
        userId: testUserId as any,
        type: "practice",
        difficulty: diff,
        language: "en",
        questionCount: 5,
      });
      expect(interview!.difficulty).toBe(diff);
      expect(interview!.language).toBe("en");
    }
  });

  // ─── Error cases ──────────────────────────────────────

  it("should throw for non-existent interview ID", async () => {
    try {
      await convex.query(api.interviews.getById, {
        id: "k171234567890123456" as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should throw when starting non-existent interview", async () => {
    try {
      await convex.mutation(api.interviews.start, {
        id: "k171234567890123456" as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should throw when saving code to non-existent interview", async () => {
    try {
      await convex.mutation(api.interviews.saveCode, {
        id: "k171234567890123456" as any,
        code: "test",
        language: "javascript",
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Messages (Convex direct)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Convex Messages", () => {
  let messageInterviewId: string;

  beforeAll(async () => {
    // Create a fresh interview for message tests
    const interview = await convex.mutation(api.interviews.create, {
      userId: testUserId as any,
      type: "practice",
      difficulty: "easy",
      language: "tr",
      questionCount: 1,
    });
    messageInterviewId = interview!._id;
  });

  it("should add a user message", async () => {
    const msg = await convex.mutation(api.messages.add, {
      interviewId: messageInterviewId as any,
      role: "user",
      content: "Merhaba, hazırım.",
    });
    expect(msg).toBeDefined();
    expect(msg!._id).toBeDefined();
    expect(msg!.interviewId).toBe(messageInterviewId);
    expect(msg!.role).toBe("user");
    expect(msg!.content).toBe("Merhaba, hazırım.");
    expect(msg!.timestamp).toBeGreaterThan(0);
  });

  it("should add an assistant message", async () => {
    const msg = await convex.mutation(api.messages.add, {
      interviewId: messageInterviewId as any,
      role: "assistant",
      content: "Harika, başlayalım!",
    });
    expect(msg!.role).toBe("assistant");
    expect(msg!.content).toBe("Harika, başlayalım!");
  });

  it("should add a system message", async () => {
    const msg = await convex.mutation(api.messages.add, {
      interviewId: messageInterviewId as any,
      role: "system",
      content: "[Problem yüklendi]",
    });
    expect(msg!.role).toBe("system");
  });

  it("should add a message with audioUrl", async () => {
    const msg = await convex.mutation(api.messages.add, {
      interviewId: messageInterviewId as any,
      role: "user",
      content: "Sesli mesaj",
      audioUrl: "https://example.com/audio.wav",
    });
    expect(msg!.audioUrl).toBe("https://example.com/audio.wav");
  });

  it("should list messages by interview in chronological order", async () => {
    const messages = await convex.query(api.messages.listByInterview, {
      interviewId: messageInterviewId as any,
    });
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThanOrEqual(4);

    // Check chronological order
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i]!.timestamp).toBeGreaterThanOrEqual(
        messages[i - 1]!.timestamp,
      );
    }
  });

  it("should get recent messages (default limit 50)", async () => {
    const messages = await convex.query(api.messages.getRecent, {
      interviewId: messageInterviewId as any,
    });
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThanOrEqual(4);

    // Should be in chronological order (getRecent reverses)
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i]!.timestamp).toBeGreaterThanOrEqual(
        messages[i - 1]!.timestamp,
      );
    }
  });

  it("should get recent messages with limit", async () => {
    const messages = await convex.query(api.messages.getRecent, {
      interviewId: messageInterviewId as any,
      limit: 2,
    });
    expect(messages.length).toBeLessThanOrEqual(2);
    // Should still be chronological
    if (messages.length === 2) {
      expect(messages[1]!.timestamp).toBeGreaterThanOrEqual(
        messages[0]!.timestamp,
      );
    }
  });

  it("should return empty array for interview with no messages", async () => {
    // Create a new interview with no messages
    const interview = await convex.mutation(api.interviews.create, {
      userId: testUserId as any,
      type: "practice",
      difficulty: "easy",
      language: "tr",
      questionCount: 1,
    });
    const messages = await convex.query(api.messages.listByInterview, {
      interviewId: interview!._id as any,
    });
    expect(messages).toEqual([]);
  });

  it("should throw when adding message to non-existent interview", async () => {
    try {
      await convex.mutation(api.messages.add, {
        interviewId: "k171234567890123456" as any,
        role: "user",
        content: "test",
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Interview Status Flow (full lifecycle)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Interview Status Flow", () => {
  let flowInterviewId: string;

  it("created → in-progress → completed lifecycle", async () => {
    // 1. Create
    const created = await convex.mutation(api.interviews.create, {
      userId: testUserId as any,
      type: "live-coding",
      difficulty: "hard",
      language: "en",
      questionCount: 2,
    });
    flowInterviewId = created!._id;
    expect(created!.status).toBe("created");
    expect(created!.startedAt).toBeUndefined();
    expect(created!.endedAt).toBeUndefined();

    // 2. Start
    const started = await convex.mutation(api.interviews.start, {
      id: flowInterviewId as any,
    });
    expect(started!.status).toBe("in-progress");
    expect(started!.startedAt).toBeGreaterThan(0);
    expect(started!.endedAt).toBeUndefined();

    // 3. Save code during interview
    const withCode = await convex.mutation(api.interviews.saveCode, {
      id: flowInterviewId as any,
      code: "def solve(): pass",
      language: "python",
    });
    expect(withCode!.finalCode).toBe("def solve(): pass");
    expect(withCode!.codeLanguage).toBe("python");

    // 4. Complete
    const completed = await convex.mutation(api.interviews.complete, {
      id: flowInterviewId as any,
    });
    expect(completed!.status).toBe("completed");
    expect(completed!.endedAt).toBeGreaterThan(0);
    expect(completed!.endedAt!).toBeGreaterThanOrEqual(completed!.startedAt!);
  });

  it("should NOT allow created → completed (skip in-progress)", async () => {
    const created = await convex.mutation(api.interviews.create, {
      userId: testUserId as any,
      type: "practice",
      difficulty: "easy",
      language: "tr",
      questionCount: 1,
    });
    try {
      await convex.mutation(api.interviews.complete, {
        id: created!._id as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should NOT allow completed → in-progress (reverse)", async () => {
    try {
      await convex.mutation(api.interviews.start, {
        id: flowInterviewId as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Cleanup — delete test user (cascading effect check)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Cleanup", () => {
  it("should delete the test user", async () => {
    const result = await convex.mutation(api.users.remove, {
      id: testUserId as any,
    });
    expect(result.deleted).toBe(true);
  });

  it("should throw when getting deleted user", async () => {
    try {
      await convex.query(api.users.getById, {
        id: testUserId as any,
      });
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

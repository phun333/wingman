import type {
  Interview,
  InterviewStats,
  Message,
  InterviewType,
  Difficulty,
  Problem,
  CodeExecutionResult,
  CodeLanguage,
} from "@ffh/types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Interviews ──────────────────────────────────────────

export async function createInterview(params: {
  type: InterviewType;
  difficulty: Difficulty;
  language?: string;
  questionCount?: number;
}): Promise<Interview> {
  return request<Interview>("/interviews", {
    method: "POST",
    body: JSON.stringify({
      type: params.type,
      difficulty: params.difficulty,
      language: params.language ?? "tr",
      questionCount: params.questionCount ?? 5,
    }),
  });
}

export async function listInterviews(limit?: number): Promise<Interview[]> {
  const q = limit ? `?limit=${limit}` : "";
  return request<Interview[]>(`/interviews${q}`);
}

export async function getInterview(id: string): Promise<Interview> {
  return request<Interview>(`/interviews/${id}`);
}

export async function startInterview(id: string): Promise<Interview> {
  return request<Interview>(`/interviews/${id}/start`, { method: "PATCH" });
}

export async function completeInterview(id: string): Promise<Interview> {
  return request<Interview>(`/interviews/${id}/complete`, { method: "PATCH" });
}

export async function getInterviewMessages(id: string): Promise<Message[]> {
  return request<Message[]>(`/interviews/${id}/messages`);
}

export async function getInterviewStats(): Promise<InterviewStats> {
  return request<InterviewStats>("/interviews/stats");
}

// ─── Problems ────────────────────────────────────────────

export async function listProblems(params?: {
  difficulty?: Difficulty;
  category?: string;
}): Promise<Problem[]> {
  const q = new URLSearchParams();
  if (params?.difficulty) q.set("difficulty", params.difficulty);
  if (params?.category) q.set("category", params.category);
  const qs = q.toString();
  return request<Problem[]>(`/problems${qs ? `?${qs}` : ""}`);
}

export async function getRandomProblem(params?: {
  difficulty?: Difficulty;
  category?: string;
}): Promise<Problem> {
  const q = new URLSearchParams();
  if (params?.difficulty) q.set("difficulty", params.difficulty);
  if (params?.category) q.set("category", params.category);
  const qs = q.toString();
  return request<Problem>(`/problems/random${qs ? `?${qs}` : ""}`);
}

export async function getProblem(id: string): Promise<Problem> {
  return request<Problem>(`/problems/${id}`);
}

// ─── Code Execution ──────────────────────────────────────

export async function executeCode(params: {
  code: string;
  language: CodeLanguage;
  testCases: { input: string; expectedOutput: string }[];
}): Promise<CodeExecutionResult> {
  return request<CodeExecutionResult>("/code/execute", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

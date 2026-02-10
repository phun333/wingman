import type { Interview, InterviewStats, Message, InterviewType, Difficulty } from "@ffh/types";

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

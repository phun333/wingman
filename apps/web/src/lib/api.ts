import type {
  Interview,
  InterviewStats,
  InterviewResult,
  UserProgress,
  Message,
  InterviewType,
  Difficulty,
  Problem,
  CodeExecutionResult,
  CodeLanguage,
  JobPosting,
  Resume,
  UserProfile,
  UserMemoryEntry,
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
  codeLanguage?: string;
  jobPostingId?: string;
  resumeId?: string;
  memoryEnabled?: boolean;
}): Promise<Interview> {
  return request<Interview>("/interviews", {
    method: "POST",
    body: JSON.stringify({
      type: params.type,
      difficulty: params.difficulty,
      language: params.language ?? "tr",
      questionCount: params.questionCount ?? 5,
      codeLanguage: params.codeLanguage,
      jobPostingId: params.jobPostingId,
      resumeId: params.resumeId,
      memoryEnabled: params.memoryEnabled,
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

// ─── Reports ─────────────────────────────────────────────

export async function generateReport(interviewId: string): Promise<{ resultId: string }> {
  return request<{ resultId: string }>("/reports/generate", {
    method: "POST",
    body: JSON.stringify({ interviewId }),
  });
}

export async function getReport(interviewId: string): Promise<InterviewResult> {
  return request<InterviewResult>(`/reports/interview/${interviewId}`);
}

export async function getUserProgress(): Promise<UserProgress> {
  return request<UserProgress>("/reports/progress");
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

// ─── Job Postings ────────────────────────────────────────

export async function parseJobPosting(params: {
  url?: string;
  rawText?: string;
}): Promise<JobPosting> {
  return request<JobPosting>("/jobs/parse", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listJobPostings(): Promise<JobPosting[]> {
  return request<JobPosting[]>("/jobs");
}

export async function deleteJobPosting(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/jobs/${id}`, { method: "DELETE" });
}

// ─── Resumes ─────────────────────────────────────────────

export async function uploadResumeText(params: {
  text: string;
  fileName?: string;
}): Promise<Resume> {
  return request<Resume>("/resume/upload", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function uploadResumeFile(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/resume/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function listResumes(): Promise<Resume[]> {
  return request<Resume[]>("/resume");
}

export async function deleteResume(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/resume/${id}`, { method: "DELETE" });
}

// ─── Profile ─────────────────────────────────────────────

export interface ProfileData {
  userId: string;
  name: string;
  email: string;
  profile: UserProfile | null;
  resumes: Resume[];
  jobPostings: JobPosting[];
  memory: UserMemoryEntry[];
}

export async function getProfile(): Promise<ProfileData> {
  return request<ProfileData>("/profile");
}

export async function updateProfile(params: {
  interests?: string[];
  goals?: string;
  preferredLanguage?: string;
}): Promise<UserProfile> {
  return request<UserProfile>("/profile", {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

// ─── Job Interview Paths ────────────────────────────────

export async function getJobPaths(): Promise<any[]> {
  return request<any[]>("/jobs/paths");
}

export async function getJobPath(pathId: string): Promise<any> {
  return request<any>(`/jobs/paths/${pathId}`);
}

export async function updateQuestionProgress(
  pathId: string,
  categoryIndex: number,
  questionIndex: number,
  data: {
    completed: boolean;
    interviewId?: string;
    score?: number;
  }
): Promise<any> {
  return request<any>(`/jobs/paths/${pathId}/progress`, {
    method: "PUT",
    body: JSON.stringify({
      categoryIndex,
      questionIndex,
      ...data,
    }),
  });
}

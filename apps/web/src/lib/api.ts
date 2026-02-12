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
  LeetcodeProblem,
  LeetcodeListResult,
  CompanyStats,
  TopicStats,
  CompanyProblemsResult,
  CompanyStudyPath,
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

export async function completeInterview(
  id: string,
  data?: { finalCode?: string; codeLanguage?: string },
): Promise<Interview> {
  return request<Interview>(`/interviews/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify(data ?? {}),
  });
}

export async function abandonInterview(
  id: string,
  data?: { finalCode?: string; codeLanguage?: string },
): Promise<Interview> {
  return request<Interview>(`/interviews/${id}/abandon`, {
    method: "PATCH",
    body: JSON.stringify(data ?? {}),
  });
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

export interface DailyActivity {
  activity: { date: string; count: number; level: number }[];
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalSolved: number;
}

export async function getDailyActivity(): Promise<DailyActivity> {
  return request<DailyActivity>("/reports/activity");
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

// ─── LeetCode Problems ───────────────────────────────────

export async function listLeetcodeProblems(params?: {
  difficulty?: Difficulty;
  company?: string;
  topic?: string;
  faang?: boolean;
  limit?: number;
}): Promise<LeetcodeListResult> {
  const q = new URLSearchParams();
  if (params?.difficulty) q.set("difficulty", params.difficulty);
  if (params?.company) q.set("company", params.company);
  if (params?.topic) q.set("topic", params.topic);
  if (params?.faang !== undefined) q.set("faang", String(params.faang));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<LeetcodeListResult>(`/leetcode${qs ? `?${qs}` : ""}`);
}

export async function searchLeetcodeProblems(
  query: string,
  limit?: number,
): Promise<LeetcodeProblem[]> {
  const q = new URLSearchParams({ q: query });
  if (limit) q.set("limit", String(limit));
  return request<LeetcodeProblem[]>(`/leetcode/search?${q}`);
}

export async function getLeetcodeProblem(id: string | number): Promise<LeetcodeProblem> {
  return request<LeetcodeProblem>(`/leetcode/${id}`);
}

export async function getRandomLeetcodeProblem(params?: {
  difficulty?: Difficulty;
  company?: string;
  topic?: string;
}): Promise<LeetcodeProblem> {
  const q = new URLSearchParams();
  if (params?.difficulty) q.set("difficulty", params.difficulty);
  if (params?.company) q.set("company", params.company);
  if (params?.topic) q.set("topic", params.topic);
  const qs = q.toString();
  return request<LeetcodeProblem>(`/leetcode/random${qs ? `?${qs}` : ""}`);
}

export async function listCompanies(): Promise<CompanyStats[]> {
  return request<CompanyStats[]>("/leetcode/companies");
}

export async function getCompanyProblems(
  company: string,
  params?: { difficulty?: Difficulty; topic?: string; sort?: string },
): Promise<CompanyProblemsResult> {
  const q = new URLSearchParams();
  if (params?.difficulty) q.set("difficulty", params.difficulty);
  if (params?.topic) q.set("topic", params.topic);
  if (params?.sort) q.set("sort", params.sort);
  const qs = q.toString();
  return request<CompanyProblemsResult>(
    `/leetcode/companies/${encodeURIComponent(company)}${qs ? `?${qs}` : ""}`,
  );
}

export async function listTopics(): Promise<TopicStats[]> {
  return request<TopicStats[]>("/leetcode/topics");
}

// ─── Company Study Paths ─────────────────────────────────

export async function generateStudyPath(params: {
  userId: string;
  company: string;
  difficulty?: "mixed" | Difficulty;
  maxProblems?: number;
}): Promise<CompanyStudyPath> {
  return request<CompanyStudyPath>("/study-paths", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listStudyPaths(userId: string): Promise<CompanyStudyPath[]> {
  return request<CompanyStudyPath[]>(`/study-paths/user/${userId}`);
}

export async function getStudyPath(id: string): Promise<CompanyStudyPath> {
  return request<CompanyStudyPath>(`/study-paths/${id}`);
}

export async function markStudyPathProblem(
  pathId: string,
  sectionIndex: number,
  problemIndex: number,
  completed: boolean,
  extra?: { interviewId?: string; score?: number },
): Promise<CompanyStudyPath> {
  return request<CompanyStudyPath>(`/study-paths/${pathId}/progress`, {
    method: "PATCH",
    body: JSON.stringify({
      sectionIndex,
      problemIndex,
      completed,
      ...extra,
    }),
  });
}

export async function resetStudyPath(id: string): Promise<CompanyStudyPath> {
  return request<CompanyStudyPath>(`/study-paths/${id}/reset`, {
    method: "POST",
  });
}

export async function deleteStudyPath(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/study-paths/${id}`, { method: "DELETE" });
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

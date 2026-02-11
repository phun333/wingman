// ─── API Response ────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ─── Interview ───────────────────────────────────────────

export type InterviewType =
  | "live-coding"
  | "system-design"
  | "phone-screen"
  | "practice";

export type InterviewStatus =
  | "created"
  | "in-progress"
  | "completed"
  | "evaluated";

export type Difficulty = "easy" | "medium" | "hard";

export interface Interview {
  _id: string;
  userId: string;
  type: InterviewType;
  status: InterviewStatus;
  difficulty: Difficulty;
  language: string;
  questionCount: number;
  config?: unknown;
  jobPostingId?: string;
  resumeId?: string;
  memoryEnabled?: boolean;
  startedAt?: number;
  endedAt?: number;
  createdAt: number;
}

export interface Message {
  _id: string;
  interviewId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  timestamp: number;
}

export interface InterviewStats {
  total: number;
  completed: number;
  thisWeek: number;
}

// ─── Chat / Voice ────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export type VoicePipelineState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking";

// ─── Problem ─────────────────────────────────────────────

export type CodeLanguage = "javascript" | "typescript" | "python";

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  starterCode?: {
    javascript?: string;
    python?: string;
    typescript?: string;
  };
  testCases: TestCase[];
  timeComplexity?: string;
  spaceComplexity?: string;
  createdAt: number;
}

// ─── Interview Result / Report ───────────────────────────

export type HireRecommendation =
  | "strong-hire"
  | "hire"
  | "lean-hire"
  | "no-hire";

export interface CategoryScores {
  problemSolving: number;
  communication: number;
  codeQuality?: number;
  systemThinking?: number;
  analyticalThinking: number;
}

export interface CodeAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  userSolution: string;
  optimalSolution: string;
  optimizationSuggestions: string[];
}

export interface InterviewResult {
  _id: string;
  interviewId: string;
  userId: string;
  overallScore: number;
  hireRecommendation: HireRecommendation;
  categoryScores: CategoryScores;
  codeAnalysis?: CodeAnalysis;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  nextSteps: string[];
  createdAt: number;
}

export interface UserProgress {
  totalEvaluated: number;
  averageScore: number;
  highestScore: number;
  thisMonth: number;
  streak: number;
  topStrengths?: { text: string; count: number }[];
  topWeaknesses?: { text: string; count: number }[];
  results: InterviewResult[];
}

// ─── Code Execution ──────────────────────────────────────

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface CodeExecutionResult {
  results: TestResult[];
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  error?: string;
}

// ─── System Design ───────────────────────────────────────

export interface DesignComponent {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
}

export interface DesignConnection {
  id: string;
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  label?: string;
}

export interface WhiteboardState {
  components: DesignComponent[];
  connections: DesignConnection[];
  textRepresentation: string;
}

export interface DesignProblem {
  _id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  expectedComponents: string[];
  discussionPoints: string[];
  createdAt: number;
}

// ─── Job Posting ─────────────────────────────────────────

export interface JobPosting {
  _id: string;
  userId: string;
  url: string;
  title: string;
  company?: string;
  requirements: string[];
  skills: string[];
  level?: string;
  rawContent: string;
  parsedAt: number;
}

// ─── Resume ──────────────────────────────────────────────

export interface ResumeExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
}

export interface Resume {
  _id: string;
  userId: string;
  fileName: string;
  name?: string;
  title?: string;
  yearsOfExperience?: number;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  rawText: string;
  parsedAt: number;
}

// ─── User Profile ────────────────────────────────────────

export interface UserProfile {
  _id: string;
  userId: string;
  interests: string[];
  goals?: string;
  preferredLanguage?: string;
  updatedAt: number;
}

// ─── User Memory ─────────────────────────────────────────

export interface UserMemoryEntry {
  _id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: number;
}

// ─── WebSocket Protocol ──────────────────────────────────

/** Client → Server */
export type ClientMessage =
  | { type: "audio_chunk"; data: string }
  | { type: "start_listening" }
  | { type: "stop_listening" }
  | { type: "interrupt" }
  | { type: "config"; language?: string; speed?: number }
  | { type: "code_update"; code: string; language: CodeLanguage }
  | { type: "code_result"; results: TestResult[]; stdout: string; stderr: string; error?: string }
  | { type: "hint_request" }
  | { type: "whiteboard_update"; state: WhiteboardState };

/** Server → Client */
export type ServerMessage =
  | { type: "transcript"; text: string; final: boolean }
  | { type: "ai_text"; text: string; done: boolean }
  | { type: "ai_audio"; data: string }
  | { type: "ai_audio_done" }
  | { type: "state_change"; state: VoicePipelineState }
  | { type: "error"; message: string }
  | { type: "problem_loaded"; problem: Problem }
  | { type: "design_problem_loaded"; problem: DesignProblem }
  | { type: "hint_given"; level: number; totalHints: number }
  | { type: "question_update"; current: number; total: number; questionStartTime: number; recommendedSeconds: number }
  | { type: "time_warning"; minutesLeft: number }
  | { type: "solution_comparison"; userSolution: string; optimalSolution: string; timeComplexity?: string; spaceComplexity?: string };

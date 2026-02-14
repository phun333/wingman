import type { InterviewType, Difficulty } from "@ffh/types";
import { liveCodingPrompt } from "./live-coding";
import { systemDesignPrompt } from "./system-design";
import { phoneScreenPromptEnhanced } from "./phone-screen-enhanced";
import { practicePrompt } from "./practice";

const promptMap: Record<InterviewType, (difficulty: Difficulty, language: string) => string> = {
  "live-coding": liveCodingPrompt,
  "system-design": systemDesignPrompt,
  "phone-screen": phoneScreenPromptEnhanced, // Enhanced voice-optimized version
  practice: practicePrompt,
};

export function getSystemPrompt(
  type: InterviewType,
  difficulty: Difficulty,
  language: string,
): string {
  const fn = promptMap[type];
  return fn(difficulty, language);
}

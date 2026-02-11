import { describe, it, expect } from "bun:test";
import { getSystemPrompt } from "../apps/api/src/prompts";
import type { InterviewType, Difficulty } from "@ffh/types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Prompt Generation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const interviewTypes: InterviewType[] = [
  "live-coding",
  "system-design",
  "phone-screen",
  "practice",
];

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

describe("getSystemPrompt", () => {
  // ─── All combinations produce non-empty string ─────────

  for (const type of interviewTypes) {
    for (const diff of difficulties) {
      it(`should produce prompt for type="${type}", difficulty="${diff}", lang="tr"`, () => {
        const prompt = getSystemPrompt(type, diff, "tr");
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(100);
      });
    }
  }

  // ─── Language instruction ──────────────────────────────

  it('should include Turkish instruction when language is "tr"', () => {
    const prompt = getSystemPrompt("live-coding", "easy", "tr");
    expect(prompt).toContain("Türkçe");
  });

  it('should include English instruction when language is "en"', () => {
    const prompt = getSystemPrompt("live-coding", "easy", "en");
    expect(prompt).toContain("English");
  });

  // ─── Difficulty-specific content ───────────────────────

  describe("live-coding", () => {
    it("easy prompt should mention ipucu/yönlendirici/teşvik", () => {
      const prompt = getSystemPrompt("live-coding", "easy", "tr");
      expect(prompt).toContain("ipucu");
    });

    it("hard prompt should mention optimal/zaman/karmaşıklık", () => {
      const prompt = getSystemPrompt("live-coding", "hard", "tr");
      expect(prompt).toContain("karmaşıklığ");
    });

    it("should mention code analysis instructions", () => {
      const prompt = getSystemPrompt("live-coding", "medium", "tr");
      expect(prompt).toContain("Kod Çalıştırma Sonucu");
      expect(prompt).toContain("Adayın şu anki kodu");
    });
  });

  describe("system-design", () => {
    it("should mention architecture concepts", () => {
      const prompt = getSystemPrompt("system-design", "medium", "tr");
      expect(prompt).toContain("tasarım");
    });

    it("hard prompt should mention scalability/consistency", () => {
      const prompt = getSystemPrompt("system-design", "hard", "tr");
      expect(prompt).toContain("Scalability");
    });

    it("easy prompt should mention simple systems", () => {
      const prompt = getSystemPrompt("system-design", "easy", "tr");
      expect(prompt).toContain("Basit");
    });
  });

  describe("phone-screen", () => {
    it("should mention behavioral and technical questions", () => {
      const prompt = getSystemPrompt("phone-screen", "medium", "tr");
      expect(prompt).toContain("davranışsal");
      expect(prompt).toContain("teknik");
    });

    it("should mention STAR method for medium+", () => {
      const prompt = getSystemPrompt("phone-screen", "medium", "tr");
      expect(prompt).toContain("STAR");
    });
  });

  describe("practice", () => {
    it("should have supportive/encouraging tone", () => {
      const prompt = getSystemPrompt("practice", "easy", "tr");
      expect(prompt).toContain("mentor");
    });

    it("should mention no pressure environment", () => {
      const prompt = getSystemPrompt("practice", "easy", "tr");
      expect(prompt).toContain("Baskı yok");
    });

    it("hard prompt should mention optimal", () => {
      const prompt = getSystemPrompt("practice", "hard", "tr");
      expect(prompt).toContain("Optimal");
    });
  });

  // ─── All prompts have length constraints ───────────────

  it("all prompts mention short responses (kısa ve öz)", () => {
    for (const type of interviewTypes) {
      const prompt = getSystemPrompt(type, "medium", "tr");
      expect(prompt).toContain("Kısa ve öz");
    }
  });
});

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/Badge";
import { Clock, HardDrive, Lightbulb } from "lucide-react";
import type { Problem } from "@ffh/types";

interface ProblemPanelProps {
  problem: Problem | null;
  loading?: boolean;
}

const difficultyConfig = {
  easy: { label: "Kolay", variant: "success" as const },
  medium: { label: "Orta", variant: "amber" as const },
  hard: { label: "Zor", variant: "danger" as const },
};

export function ProblemPanel({ problem, loading }: ProblemPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">Problem yükleniyor…</p>
      </div>
    );
  }

  const diff = difficultyConfig[problem.difficulty];
  const visibleTests = problem.testCases.filter((tc) => !tc.isHidden);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-display text-lg font-bold text-text">
            {problem.title}
          </h2>
          <Badge variant={diff.variant}>{diff.label}</Badge>
          <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-raised border border-border">
            {problem.category}
          </span>
        </div>
      </div>

      {/* Description (Markdown) */}
      <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed
        [&_h1]:text-text [&_h2]:text-text [&_h3]:text-text
        [&_strong]:text-text [&_a]:text-amber
        [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-amber [&_code]:text-xs [&_code]:font-mono
        [&_pre]:bg-surface-raised [&_pre]:border [&_pre]:border-border-subtle [&_pre]:rounded-lg [&_pre]:p-3
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text-secondary
      ">
        <Markdown remarkPlugins={[remarkGfm]}>{problem.description}</Markdown>
      </div>

      {/* Test Cases */}
      {visibleTests.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
            Örnekler
          </h3>
          <div className="space-y-2">
            {visibleTests.map((tc, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-surface-raised p-3 text-sm font-mono"
              >
                <div className="mb-1">
                  <span className="text-text-muted text-xs">Girdi: </span>
                  <span className="text-text">{tc.input}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Çıktı: </span>
                  <span className="text-success">{tc.expectedOutput}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complexity hints */}
      {(problem.timeComplexity || problem.spaceComplexity) && (
        <div className="border-t border-border-subtle pt-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
            Beklenen Karmaşıklık
          </h3>
          <div className="flex gap-4 text-xs">
            {problem.timeComplexity && (
              <span className="text-text-secondary flex items-center gap-1">
                <Clock size={11} />
                Zaman: <span className="text-text font-mono">{problem.timeComplexity}</span>
              </span>
            )}
            {problem.spaceComplexity && (
              <span className="text-text-secondary flex items-center gap-1">
                <HardDrive size={11} />
                Alan: <span className="text-text font-mono">{problem.spaceComplexity}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

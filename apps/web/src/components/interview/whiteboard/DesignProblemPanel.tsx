import { Building2, Lightbulb } from "lucide-react";
import type { DesignProblem } from "@ffh/types";

interface DesignProblemPanelProps {
  problem: DesignProblem | null;
  loading: boolean;
}

export function DesignProblemPanel({ problem, loading }: DesignProblemPanelProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-text-muted">Soru yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Building2 size={36} className="text-text-muted mx-auto" strokeWidth={1.2} />
          <p className="mt-3 text-sm text-text-muted">
            AI mülakatçı size bir sistem tasarımı sorusu soracak.
          </p>
          <p className="mt-1 text-xs text-text-muted/60">
            Sağdaki whiteboard'u kullanarak tasarımınızı çizin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border-subtle px-5 py-4 z-10">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-amber" strokeWidth={1.8} />
          <h2 className="font-display font-bold text-text text-base">
            {problem.title}
          </h2>
        </div>
        <span
          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md ${
            problem.difficulty === "easy"
              ? "bg-success/10 text-success border border-success/20"
              : problem.difficulty === "medium"
                ? "bg-amber/10 text-amber border border-amber/20"
                : "bg-danger/10 text-danger border border-danger/20"
          }`}
        >
          {problem.difficulty === "easy"
            ? "Kolay"
            : problem.difficulty === "medium"
              ? "Orta"
              : "Zor"}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Description */}
        <div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {problem.description}
          </p>
        </div>

        {/* Functional Requirements */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Fonksiyonel Gereksinimler
          </h3>
          <ul className="space-y-1.5">
            {problem.requirements.functional.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-success mt-0.5 shrink-0">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Non-Functional Requirements */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Non-Fonksiyonel Gereksinimler
          </h3>
          <ul className="space-y-1.5">
            {problem.requirements.nonFunctional.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-amber mt-0.5 shrink-0">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hint: Discussion Points (collapsed by default) */}
        <details className="group">
          <summary className="text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors select-none flex items-center gap-1.5">
            <Lightbulb size={12} />
            Tartışma Noktaları
            <span className="ml-1 text-text-muted/50 group-open:hidden">(göster)</span>
          </summary>
          <ul className="mt-2 space-y-1.5">
            {problem.discussionPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="text-info mt-0.5 shrink-0">?</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

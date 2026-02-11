import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { diffLines, type Change } from "diff";
import { PartyPopper, X, Lightbulb, User, Sparkles } from "lucide-react";

interface SolutionComparisonPanelProps {
  userSolution: string;
  optimalSolution: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  onDismiss: () => void;
}

type ViewMode = "side-by-side" | "diff";

export function SolutionComparisonPanel({
  userSolution,
  optimalSolution,
  timeComplexity,
  spaceComplexity,
  onDismiss,
}: SolutionComparisonPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("diff");

  // Compute diff
  const changes = useMemo(() => {
    return diffLines(userSolution || "", optimalSolution || "");
  }, [userSolution, optimalSolution]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <PartyPopper size={20} className="text-amber" />
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                Tüm Testler Geçti!
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Çözümünü optimal çözümle karşılaştır
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("diff")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "diff"
                    ? "bg-amber/15 text-amber border-r border-border"
                    : "text-text-muted hover:text-text hover:bg-surface-raised border-r border-border"
                }`}
              >
                Diff Görünümü
              </button>
              <button
                onClick={() => setViewMode("side-by-side")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "side-by-side"
                    ? "bg-amber/15 text-amber"
                    : "text-text-muted hover:text-text hover:bg-surface-raised"
                }`}
              >
                Yan Yana
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Kapat <X size={14} />
            </Button>
          </div>
        </div>

        {/* Complexity badges */}
        {(timeComplexity || spaceComplexity) && (
          <div className="flex items-center gap-4 px-6 py-3 bg-surface-raised/50 border-b border-border-subtle">
            {timeComplexity && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Optimal Zaman:</span>
                <span className="text-sm font-mono font-semibold text-success">
                  {timeComplexity}
                </span>
              </div>
            )}
            {spaceComplexity && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Optimal Alan:</span>
                <span className="text-sm font-mono font-semibold text-success">
                  {spaceComplexity}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "diff" ? (
            <DiffView changes={changes} />
          ) : (
            <SideBySideView
              userSolution={userSolution}
              optimalSolution={optimalSolution}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <Lightbulb size={12} />
            AI mülakatçı farkları sesli olarak açıklayacak
          </p>
          <Button size="sm" onClick={onDismiss}>
            Devam Et
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Diff View ──────────────────────────────────────────

function DiffView({ changes }: { changes: Change[] }) {
  let lineNum = 0;

  return (
    <div className="h-full overflow-auto">
      <div className="px-2 py-2">
        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-danger/20 border border-danger/30" />
            <span className="text-[10px] text-text-muted">Senin kodun (kaldırılan)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-success/20 border border-success/30" />
            <span className="text-[10px] text-text-muted">Optimal çözüm (eklenen)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-surface-raised border border-border" />
            <span className="text-[10px] text-text-muted">Ortak</span>
          </div>
        </div>

        <div className="font-mono text-xs leading-relaxed">
          {changes.map((change, idx) => {
            const lines = change.value.split("\n");
            // Remove trailing empty line from split
            if (lines[lines.length - 1] === "") lines.pop();

            return lines.map((line, lineIdx) => {
              lineNum++;
              const bgColor = change.added
                ? "bg-success/8"
                : change.removed
                  ? "bg-danger/8"
                  : "";
              const textColor = change.added
                ? "text-success"
                : change.removed
                  ? "text-danger"
                  : "text-text-secondary";
              const prefix = change.added ? "+" : change.removed ? "-" : " ";
              const prefixColor = change.added
                ? "text-success"
                : change.removed
                  ? "text-danger"
                  : "text-text-muted/40";
              const borderColor = change.added
                ? "border-l-success/40"
                : change.removed
                  ? "border-l-danger/40"
                  : "border-l-transparent";

              return (
                <div
                  key={`${idx}-${lineIdx}`}
                  className={`flex ${bgColor} border-l-2 ${borderColor} hover:bg-surface-raised/50 transition-colors`}
                >
                  <span className="w-10 shrink-0 text-right pr-2 text-text-muted/30 select-none">
                    {lineNum}
                  </span>
                  <span className={`w-5 shrink-0 text-center select-none ${prefixColor}`}>
                    {prefix}
                  </span>
                  <span className={`flex-1 ${textColor} whitespace-pre`}>
                    {line || " "}
                  </span>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Side-by-Side View ──────────────────────────────────

function SideBySideView({
  userSolution,
  optimalSolution,
}: {
  userSolution: string;
  optimalSolution: string;
}) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-x divide-border-subtle overflow-hidden">
      {/* User solution */}
      <div className="flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-raised/50 border-b border-border-subtle">
          <h3 className="text-sm font-medium text-amber flex items-center gap-2">
            <User size={14} /> Senin Çözümün
          </h3>
        </div>
        <div className="flex-1 overflow-auto">
          <pre className="p-4 text-xs font-mono text-text-secondary leading-relaxed whitespace-pre">
            {userSolution || "(Kod bulunamadı)"}
          </pre>
        </div>
      </div>

      {/* Optimal solution */}
      <div className="flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-raised/50 border-b border-border-subtle">
          <h3 className="text-sm font-medium text-success flex items-center gap-2">
            <Sparkles size={14} /> Optimal Çözüm
          </h3>
        </div>
        <div className="flex-1 overflow-auto">
          <pre className="p-4 text-xs font-mono text-text-secondary leading-relaxed whitespace-pre">
            {optimalSolution}
          </pre>
        </div>
      </div>
    </div>
  );
}

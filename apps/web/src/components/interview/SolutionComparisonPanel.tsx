import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";

interface SolutionComparisonPanelProps {
  userSolution: string;
  optimalSolution: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  onDismiss: () => void;
}

export function SolutionComparisonPanel({
  userSolution,
  optimalSolution,
  timeComplexity,
  spaceComplexity,
  onDismiss,
}: SolutionComparisonPanelProps) {
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
            <span className="text-xl">🎉</span>
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                Tüm Testler Geçti!
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Çözümünü optimal çözümle karşılaştır
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Kapat ✕
          </Button>
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

        {/* Side by side code */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-x divide-border-subtle">
          {/* User solution */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-raised/50 border-b border-border-subtle">
              <h3 className="text-sm font-medium text-amber flex items-center gap-2">
                <span>👤</span> Senin Çözümün
              </h3>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap">
              {userSolution || "(Kod bulunamadı)"}
            </pre>
          </div>

          {/* Optimal solution */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-raised/50 border-b border-border-subtle">
              <h3 className="text-sm font-medium text-success flex items-center gap-2">
                <span>✨</span> Optimal Çözüm
              </h3>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap">
              {optimalSolution}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-muted">
            💡 AI mülakatçı farkları sesli olarak açıklayacak
          </p>
          <Button size="sm" onClick={onDismiss}>
            Devam Et
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from "motion/react";
import { Play, CheckCircle2, XCircle, Clock, AlertTriangle, Terminal } from "lucide-react";
import type { CodeExecutionResult } from "@ffh/types";

interface TestResultsPanelProps {
  result: CodeExecutionResult | null;
  running: boolean;
  onRun: () => void;
}

export function TestResultsPanel({ result, running, onRun }: TestResultsPanelProps) {
  const passed = result?.results.filter((r) => r.passed).length ?? 0;
  const total = result?.results.length ?? 0;
  const allPassed = result && passed === total && total > 0;

  return (
    <div className="flex flex-col h-full border-t border-border-subtle bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Test Sonuçları
          </span>
          {result && (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                allPassed
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {passed}/{total}
            </span>
          )}
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className={`
            inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium
            transition-colors duration-150 cursor-pointer
            ${
              running
                ? "bg-surface-raised text-text-muted"
                : "bg-success/10 text-success border border-success/20 hover:bg-success/20"
            }
          `}
        >
          {running ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Çalışıyor…
            </>
          ) : (
            <>
              <Play size={12} strokeWidth={2.5} />
              Çalıştır
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="wait">
          {!result && !running && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <p className="text-xs text-text-muted">
                Kodu çalıştırmak için butona tıklayın
              </p>
            </motion.div>
          )}

          {running && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
            </motion.div>
          )}

          {result && !running && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Test cases */}
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 text-xs font-mono ${
                    r.passed
                      ? "border-success/20 bg-success/5"
                      : "border-danger/20 bg-danger/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {r.passed ? (
                      <CheckCircle2 size={14} className="text-success" />
                    ) : (
                      <XCircle size={14} className="text-danger" />
                    )}
                    <span className="text-text font-sans font-medium">
                      Test {i + 1}
                    </span>
                  </div>
                  <div className="pl-6 space-y-0.5">
                    <p className="text-text-muted">
                      Girdi: <span className="text-text-secondary">{r.input}</span>
                    </p>
                    <p className="text-text-muted">
                      Beklenen: <span className="text-success">{r.expected}</span>
                    </p>
                    {!r.passed && (
                      <p className="text-text-muted">
                        Gerçek: <span className="text-danger">{r.actual}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Execution info */}
              <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {result.executionTimeMs}ms
                </span>
                {result.error && (
                  <span className="flex items-center gap-1 text-danger">
                    <AlertTriangle size={11} />
                    {result.error}
                  </span>
                )}
              </div>

              {/* Console output */}
              {(result.stdout || result.stderr) && (
                <div className="rounded-lg border border-border-subtle bg-surface-raised p-2.5">
                  <p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Terminal size={11} />
                    Konsol Çıktısı
                  </p>
                  {result.stdout && (
                    <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
                      {result.stdout}
                    </pre>
                  )}
                  {result.stderr && (
                    <pre className="text-xs text-danger font-mono whitespace-pre-wrap">
                      {result.stderr}
                    </pre>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/lib/useVoice";
import { getInterview, completeInterview, abandonInterview, executeCode as executeCodeApi, getRandomProblem, getProblem, startInterview, getLeetcodeProblem } from "@/lib/api";
import { typeLabels } from "@/lib/constants";
import { Mic, Hand, Coffee, Clock, AlertTriangle, CheckCircle2, X } from "lucide-react";
import type {
  VoicePipelineState,
  Interview,
  Problem,
  CodeLanguage,
  CodeExecutionResult,
} from "@ffh/types";
import { ProblemPanel } from "@/components/interview/ProblemPanel";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { TestResultsPanel } from "@/components/interview/TestResultsPanel";
import { ResizableSplitter } from "@/components/interview/ResizableSplitter";
import { SolutionComparisonPanel } from "@/components/interview/SolutionComparisonPanel";
import { SystemDesignRoom } from "@/components/interview/SystemDesignRoom";
import { AIChat } from "@/components/interview/AIChat";

const stateLabels: Record<VoicePipelineState, string> = {
  idle: "Hazır",
  listening: "Dinliyor…",
  processing: "Düşünüyor…",
  speaking: "Konuşuyor…",
};

const languageLabels: Record<CodeLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

export function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live Coding state
  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("javascript");
  const [code, setCode] = useState("");
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Debounced code update ref
  const codeUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSystemDesign = interview?.type === "system-design";
  const isLiveCoding = interview?.type === "live-coding";
  const isPractice = interview?.type === "practice";
  const showCodeEditor = isLiveCoding || isPractice;

  // Load interview data
  useEffect(() => {
    if (!id) return;
    getInterview(id)
      .then((iv) => {
        setInterview(iv);
        if (iv.type === "live-coding" || iv.type === "practice") {
          // Only set loading if we don't have a problem yet
          setProblem((currentProblem) => {
            if (!currentProblem) {
              setProblemLoading(true);
            }
            return currentProblem;
          });
          // Set code language from interview if available
          if (iv.language) {
            setCodeLanguage(iv.language as CodeLanguage);
          }
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Mülakat bulunamadı");
      });
  }, [id]);

  // Handle problem loaded from WebSocket or fetch fallback
  const handleProblemLoaded = useCallback(
    (p: Problem) => {
      const requestedProblemId = searchParams.get("problemId");
      console.log("handleProblemLoaded called with:", p.title);
      console.log("Requested problem ID:", requestedProblemId);
      console.log("Loaded problem ID:", p._id);

      // If a specific problem was requested but we got a different one from WebSocket,
      // we should override it with the correct one
      if (requestedProblemId && p._id !== requestedProblemId) {
        console.log("WebSocket loaded wrong problem, will override with correct one");
        // Don't set the problem yet, let the timeout handler load the correct one
        return;
      }

      setProblem(p);
      setProblemLoading(false);
    },
    [searchParams],
  );

  // Update code when problem or language changes
  useEffect(() => {
    if (problem && codeLanguage) {
      const starter = problem.starterCode?.[codeLanguage] ?? "";
      console.log("Updating starter code for", codeLanguage, ":", starter);
      setCode(starter);
    }
  }, [problem, codeLanguage]);

  const {
    state,
    micActive,
    volume,
    transcript,
    aiText,
    error,
    connected,
    hintLevel,
    totalHints,
    questionCurrent,
    questionTotal,
    questionStartTime,
    recommendedSeconds,
    timeWarning,
    solutionComparison,
    toggleMic,
    interrupt,
    sendCodeUpdate,
    sendCodeResult,
    requestHint,
    dismissSolution,
  } = useVoice({
    interviewId: id,
    problemId: searchParams.get("problemId") || undefined,
    onProblemLoaded: handleProblemLoaded
  });

  // Fallback: if problem not loaded via WS after 5 seconds, fetch from API
  useEffect(() => {
    if (!showCodeEditor || problem) return;

    // Check if specific problem ID is requested via URL params
    const requestedProblemId = searchParams.get("problemId");

    const timeout = setTimeout(async () => {
      if (!problem && interview) {
        try {
          console.log("Interview room loading problem. Problem ID from URL:", requestedProblemId);
          let p: Problem;

          if (requestedProblemId) {
            // Load specific problem — try leetcodeProblems first, then legacy problems
            console.log("Loading specific problem with ID:", requestedProblemId);
            try {
              const lc = await getLeetcodeProblem(requestedProblemId);
              // Adapt LeetcodeProblem → Problem shape
              p = {
                _id: lc._id,
                title: lc.title,
                description: lc.description,
                difficulty: lc.difficulty,
                category: lc.relatedTopics[0] ?? "general",
                testCases: [],
                createdAt: lc.createdAt,
              };
            } catch {
              // Fallback to legacy problems table
              p = await getProblem(requestedProblemId);
            }
            console.log("Loaded specific problem:", p.title);
          } else {
            // Load random problem
            console.log("Loading random problem with difficulty:", interview.difficulty);
            p = await getRandomProblem({ difficulty: interview.difficulty });
            console.log("Loaded random problem:", p.title);
          }

          handleProblemLoaded(p);
        } catch (err) {
          console.error("Problem loading failed:", err);
          setProblemLoading(false);
        }
      }
    }, requestedProblemId ? 1000 : 5000); // Faster loading for specific problems

    return () => clearTimeout(timeout);
  }, [showCodeEditor, problem, interview, handleProblemLoaded, searchParams]);

  // Debug: Log problem state changes
  useEffect(() => {
    console.log("Problem state updated:", problem);
    console.log("ProblemLoading state:", problemLoading);
  }, [problem, problemLoading]);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // ─── Code change (debounced WS update) ───────────────

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      if (codeUpdateTimer.current) clearTimeout(codeUpdateTimer.current);
      codeUpdateTimer.current = setTimeout(() => {
        sendCodeUpdate(newCode, codeLanguage);
      }, 3000);
    },
    [codeLanguage, sendCodeUpdate],
  );

  // ─── Language change ─────────────────────────────────

  const handleLanguageChange = useCallback(
    (lang: CodeLanguage) => {
      setCodeLanguage(lang);
      if (problem?.starterCode?.[lang]) {
        setCode(problem.starterCode[lang]!);
      }
      setExecutionResult(null);
    },
    [problem],
  );

  // ─── Execute code ────────────────────────────────────

  const handleRunCode = useCallback(async () => {
    if (!problem || executing) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      const testCases = problem.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));

      const result = await executeCodeApi({
        code,
        language: codeLanguage,
        testCases,
      });

      setExecutionResult(result);
      sendCodeResult(result.results, result.stdout, result.stderr, result.error);
    } catch (err) {
      setExecutionResult({
        results: [],
        stdout: "",
        stderr: err instanceof Error ? err.message : "Execution failed",
        executionTimeMs: 0,
        error: "Bağlantı hatası",
      });
    } finally {
      setExecuting(false);
    }
  }, [problem, code, codeLanguage, executing, sendCodeResult]);

  // ─── End interview ───────────────────────────────────

  const handleComplete = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowEndModal(false);
    if (id) {
      try {
        await completeInterview(id, {
          finalCode: code || undefined,
          codeLanguage: code ? codeLanguage : undefined,
        });
      } catch {
        // Interview may already be completed
      }
      navigate(`/interview/${id}/report`);
    } else {
      navigate("/");
    }
  }, [id, navigate, code, codeLanguage]);

  const handleAbandon = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowEndModal(false);
    if (id) {
      try {
        await abandonInterview(id, {
          finalCode: code || undefined,
          codeLanguage: code ? codeLanguage : undefined,
        });
      } catch {
        // Interview may already be in a terminal state
      }
      navigate(`/interview/${id}/report`);
    } else {
      navigate("/");
    }
  }, [id, navigate, code, codeLanguage]);

  // ─── Start interview ─────────────────────────────────

  const handleStartInterview = useCallback(async () => {
    if (!id || !interview) return;
    try {
      const updatedInterview = await startInterview(id);
      setInterview(updatedInterview);
    } catch (err) {
      console.error("Failed to start interview:", err);
    }
  }, [id, interview]);

  // ─── Mic click ───────────────────────────────────────

  function handleMicClick() {
    if (state === "speaking" || state === "processing") {
      interrupt();
      return;
    }
    toggleMic();
  }

  // ─── Loading / Error ─────────────────────────────────

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-danger text-lg font-medium">{loadError}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            Dashboard'a Dön
          </Button>
        </div>
      </div>
    );
  }

  // ─── System Design mode ─────────────────────────────

  if (isSystemDesign && id) {
    return <SystemDesignRoom interviewId={id} />;
  }

  // ─── Voice-only mode (non-code interviews) ───────────

  if (!showCodeEditor) {
    return (
      <>
        <VoiceOnlyRoom
          interview={interview}
          state={state}
          micActive={micActive}
          volume={volume}
          transcript={transcript}
          aiText={aiText}
          error={error}
          connected={connected}
          elapsed={elapsed}
          formatTime={formatTime}
          onMicClick={handleMicClick}
          onEnd={() => setShowEndModal(true)}
          questionCurrent={questionCurrent}
          questionTotal={questionTotal}
          questionStartTime={questionStartTime}
          recommendedSeconds={recommendedSeconds}
          timeWarning={timeWarning}
          onStartInterview={handleStartInterview}
        />
        <EndInterviewModal
          open={showEndModal}
          onClose={() => setShowEndModal(false)}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
          hasCode={false}
          allTestsPassed={false}
        />
      </>
    );
  }

  // ─── Live Coding layout ──────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-surface/80 backdrop-blur-sm px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-amber/15 flex items-center justify-center">
            <span className="text-amber font-display text-xs font-bold">W</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            {interview ? typeLabels[interview.type] ?? interview.type : "Mülakat"}
          </span>
          {interview && (
            <span className="text-xs text-text-muted px-2 py-0.5 rounded-md bg-surface-raised border border-border">
              {interview.difficulty === "easy" ? "Kolay" : interview.difficulty === "medium" ? "Orta" : "Zor"}
            </span>
          )}
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-danger animate-pulse"}`}
            title={connected ? "Bağlı" : "Bağlantı yok"}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <select
            value={codeLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as CodeLanguage)}
            className="text-xs bg-surface-raised text-text border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-amber"
          >
            {(Object.keys(languageLabels) as CodeLanguage[]).map((lang) => (
              <option key={lang} value={lang}>
                {languageLabels[lang]}
              </option>
            ))}
          </select>

          {isPractice ? (
            <span className="text-xs text-text-muted/50 font-mono tabular-nums flex items-center gap-1" title="Süre sınırı yok — rahatça çalış">
              <Coffee size={11} /> {formatTime(elapsed)}
            </span>
          ) : (
            <span className="text-sm font-mono text-text-muted tabular-nums">
              {formatTime(elapsed)}
            </span>
          )}
          <Button variant="danger" size="sm" onClick={() => setShowEndModal(true)}>
            Bitir
          </Button>
        </div>
      </header>

      {/* Main content: Problem | Code Editor + Tests */}
      <div className="flex-1 overflow-hidden">
        <ResizableSplitter
          defaultLeftPercent={45}
          minLeftPercent={35}
          maxLeftPercent={60}
          left={
            <div className="h-full border-r border-border-subtle bg-surface flex flex-col">
              <ProblemPanel
                problem={problem}
                loading={problemLoading}
                transcript={transcript}
                aiText={aiText}
                micActive={micActive}
                state={state}
                volume={volume}
                onMicClick={handleMicClick}
                connected={connected}
                hintLevel={hintLevel}
                totalHints={totalHints}
                onRequestHint={requestHint}
                interviewStatus={interview?.status}
                onStartInterview={handleStartInterview}
              />
            </div>
          }
          right={
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResizableSplitter
                  direction="vertical"
                  defaultLeftPercent={65}
                  minLeftPercent={30}
                  maxLeftPercent={85}
                  left={
                    <div className="h-full">
                      <CodeEditor
                        language={codeLanguage}
                        value={code}
                        onChange={handleCodeChange}
                      />
                    </div>
                  }
                  right={
                    <TestResultsPanel
                      result={executionResult}
                      running={executing}
                      onRun={handleRunCode}
                    />
                  }
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Solution comparison modal (practice mode) */}
      {solutionComparison && (
        <SolutionComparisonPanel
          userSolution={solutionComparison.userSolution}
          optimalSolution={solutionComparison.optimalSolution}
          timeComplexity={solutionComparison.timeComplexity}
          spaceComplexity={solutionComparison.spaceComplexity}
          onDismiss={dismissSolution}
        />
      )}

      {/* End Interview Modal */}
      <EndInterviewModal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        onComplete={handleComplete}
        onAbandon={handleAbandon}
        hasCode={!!code.trim()}
        allTestsPassed={executionResult?.results?.length ? executionResult.results.every(r => r.passed) : false}
      />

    </div>
  );
}

// ─── Voice-Only Room (for non-live-coding interviews) ────

interface VoiceOnlyRoomProps {
  interview: Interview | null;
  state: VoicePipelineState;
  micActive: boolean;
  volume: number;
  transcript: string;
  aiText: string;
  error: string | null;
  connected: boolean;
  elapsed: number;
  formatTime: (s: number) => string;
  onMicClick: () => void;
  onEnd: () => void;
  questionCurrent: number;
  questionTotal: number;
  questionStartTime: number;
  recommendedSeconds: number;
  timeWarning: number | null;
  onStartInterview: () => void;
}

function VoiceOnlyRoom({
  interview,
  state,
  micActive,
  volume,
  transcript,
  aiText,
  error,
  connected,
  elapsed,
  formatTime,
  onMicClick,
  onEnd,
  questionCurrent,
  questionTotal,
  questionStartTime,
  recommendedSeconds,
  timeWarning,
  onStartInterview,
}: VoiceOnlyRoomProps) {
  // Per-question elapsed timer
  const [questionElapsed, setQuestionElapsed] = useState(0);

  useEffect(() => {
    if (!questionStartTime || !recommendedSeconds) {
      setQuestionElapsed(0);
      return;
    }
    setQuestionElapsed(0);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionElapsed(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionStartTime, recommendedSeconds]);

  const questionTimePercent = recommendedSeconds > 0 ? Math.min(questionElapsed / recommendedSeconds, 1) : 0;
  const questionOvertime = questionElapsed > recommendedSeconds && recommendedSeconds > 0;

  const orbScale =
    state === "listening"
      ? 1 + Math.min(volume * 8, 0.2)
      : state === "speaking"
        ? undefined
        : 1;

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface/80 backdrop-blur-sm px-5">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-amber/15 flex items-center justify-center">
            <span className="text-amber font-display text-xs font-bold">W</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            {interview ? typeLabels[interview.type] ?? interview.type : "Mülakat"}
          </span>
          {interview && (
            <span className="text-xs text-text-muted px-2 py-0.5 rounded-md bg-surface-raised border border-border">
              {interview.difficulty === "easy" ? "Kolay" : interview.difficulty === "medium" ? "Orta" : "Zor"}
            </span>
          )}
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-danger animate-pulse"}`}
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Question counter + per-question timer for phone-screen */}
          {questionTotal > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary px-2.5 py-1 rounded-md bg-surface-raised border border-border tabular-nums">
                Soru {questionCurrent}/{questionTotal}
              </span>
              {recommendedSeconds > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        questionOvertime
                          ? "bg-danger"
                          : questionTimePercent > 0.75
                            ? "bg-amber"
                            : "bg-success"
                      }`}
                      style={{ width: `${Math.min(questionTimePercent * 100, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      questionOvertime ? "text-danger" : questionTimePercent > 0.75 ? "text-amber" : "text-text-muted"
                    }`}
                  >
                    {formatTime(questionElapsed)}/{formatTime(recommendedSeconds)}
                  </span>
                </div>
              )}
            </div>
          )}
          <span className={`text-sm font-mono tabular-nums flex items-center gap-1.5 ${timeWarning ? "text-amber" : "text-text-muted"}`}>
            {timeWarning && <Clock size={12} />}
            {formatTime(elapsed)}
          </span>
          <Button variant="danger" size="sm" onClick={onEnd}>
            Bitir
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Voice Assistant */}
        <AIChat
          transcript={transcript}
          aiText={aiText}
          micActive={micActive}
          state={state}
          volume={volume}
          onMicClick={onMicClick}
          connected={connected}
          interviewStatus={interview?.status}
          onStartInterview={onStartInterview}
        />

        {timeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-4 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 max-w-md flex items-center gap-2"
          >
            <Clock size={14} className="text-amber shrink-0" />
            <p className="text-sm text-amber">Kalan süre: ~{timeWarning} dakika</p>
          </motion.div>
        )}

        {error && (
          <div className="relative z-10 mt-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-2 max-w-md">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {aiText && (
            <motion.div
              key="ai-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative z-10 mt-6 max-w-lg text-center px-6"
            >
              <p className="text-text-secondary text-sm leading-relaxed">{aiText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-md"
            >
              <div className="rounded-xl bg-surface-overlay/80 backdrop-blur-sm border border-border px-4 py-3">
                <p className="text-xs text-text-muted mb-1">Sen</p>
                <p className="text-sm text-text">{transcript}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-border-subtle bg-surface/80 backdrop-blur-sm py-5">
        <div className="flex items-center justify-center gap-6">
          <div className="relative">
            {micActive && (
              <motion.div
                animate={{ scale: 1 + volume * 6, opacity: 0.3 + volume * 2 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 rounded-full bg-success/20 pointer-events-none"
                style={{ margin: -8 }}
              />
            )}
            <button
              onClick={onMicClick}
              disabled={!connected}
              className={`
                relative h-16 w-16 rounded-full flex items-center justify-center
                border-2 transition-all duration-200 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  state === "speaking" || state === "processing"
                    ? "border-danger/60 bg-danger/15 text-danger hover:bg-danger/20"
                    : micActive
                      ? "border-success bg-success/15 text-success shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:bg-success/20"
                      : "border-border bg-surface-raised text-text-muted hover:border-text-muted hover:text-text"
                }
              `}
            >
              {state === "speaking" || state === "processing" ? (
                <Hand size={24} strokeWidth={2} />
              ) : (
                <Mic size={24} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-text-muted mt-3">
          {!connected
            ? "Bağlantı kuruluyor…"
            : state === "speaking" || state === "processing"
              ? "Araya girmek için butona tıklayın"
              : micActive
                ? "Konuşun — sessizlikte otomatik gönderilir"
                : "Mikrofonu açmak için butona tıklayın"}
        </p>
      </div>
    </div>
  );
}

// ─── End Interview Modal ─────────────────────────────────

interface EndInterviewModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  hasCode: boolean;
  allTestsPassed: boolean;
}

function EndInterviewModal({
  open,
  onClose,
  onComplete,
  onAbandon,
  hasCode,
  allTestsPassed,
}: EndInterviewModalProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <h2 className="font-display text-lg font-bold text-text">Mülakatı Sonlandır</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              {/* Complete option */}
              <button
                onClick={onComplete}
                className={`
                  w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${allTestsPassed
                    ? "border-success/40 bg-success/5 hover:bg-success/10 hover:border-success/60"
                    : "border-border hover:border-success/40 hover:bg-success/5"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${allTestsPassed ? "bg-success/20" : "bg-success/10"}
                  `}>
                    <CheckCircle2 size={20} className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text text-sm">Tamamla ve Değerlendir</h3>
                    <p className="text-xs text-text-muted mt-1">
                      {allTestsPassed
                        ? "Tüm testler geçti! Çözümünü tamamlayıp rapor oluştur."
                        : hasCode
                        ? "Mevcut kodunla mülakatı tamamla ve rapor oluştur."
                        : "Mülakatı tamamla ve performans raporu oluştur."
                      }
                    </p>
                    {allTestsPassed && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Tüm testler başarılı
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Abandon option */}
              <button
                onClick={onAbandon}
                className="w-full p-4 rounded-xl border-2 border-border text-left transition-all duration-200 hover:border-danger/40 hover:bg-danger/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-danger" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text text-sm">Yarıda Bırak</h3>
                    <p className="text-xs text-text-muted mt-1">
                      Mülakatı tamamlamadan çık. Rapor yine de oluşturulabilir ama "yarıda bırakıldı" olarak işaretlenir.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
              >
                Devam Et
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

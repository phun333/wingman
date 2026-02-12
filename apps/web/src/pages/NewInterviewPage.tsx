import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  createInterview,
  startInterview,
  searchLeetcodeProblems,
  listLeetcodeProblems,
} from "@/lib/api";
import { Code2, Waypoints, Phone, Dumbbell, Search, X, Check, Shuffle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InterviewType, Difficulty, LeetcodeProblem } from "@ffh/types";

const types: {
  id: InterviewType;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    id: "live-coding",
    icon: Code2,
    title: "Live Coding",
    desc: "Algoritmik problemleri gerçek zamanlı çöz",
  },
  {
    id: "system-design",
    icon: Waypoints,
    title: "System Design",
    desc: "Büyük ölçekli sistemler tasarla",
  },
  {
    id: "phone-screen",
    icon: Phone,
    title: "Phone Screen",
    desc: "Teknik telefon mülakatı simülasyonu",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Practice",
    desc: "Serbest pratik, stressiz ortam",
  },
];

const difficulties: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Kolay", color: "text-success border-success/30 bg-success/10" },
  { id: "medium", label: "Orta", color: "text-amber border-amber/30 bg-amber/10" },
  { id: "hard", label: "Zor", color: "text-danger border-danger/30 bg-danger/10" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function NewInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("type") as InterviewType | null;

  const [selectedType, setSelectedType] = useState<InterviewType | null>(
    preselected || "live-coding", // Default to live-coding for testing
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(1);
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "typescript" | "python">("javascript");

  // Question selection
  const [selectedProblem, setSelectedProblem] = useState<LeetcodeProblem | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [searchResults, setSearchResults] = useState<LeetcodeProblem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [suggestedProblems, setSuggestedProblems] = useState<LeetcodeProblem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load suggested problems based on difficulty
  useEffect(() => {
    listLeetcodeProblems({ difficulty, limit: 8 })
      .then((res) => setSuggestedProblems(res.problems))
      .catch(() => {});
  }, [difficulty]);

  // Debounced search
  useEffect(() => {
    if (questionSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      searchLeetcodeProblems(questionSearch, 20)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [questionSearch]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showQuestionPicker) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showQuestionPicker]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!selectedType) return;
    setLoading(true);
    setError(null);

    try {
      const interview = await createInterview({
        type: selectedType,
        difficulty: selectedProblem?.difficulty ?? difficulty,
        language: "tr",
        questionCount: selectedProblem ? 1 : questionCount,
        codeLanguage: (selectedType === "live-coding" || selectedType === "practice") ? codeLanguage : undefined,
      });

      // Start the interview immediately
      await startInterview(interview._id);

      // Navigate with problemId if a specific question was selected
      const params = selectedProblem ? `?problemId=${selectedProblem._id}` : "";
      navigate(`/interview/${interview._id}${params}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mülakat oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  const DIFF_VARIANT: Record<Difficulty, "success" | "amber" | "danger"> = {
    easy: "success",
    medium: "amber",
    hard: "danger",
  };

  const DIFF_LABEL: Record<Difficulty, string> = {
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
  };

  const displayProblems = questionSearch.length >= 2 ? searchResults : suggestedProblems;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-3xl mx-auto"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-text">
          Yeni Mülakat
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Mülakat türünü ve ayarlarını seç
        </p>
      </motion.div>

      {/* Step 1 — Type */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Mülakat Türü
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map((t) => {
            const IconComponent = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`
                  text-left rounded-xl border p-4 transition-all duration-150 cursor-pointer
                  ${
                    selectedType === t.id
                      ? "border-amber bg-amber/5 glow-amber-sm"
                      : "border-border-subtle bg-surface hover:border-border"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <IconComponent
                    size={20}
                    strokeWidth={1.8}
                    className={selectedType === t.id ? "text-amber" : "text-text-secondary"}
                  />
                  <div>
                    <p className="font-display font-semibold text-text">
                      {t.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 2 — Difficulty */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Zorluk
        </h2>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`
                rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer
                ${difficulty === d.id ? d.color : "border-border bg-surface text-text-secondary hover:border-border"}
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Step 3 — Code Language (for Live Coding and Practice) */}
      {(selectedType === "live-coding" || selectedType === "practice") && (
        <motion.div
          key={`code-lang-${selectedType}`}
          variants={fadeUp}
          className="mt-8"
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
            Kod Dili
          </h2>
          <div className="flex gap-2">
            {[
              { id: "javascript" as const, label: "JavaScript", icon: "🟨" },
              { id: "typescript" as const, label: "TypeScript", icon: "🔷" },
              { id: "python" as const, label: "Python", icon: "🐍" },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setCodeLanguage(lang.id)}
                className={`
                  rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center gap-2
                  ${codeLanguage === lang.id ? "border-amber bg-amber/10 text-amber" : "border-border-subtle bg-surface text-text-secondary hover:border-border"}
                `}
              >
                <span>{lang.icon}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 4 — Question count */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Soru Sayısı
        </h2>
        <div className="flex gap-2">
          {[1, 3, 5, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuestionCount(n)}
              className={`
                rounded-lg border px-4 py-2 text-sm font-medium tabular-nums transition-all duration-150 cursor-pointer
                ${questionCount === n ? "border-amber bg-amber/10 text-amber" : "border-border bg-surface text-text-secondary hover:border-border"}
              `}
            >
              {n} Soru
            </button>
          ))}
        </div>
      </motion.div>

      {/* Step 5 — Question Selection (optional) */}
      {(selectedType === "live-coding" || selectedType === "practice") && (
        <motion.div
          key="question-picker"
          variants={fadeUp}
          className="mt-8"
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
              Soru Seçimi
              <span className="text-text-muted/60 normal-case tracking-normal ml-1.5">(opsiyonel)</span>
            </h2>
            {selectedProblem && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProblem(null);
                  setQuestionSearch("");
                }}
                className="text-xs text-text-muted hover:text-amber transition-colors cursor-pointer flex items-center gap-1"
              >
                <Shuffle size={12} />
                Rastgele soru kullan
              </button>
            )}
          </div>

          {/* Selected problem display */}
          {selectedProblem ? (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber/10 text-amber font-mono text-sm font-bold shrink-0">
                {selectedProblem.leetcodeId}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text truncate">{selectedProblem.title}</p>
                  <Badge variant={DIFF_VARIANT[selectedProblem.difficulty]}>
                    {DIFF_LABEL[selectedProblem.difficulty]}
                  </Badge>
                </div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {selectedProblem.relatedTopics.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProblem(null);
                  setShowQuestionPicker(true);
                }}
                className="text-text-muted hover:text-text transition-colors cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Toggle picker */}
              {!showQuestionPicker ? (
                <button
                  type="button"
                  onClick={() => setShowQuestionPicker(true)}
                  className="w-full rounded-xl border border-dashed border-border-subtle hover:border-amber/40 bg-surface hover:bg-surface-raised/50 p-4 transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center justify-center gap-2 text-sm text-text-muted group-hover:text-amber transition-colors">
                    <Search size={16} />
                    <span>Belirli bir soru seç veya rastgele devam et</span>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  {/* Search input */}
                  <div className="relative border-b border-border-subtle">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Soru adı veya numara ile ara..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestionPicker(false);
                        setQuestionSearch("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Results label */}
                  <div className="px-3.5 py-2 border-b border-border-subtle/50">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">
                      {searchLoading
                        ? "Aranıyor..."
                        : questionSearch.length >= 2
                          ? `${searchResults.length} sonuç`
                          : "Önerilen sorular"}
                    </p>
                  </div>

                  {/* Results list */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-border-subtle/30">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
                      </div>
                    ) : displayProblems.length > 0 ? (
                      displayProblems.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setSelectedProblem(p);
                            setShowQuestionPicker(false);
                            setQuestionSearch("");
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-surface-raised/60 transition-colors cursor-pointer group/row flex items-center gap-3"
                        >
                          <span className="text-xs font-mono text-text-muted w-10 shrink-0 text-right">
                            {p.leetcodeId}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-text truncate group-hover/row:text-amber transition-colors">
                                {p.title}
                              </span>
                              <Badge variant={DIFF_VARIANT[p.difficulty]}>
                                {DIFF_LABEL[p.difficulty]}
                              </Badge>
                            </div>
                            {p.relatedTopics.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {p.relatedTopics.slice(0, 3).map((t) => (
                                  <span key={t} className="text-[10px] text-text-muted">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-text-muted shrink-0">
                            %{p.acceptanceRate.toFixed(0)}
                          </span>
                        </button>
                      ))
                    ) : questionSearch.length >= 2 ? (
                      <div className="py-8 text-center text-sm text-text-muted">
                        Soru bulunamadı
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Summary & Start */}
      <motion.div variants={fadeUp} className="mt-10">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                {selectedType
                  ? `${types.find((t) => t.id === selectedType)?.title} · ${difficulties.find((d) => d.id === difficulty)?.label} · ${selectedProblem ? `"${selectedProblem.title}"` : `${questionCount} Soru`}${(selectedType === "live-coding" || selectedType === "practice") ? ` · ${codeLanguage.toUpperCase()}` : ""}`
                  : "Mülakat türü seçin"}
              </p>
            </div>
            <Button
              onClick={handleStart}
              disabled={!selectedType || loading}
              size="lg"
            >
              {loading ? "Oluşturuluyor…" : "Mülakata Başla"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Plus,
  Link2,
  FileText,
  Trash2,
  ChevronRight,
  Building2,
  Code2,
  Layers,
  MessageSquare,
  CheckCircle,
  Circle,
  Sparkles,
  ExternalLink,
  X,
  ArrowRight,
  Target,
  Loader2,
  Globe,
} from "lucide-react";
import {
  parseJobPosting,
  listJobPostings,
  deleteJobPosting,
  getJobPaths,
} from "@/lib/api";
import type { JobPosting } from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

interface JobPath {
  _id: string;
  jobPostingId: string;
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  categories: Array<{
    name: string;
    type: "live-coding" | "system-design" | "phone-screen";
    questions: Array<{
      id: string;
      question: string;
      difficulty: "easy" | "medium" | "hard";
      completed: boolean;
      interviewId?: string;
      score?: number;
    }>;
  }>;
  progress: number;
  job?: {
    title: string;
    company?: string;
    level?: string;
  } | null;
}

// ─── Animation Variants ──────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const typeIcons = {
  "live-coding": Code2,
  "system-design": Layers,
  "phone-screen": MessageSquare,
};

const typeColors = {
  "live-coding": "text-info",
  "system-design": "text-amber",
  "phone-screen": "text-success",
};

const difficultyStyles = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-amber/10 text-amber border-amber/20",
  hard: "bg-danger/10 text-danger border-danger/20",
};

// ─── Component ───────────────────────────────────────────

export function JobsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [paths, setPaths] = useState<JobPath[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Job form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobRawText, setJobRawText] = useState("");
  const [useManualText, setUseManualText] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded job detail
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [jobList, pathList] = await Promise.all([
        listJobPostings(),
        getJobPaths(),
      ]);
      setJobs(jobList);
      setPaths(pathList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ────────────────────────────────────────

  async function handleParseJob() {
    if (!jobUrl && !jobRawText) return;

    setParsing(true);
    setError(null);
    try {
      await parseJobPosting({
        url: jobUrl || undefined,
        rawText: useManualText ? jobRawText || undefined : undefined,
      });
      setJobUrl("");
      setJobRawText("");
      setShowAddForm(false);
      setUseManualText(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İlan analizi başarısız oldu");
    } finally {
      setParsing(false);
    }
  }

  async function handleDeleteJob(id: string) {
    try {
      await deleteJobPosting(id);
      await loadData();
    } catch {
      // ignore
    }
  }

  function getPathForJob(jobId: string): JobPath | undefined {
    return paths.find((p) => p.jobPostingId === jobId);
  }

  function handleStartInterview(path: JobPath, category: any) {
    const nextQuestion = category.questions.find((q: any) => !q.completed);
    if (nextQuestion) {
      navigate(`/interview/new?type=${category.type}&jobPathId=${path._id}`);
    }
  }

  // ─── Render ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* ─── Header ─── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-amber/15 border border-amber/25 flex items-center justify-center">
              <Target size={20} className="text-amber" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text">
              İş İlanları & Mülakat Yol Haritası
            </h1>
          </div>
          <p className="mt-2 text-sm text-text-secondary ml-[52px]">
            Hedeflediğin pozisyonları ekle, sana özel mülakat hazırlık planı oluşturalım
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-shrink-0"
        >
          {showAddForm ? (
            <>
              <X size={16} className="mr-1.5" />
              Kapat
            </>
          ) : (
            <>
              <Plus size={16} className="mr-1.5" />
              İlan Ekle
            </>
          )}
        </Button>
      </motion.div>

      {/* ─── Add Job Form ─── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Card className="border-amber/20 relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/50 to-transparent" />

              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} className="text-amber" />
                <h2 className="font-display font-semibold text-text">
                  Yeni İş İlanı Analizi
                </h2>
              </div>

              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseManualText(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      !useManualText
                        ? "bg-amber/15 text-amber border border-amber/30"
                        : "bg-surface-raised text-text-secondary border border-border hover:border-border-subtle"
                    }`}
                  >
                    <Globe size={14} />
                    URL ile Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseManualText(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      useManualText
                        ? "bg-amber/15 text-amber border border-amber/30"
                        : "bg-surface-raised text-text-secondary border border-border hover:border-border-subtle"
                    }`}
                  >
                    <FileText size={14} />
                    Metin Yapıştır
                  </button>
                </div>

                {!useManualText ? (
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                      İlan URL'si
                    </label>
                    <div className="relative">
                      <Link2
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <Input
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://linkedin.com/jobs/view/... veya herhangi bir iş ilanı linki"
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleParseJob();
                          }
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted">
                      LinkedIn, Indeed, Kariyer.net, Glassdoor ve diğer tüm iş ilanı siteleri desteklenir
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                      İlan İçeriği
                    </label>
                    <textarea
                      value={jobRawText}
                      onChange={(e) => setJobRawText(e.target.value)}
                      placeholder="İş ilanı metnini buraya yapıştırın... (LinkedIn, mail, PDF vb. her kaynaktan)"
                      rows={6}
                      className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleParseJob}
                    disabled={parsing || (!jobUrl && !jobRawText)}
                  >
                    {parsing ? (
                      <>
                        <Loader2 size={16} className="mr-1.5 animate-spin" />
                        Analiz ediliyor…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="mr-1.5" />
                        AI ile Analiz Et
                      </>
                    )}
                  </Button>

                  {parsing && (
                    <span className="text-xs text-text-muted animate-pulse">
                      İlan scrape ediliyor ve AI ile analiz ediliyor...
                    </span>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2">
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State ─── */}
      {jobs.length === 0 && !showAddForm && (
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute top-10 left-10 w-32 h-32 rounded-full border border-amber" />
              <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border border-info" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-success" />
            </div>

            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-5 mx-auto">
                <Briefcase size={28} className="text-amber" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-lg font-semibold text-text mb-2">
                Hedefini Belirle, Yolunu Çiz
              </h2>
              <p className="text-sm text-text-secondary max-w-md mb-6">
                Bir iş ilanı ekle — LinkedIn, Indeed veya herhangi bir kaynaktan.
                AI, sana özel mülakat hazırlık planı oluşturacak.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={16} className="mr-1.5" />
                İlk İlanını Ekle
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ─── Job Cards ─── */}
      {jobs.length > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
          {jobs.map((job) => {
            const path = getPathForJob(job._id);
            const isExpanded = expandedJobId === job._id;

            return (
              <motion.div key={job._id} variants={fadeUp}>
                <Card className="p-0 overflow-hidden hover:border-amber/20 transition-all duration-300">
                  {/* Job Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {job.company && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                              <Building2 size={12} />
                              {job.company}
                            </span>
                          )}
                          {job.level && (
                            <Badge variant="amber">{job.level}</Badge>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-semibold text-text">
                          {job.title}
                        </h3>
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-amber transition-colors mt-1"
                          >
                            <ExternalLink size={10} />
                            Orijinal ilan
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedJobId(isExpanded ? null : job._id)
                          }
                          className="text-xs text-text-secondary hover:text-amber transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? "Kapat" : "Detaylar"}
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job._id)}
                          className="text-text-muted hover:text-danger transition-colors p-1 cursor-pointer"
                          title="İlanı sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.slice(0, 8).map((skill) => (
                        <Badge key={skill} variant="default">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 8 && (
                        <Badge variant="default">
                          +{job.skills.length - 8}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Interview Path Progress */}
                  {path && (
                    <div className="px-5 pb-5">
                      <div className="rounded-xl bg-surface-raised border border-border-subtle p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-text-secondary">
                            Mülakat Hazırlığı
                          </span>
                          <span className="text-xs font-bold text-amber tabular-nums">
                            {path.progress}%
                          </span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-text-muted">
                            {path.completedQuestions} / {path.totalQuestions} soru
                            tamamlandı
                          </span>
                          <div className="flex gap-4">
                            {path.categories.map((cat) => {
                              const Icon = typeIcons[cat.type];
                              const color = typeColors[cat.type];
                              const done = cat.questions.filter(
                                (q) => q.completed
                              ).length;
                              return (
                                <span
                                  key={cat.type}
                                  className="inline-flex items-center gap-1.5 text-xs text-text-muted"
                                  title={cat.name}
                                >
                                  <Icon size={12} className={color} />
                                  {done}/{cat.questions.length}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border-subtle">
                          {/* Requirements */}
                          {job.requirements.length > 0 && (
                            <div className="px-6 pt-5 pb-4">
                              <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
                                Gereksinimler
                              </h4>
                              <ul className="space-y-2">
                                {job.requirements.map((req, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-text-secondary flex items-start gap-2.5"
                                  >
                                    <span className="text-amber mt-1.5 text-[6px]">
                                      ●
                                    </span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Interview Path Categories */}
                          {path && (
                            <div className="px-6 pt-2 pb-6">
                              <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-4">
                                Mülakat Yol Haritası
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {path.categories.map((category, idx) => {
                                  const Icon = typeIcons[category.type];
                                  const color = typeColors[category.type];
                                  const completedCount =
                                    category.questions.filter(
                                      (q) => q.completed
                                    ).length;
                                  const totalCount = category.questions.length;

                                  return (
                                    <div
                                      key={idx}
                                      className="bg-bg rounded-xl p-4 border border-border-subtle"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                          <div className={`h-7 w-7 rounded-lg bg-surface-raised flex items-center justify-center border border-border-subtle`}>
                                            <Icon
                                              size={14}
                                              className={color}
                                            />
                                          </div>
                                          <span className="text-sm font-medium text-text">
                                            {category.name}
                                          </span>
                                        </div>
                                        <span className="text-xs text-text-muted tabular-nums">
                                          {completedCount}/{totalCount}
                                        </span>
                                      </div>

                                      <div className="space-y-3">
                                        {category.questions.map((q) => (
                                          <div
                                            key={q.id}
                                            className="flex items-start gap-2.5"
                                          >
                                            {q.completed ? (
                                              <CheckCircle
                                                size={14}
                                                className="text-success mt-0.5 flex-shrink-0"
                                              />
                                            ) : (
                                              <Circle
                                                size={14}
                                                className="text-text-muted mt-0.5 flex-shrink-0"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p
                                                className={`text-xs leading-relaxed ${
                                                  q.completed
                                                    ? "line-through text-text-muted"
                                                    : "text-text-secondary"
                                                }`}
                                              >
                                                {q.question}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1.5">
                                                <span
                                                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                    difficultyStyles[
                                                      q.difficulty
                                                    ]
                                                  }`}
                                                >
                                                  {q.difficulty}
                                                </span>
                                                {q.score != null && (
                                                  <span className="text-[10px] font-bold text-amber">
                                                    {q.score}/100
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Start Interview Button */}
                                      {completedCount < totalCount && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartInterview(path, category)
                                          }
                                          className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber/10 border border-amber/20 px-3 py-2 text-xs font-medium text-amber hover:bg-amber/15 transition-colors cursor-pointer"
                                        >
                                          Mülakata Başla
                                          <ArrowRight size={12} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ─── Tips Section ─── */}
      {jobs.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl border border-border-subtle/50 bg-surface-raised/50 p-4 flex items-start gap-3">
            <Sparkles size={16} className="text-amber flex-shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted leading-relaxed">
              <strong className="text-text-secondary">İpucu:</strong> Her iş ilanı
              için otomatik oluşturulan mülakat yol haritası, ilanın gereksinimleri
              ve beklenen yetkinliklere göre özelleştirilir. Soruları tamamladıkça
              ilerlemen otomatik takip edilir.
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

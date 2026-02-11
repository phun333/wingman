import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getReport,
  generateReport,
  getInterview,
  getInterviewMessages,
} from "@/lib/api";
import type {
  InterviewResult,
  Interview,
  Message,
  HireRecommendation,
} from "@ffh/types";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ─── Constants ───────────────────────────────────────────

const hireLabels: Record<HireRecommendation, { label: string; color: string; bg: string }> = {
  "strong-hire": { label: "Strong Hire", color: "text-success", bg: "bg-success/15 border-success/30" },
  hire: { label: "Hire", color: "text-info", bg: "bg-info/15 border-info/30" },
  "lean-hire": { label: "Lean Hire", color: "text-amber", bg: "bg-amber/15 border-amber/30" },
  "no-hire": { label: "No Hire", color: "text-danger", bg: "bg-danger/15 border-danger/30" },
};

const typeLabels: Record<string, string> = {
  "live-coding": "Live Coding",
  "system-design": "System Design",
  "phone-screen": "Phone Screen",
  practice: "Practice",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-info";
  if (score >= 40) return "text-amber";
  return "text-danger";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info";
  if (score >= 40) return "bg-amber";
  return "bg-danger";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

// ─── Score Ring SVG ──────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-surface-raised"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`font-display text-4xl font-bold ${scoreColor(score)}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-text-muted">/ 100</span>
      </div>
    </div>
  );
}

// ─── Category Bar ────────────────────────────────────────

function CategoryBar({
  label,
  score,
  delay = 0,
}: {
  label: string;
  score: number;
  delay?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${scoreColor(score)}`}>
          {score}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${scoreBarColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<InterviewResult | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const loadReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [iv, msgs] = await Promise.all([
        getInterview(id),
        getInterviewMessages(id),
      ]);
      setInterview(iv);
      setMessages(msgs);

      try {
        const rpt = await getReport(id);
        setReport(rpt);
      } catch {
        // No report yet — will show generate button
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    setError(null);
    try {
      await generateReport(id);
      // Re-fetch report
      const rpt = await getReport(id);
      setReport(rpt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rapor oluşturulamadı");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Loading state ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="text-sm text-text-muted">Rapor yükleniyor…</p>
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────

  if (error && !report) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-danger text-lg">{error}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            Dashboard'a Dön
          </Button>
        </div>
      </div>
    );
  }

  // ─── No report yet — generate ───────────────────────

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="h-16 w-16 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-text">
            Mülakat Raporu
          </h2>
          <p className="mt-2 text-text-secondary text-sm">
            {interview
              ? `${typeLabels[interview.type] ?? interview.type} mülakatın için henüz rapor oluşturulmamış.`
              : "Bu mülakat için rapor oluşturulabilir."}
          </p>
          {error && (
            <p className="mt-3 text-danger text-sm">{error}</p>
          )}
          <Button
            className="mt-6"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Rapor oluşturuluyor…
              </span>
            ) : (
              "🤖 Rapor Oluştur"
            )}
          </Button>
          <Link
            to="/"
            className="block mt-4 text-sm text-text-muted hover:text-text transition-colors"
          >
            Dashboard'a Dön
          </Link>
        </motion.div>
      </div>
    );
  }

  // ─── Report view ────────────────────────────────────

  const hireInfo = hireLabels[report.hireRecommendation];

  // Build radar chart data
  const radarData = [
    { subject: "Problem Çözme", value: report.categoryScores.problemSolving },
    { subject: "İletişim", value: report.categoryScores.communication },
    { subject: "Analitik Düşünme", value: report.categoryScores.analyticalThinking },
    ...(report.categoryScores.codeQuality != null
      ? [{ subject: "Kod Kalitesi", value: report.categoryScores.codeQuality }]
      : []),
    ...(report.categoryScores.systemThinking != null
      ? [{ subject: "Sistem Düşüncesi", value: report.categoryScores.systemThinking }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="h-7 w-7 rounded-md bg-amber/15 flex items-center justify-center">
              <span className="text-amber font-display text-xs font-bold">F</span>
            </Link>
            <span className="text-sm text-text-muted">
              {interview ? typeLabels[interview.type] ?? interview.type : "Mülakat"} Raporu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
              Geçmiş
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ─── Score Card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="flex flex-col sm:flex-row items-center gap-8 p-8">
            <ScoreRing score={report.overallScore} />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold text-text">
                Mülakat Raporu
              </h1>
              {interview && (
                <p className="text-sm text-text-muted mt-1">
                  {typeLabels[interview.type]} · {interview.difficulty === "easy" ? "Kolay" : interview.difficulty === "medium" ? "Orta" : "Zor"} ·{" "}
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(report.createdAt))}
                </p>
              )}
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${hireInfo.bg} ${hireInfo.color}`}
                >
                  {report.hireRecommendation === "strong-hire" && "🟢"}
                  {report.hireRecommendation === "hire" && "🔵"}
                  {report.hireRecommendation === "lean-hire" && "🟡"}
                  {report.hireRecommendation === "no-hire" && "🔴"}
                  {hireInfo.label}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ─── Category Scores + Radar ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Category bars */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-text mb-5">
              Kategori Skorları
            </h2>
            <div className="space-y-4">
              <CategoryBar
                label="Problem Çözme"
                score={report.categoryScores.problemSolving}
                delay={0.3}
              />
              <CategoryBar
                label="İletişim"
                score={report.categoryScores.communication}
                delay={0.4}
              />
              <CategoryBar
                label="Analitik Düşünme"
                score={report.categoryScores.analyticalThinking}
                delay={0.5}
              />
              {report.categoryScores.codeQuality != null && (
                <CategoryBar
                  label="Kod Kalitesi"
                  score={report.categoryScores.codeQuality}
                  delay={0.6}
                />
              )}
              {report.categoryScores.systemThinking != null && (
                <CategoryBar
                  label="Sistem Düşüncesi"
                  score={report.categoryScores.systemThinking}
                  delay={0.7}
                />
              )}
            </div>
          </Card>

          {/* Radar chart */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-text mb-4">
              Yetenek Haritası
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#999", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#666", fontSize: 10 }}
                />
                <Radar
                  name="Skor"
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* ─── Summary ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-text mb-3">
              Genel Değerlendirme
            </h2>
            <p className="text-text-secondary leading-relaxed">{report.summary}</p>
          </Card>
        </motion.div>

        {/* ─── Strengths & Weaknesses ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Strengths */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-success mb-4 flex items-center gap-2">
              <span>✅</span> Güçlü Yönler
            </h2>
            <ul className="space-y-2.5">
              {report.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-success text-xs">✓</span>
                  </span>
                  <span className="text-sm text-text-secondary">{s}</span>
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* Weaknesses */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-amber mb-4 flex items-center gap-2">
              <span>⚠️</span> Gelişim Alanları
            </h2>
            <ul className="space-y-2.5">
              {report.weaknesses.map((w, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber text-xs">!</span>
                  </span>
                  <span className="text-sm text-text-secondary">{w}</span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* ─── Code Analysis (Live Coding only) ────────── */}
        {report.codeAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-text mb-5">
                Kod Analizi
              </h2>

              {/* Complexity badges */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                  <span className="text-xs text-text-muted">Zaman</span>
                  <span className="text-sm font-mono font-semibold text-info">
                    {report.codeAnalysis.timeComplexity}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                  <span className="text-xs text-text-muted">Alan</span>
                  <span className="text-sm font-mono font-semibold text-info">
                    {report.codeAnalysis.spaceComplexity}
                  </span>
                </div>
              </div>

              {/* Side by side code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-2">
                    Senin Çözümün
                  </h3>
                  <pre className="bg-bg rounded-lg border border-border p-4 text-xs font-mono text-text-secondary overflow-x-auto max-h-60 overflow-y-auto">
                    {report.codeAnalysis.userSolution}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-2">
                    Optimal Çözüm
                  </h3>
                  <pre className="bg-bg rounded-lg border border-success/20 p-4 text-xs font-mono text-text-secondary overflow-x-auto max-h-60 overflow-y-auto">
                    {report.codeAnalysis.optimalSolution}
                  </pre>
                </div>
              </div>

              {/* Optimization suggestions */}
              {report.codeAnalysis.optimizationSuggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-2">
                    Optimizasyon Önerileri
                  </h3>
                  <ul className="space-y-2">
                    {report.codeAnalysis.optimizationSuggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-info mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ─── Next Steps ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <span>📌</span> Sonraki Adımlar
            </h2>
            <ul className="space-y-3">
              {report.nextSteps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 h-5 w-5 rounded-md bg-info/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-info text-xs font-bold">{i + 1}</span>
                  </span>
                  <span className="text-sm text-text-secondary">{step}</span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* ─── Transcript (Accordion) ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="p-0 overflow-hidden">
            <button
              onClick={() => setShowTranscript((prev) => !prev)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-raised/50 transition-colors cursor-pointer"
            >
              <h2 className="font-display text-lg font-semibold text-text flex items-center gap-2">
                <span>💬</span> Transkript
                <span className="text-xs text-text-muted font-normal">
                  ({messages.filter((m) => m.role !== "system").length} mesaj)
                </span>
              </h2>
              <span
                className={`text-text-muted transition-transform duration-200 ${showTranscript ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-3 max-h-96 overflow-y-auto border-t border-border-subtle pt-4">
                    {messages
                      .filter((m) => m.role !== "system")
                      .map((m) => (
                        <div
                          key={m._id}
                          className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                              m.role === "user"
                                ? "bg-amber/10 border border-amber/20 text-text"
                                : "bg-surface-raised border border-border text-text-secondary"
                            }`}
                          >
                            <p className="text-xs text-text-muted mb-1">
                              {m.role === "user" ? "Sen" : "Freya"}
                            </p>
                            <p className="leading-relaxed">{m.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ─── Actions ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <Button variant="ghost" onClick={() => navigate("/history")}>
            Geçmiş Mülakatlar
          </Button>
          <Button onClick={() => navigate("/interview/new")}>
            Yeni Mülakat Başlat
          </Button>
        </div>
      </main>
    </div>
  );
}

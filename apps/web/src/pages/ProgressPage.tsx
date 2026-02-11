import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getUserProgress, listInterviews } from "@/lib/api";
import type { UserProgress, Interview, HireRecommendation } from "@ffh/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ─── Constants ───────────────────────────────────────────

const typeLabels: Record<string, string> = {
  "live-coding": "Live Coding",
  "system-design": "System Design",
  "phone-screen": "Phone Screen",
  practice: "Practice",
};

const typeColors: Record<string, string> = {
  "live-coding": "#3b82f6",
  "system-design": "#f59e0b",
  "phone-screen": "#22c55e",
  practice: "#8b5cf6",
};

const hireLabels: Record<HireRecommendation, { label: string; variant: "success" | "amber" | "danger" | "default" }> = {
  "strong-hire": { label: "Strong Hire", variant: "success" },
  hire: { label: "Hire", variant: "success" },
  "lean-hire": { label: "Lean Hire", variant: "amber" },
  "no-hire": { label: "No Hire", variant: "danger" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(ts));
}

function formatFullDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

// ─── Custom Tooltip ──────────────────────────────────────

function ScoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-amber">
        Skor: {payload[0].value}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function ProgressPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      getUserProgress().catch(() => null),
      listInterviews(50).catch(() => []),
    ]).then(([prog, ivs]) => {
      setProgress(prog);
      setInterviews(ivs);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </motion.div>
    );
  }

  const results = progress?.results ?? [];
  const hasData = results.length > 0;

  // Line chart data (chronological order)
  const lineData = [...results]
    .reverse()
    .map((r) => ({
      date: formatDate(r.createdAt),
      score: r.overallScore,
    }));

  // Radar chart data (average of last 5)
  const recent5 = results.slice(0, 5);
  const avgRadarData = recent5.length > 0
    ? [
        {
          subject: "Problem Çözme",
          value: Math.round(
            recent5.reduce((a, r) => a + r.categoryScores.problemSolving, 0) / recent5.length,
          ),
        },
        {
          subject: "İletişim",
          value: Math.round(
            recent5.reduce((a, r) => a + r.categoryScores.communication, 0) / recent5.length,
          ),
        },
        {
          subject: "Analitik Düşünme",
          value: Math.round(
            recent5.reduce((a, r) => a + r.categoryScores.analyticalThinking, 0) / recent5.length,
          ),
        },
        ...(recent5.some((r) => r.categoryScores.codeQuality != null)
          ? [{
              subject: "Kod Kalitesi",
              value: Math.round(
                recent5
                  .filter((r) => r.categoryScores.codeQuality != null)
                  .reduce((a, r) => a + (r.categoryScores.codeQuality ?? 0), 0) /
                  recent5.filter((r) => r.categoryScores.codeQuality != null).length,
              ),
            }]
          : []),
        ...(recent5.some((r) => r.categoryScores.systemThinking != null)
          ? [{
              subject: "Sistem Düşüncesi",
              value: Math.round(
                recent5
                  .filter((r) => r.categoryScores.systemThinking != null)
                  .reduce((a, r) => a + (r.categoryScores.systemThinking ?? 0), 0) /
                  recent5.filter((r) => r.categoryScores.systemThinking != null).length,
              ),
            }]
          : []),
      ]
    : [];

  // Filtered interviews for the table
  const filteredInterviews = interviews.filter((iv) => {
    if (filter === "all") return true;
    return iv.type === filter;
  });

  return (
    <motion.div
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-text">İlerleme</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Mülakat performansın ve zaman içindeki gelişimin
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeUp} className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Değerlendirilen", value: progress?.totalEvaluated ?? 0 },
          { label: "Ortalama Skor", value: progress?.averageScore ?? 0 },
          { label: "En Yüksek", value: progress?.highestScore ?? 0 },
          { label: "Bu Ay", value: progress?.thisMonth ?? 0 },
          { label: "Seri 🔥", value: progress?.streak ?? 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text tabular-nums">
              {stat.value}
            </p>
          </Card>
        ))}
      </motion.div>

      {!hasData ? (
        <motion.div variants={fadeUp} className="mt-10">
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-text-secondary text-sm">
              Henüz değerlendirilmiş mülakat yok
            </p>
            <p className="text-text-muted text-xs mt-1">
              Mülakat yap ve rapor oluştur — ilerleme grafiklerini burada göreceksin
            </p>
            <Link
              to="/interview/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 text-sm font-medium text-amber hover:bg-amber/15 transition-colors"
            >
              İlk Mülakatını Başlat
            </Link>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Charts Row */}
          <motion.div
            variants={fadeUp}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Score over time */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-text mb-4">
                Skor Grafiği
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#888", fontSize: 11 }}
                    axisLine={{ stroke: "#444" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#888", fontSize: 11 }}
                    axisLine={{ stroke: "#444" }}
                  />
                  <Tooltip content={<ScoreTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Radar */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-text mb-4">
                Yetenek Haritası
                <span className="text-xs text-text-muted font-normal ml-2">
                  (son 5 ortalama)
                </span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={avgRadarData} cx="50%" cy="50%" outerRadius="75%">
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
                    name="Ortalama"
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

          {/* Strengths / Weaknesses Cumulative */}
          {(progress?.topStrengths?.length || progress?.topWeaknesses?.length) ? (
            <motion.div
              variants={fadeUp}
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Top Strengths */}
              {progress?.topStrengths && progress.topStrengths.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-display text-lg font-semibold text-success mb-4 flex items-center gap-2">
                    <span>✅</span> En Sık Güçlü Yönler
                  </h2>
                  <ul className="space-y-2.5">
                    {progress.topStrengths.map((s, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{s.text}</span>
                        <span className="text-xs text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
                          ×{s.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Top Weaknesses */}
              {progress?.topWeaknesses && progress.topWeaknesses.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-display text-lg font-semibold text-amber mb-4 flex items-center gap-2">
                    <span>⚠️</span> Sık Tekrar Eden Gelişim Alanları
                  </h2>
                  <ul className="space-y-2.5">
                    {progress.topWeaknesses.map((w, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{w.text}</span>
                        <span className="text-xs text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
                          ×{w.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </motion.div>
          ) : null}

          {/* Interview History Table */}
          <motion.div variants={fadeUp} className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-text">
                Mülakat Geçmişi
              </h2>
              <div className="flex items-center gap-2">
                {["all", "live-coding", "phone-screen", "system-design", "practice"].map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        filter === f
                          ? "bg-amber/15 border-amber/30 text-amber"
                          : "bg-surface-raised border-border text-text-muted hover:text-text"
                      }`}
                    >
                      {f === "all" ? "Tümü" : typeLabels[f] ?? f}
                    </button>
                  ),
                )}
              </div>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-raised/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Tür
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Zorluk
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Skor
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Detay
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.map((iv) => {
                      const result = results.find(
                        (r) => r.interviewId === iv._id,
                      );
                      return (
                        <tr
                          key={iv._id}
                          className="border-b border-border-subtle last:border-0 hover:bg-surface-raised/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-text-secondary">
                            {formatFullDate(iv.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-medium"
                              style={{
                                color: typeColors[iv.type] ?? "#999",
                              }}
                            >
                              {typeLabels[iv.type] ?? iv.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md border ${
                                iv.difficulty === "easy"
                                  ? "text-success border-success/30 bg-success/10"
                                  : iv.difficulty === "medium"
                                    ? "text-amber border-amber/30 bg-amber/10"
                                    : "text-danger border-danger/30 bg-danger/10"
                              }`}
                            >
                              {iv.difficulty === "easy"
                                ? "Kolay"
                                : iv.difficulty === "medium"
                                  ? "Orta"
                                  : "Zor"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {result ? (
                              <span className="font-display font-semibold text-text tabular-nums">
                                {result.overallScore}
                              </span>
                            ) : (
                              <span className="text-text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {result ? (
                              <Badge
                                variant={
                                  hireLabels[result.hireRecommendation]?.variant ?? "default"
                                }
                              >
                                {hireLabels[result.hireRecommendation]?.label ?? "—"}
                              </Badge>
                            ) : (
                              <Badge variant="default">
                                {iv.status === "completed"
                                  ? "Rapor Bekleniyor"
                                  : iv.status === "in-progress"
                                    ? "Devam Ediyor"
                                    : "Oluşturuldu"}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(iv.status === "completed" || iv.status === "evaluated") ? (
                              <Link
                                to={`/interview/${iv._id}/report`}
                                className="text-xs text-amber hover:text-amber/80 transition-colors"
                              >
                                Rapor →
                              </Link>
                            ) : iv.status === "in-progress" ? (
                              <Link
                                to={`/interview/${iv._id}`}
                                className="text-xs text-info hover:text-info/80 transition-colors"
                              >
                                Devam Et →
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInterviews.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-text-muted text-sm"
                        >
                          Bu filtrede mülakat bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

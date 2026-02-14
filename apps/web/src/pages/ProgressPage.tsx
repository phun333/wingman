import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "@/lib/usePageTitle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createInterview } from "@/lib/api";
import { useInterviewsStore, useJobsStore } from "@/stores";
import { typeLabels, typeColors, hireLabels, difficultyLabels, formatDate, formatFullDate } from "@/lib/constants";
import { JobPaths } from "@/components/JobPaths";
import { TrendingUp, Flame, CheckCircle2, AlertTriangle } from "lucide-react";
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

// ─── Chart color tokens ──────────────────────────────────
const CHART_GRID = "rgba(39, 39, 47, 0.6)";
const CHART_AXIS = "rgba(85, 85, 95, 0.8)";
const CHART_TICK = "rgba(139, 139, 150, 1)";
const CHART_TICK_DIM = "rgba(85, 85, 95, 1)";

// ─── Main Component ──────────────────────────────────────

export function ProgressPage() {
  usePageTitle("İlerleme");
  const navigate = useNavigate();

  // Zustand stores
  const progress = useInterviewsStore((s) => s.progress);
  const interviews = useInterviewsStore((s) => s.allInterviews);
  const fetchAll = useInterviewsStore((s) => s.fetchAll);
  const fetchProgressData = useInterviewsStore((s) => s.fetchProgressData);
  const loadingInterviews = useInterviewsStore((s) => s.loadingAll || s.loadingProgress);

  const jobPaths = useJobsStore((s) => s.paths);
  const removePath = useJobsStore((s) => s.removePath);
  const fetchJobs = useJobsStore((s) => s.fetchData);
  const loadingJobs = useJobsStore((s) => s.loading);

  const progressFetchedAt = useInterviewsStore((s) => s.progressFetchedAt);
  const jobsFetchedAt = useJobsStore((s) => s.fetchedAt);

  // Show loading spinner if data has never been fetched, or is currently loading
  const loading =
    (progressFetchedAt === 0 || loadingInterviews) &&
    (jobsFetchedAt === 0 || loadingJobs);

  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "job-paths">("overview");

  useEffect(() => {
    fetchProgressData();
    fetchJobs();
  }, [fetchProgressData, fetchJobs]);

  if (loading && progressFetchedAt === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
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
    <div className="max-w-5xl mx-auto">
      {/* Header with Tabs */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text">İlerleme</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Mülakat performansın ve zaman içindeki gelişimin
        </p>

        {/* Tab Selector */}
        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-amber/15 text-amber border border-amber/30"
                : "bg-surface-raised text-text-secondary hover:text-text"
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab("job-paths")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "job-paths"
                ? "bg-amber/15 text-amber border border-amber/30"
                : "bg-surface-raised text-text-secondary hover:text-text"
            }`}
          >
            İş İlanı Yolları
            {jobPaths.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber/20 text-xs">
                {jobPaths.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Değerlendirilen", value: progress?.totalEvaluated ?? 0 },
              { label: "Ortalama Skor", value: progress?.averageScore ?? 0 },
              { label: "En Yüksek", value: progress?.highestScore ?? 0 },
              { label: "Bu Ay", value: progress?.thisMonth ?? 0 },
              { label: "Seri", value: progress?.streak ?? 0, icon: Flame },
            ].map((stat) => (
              <Card key={stat.label}>
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium flex items-center gap-1">
                  {stat.label}
                  {"icon" in stat && stat.icon && <stat.icon size={11} className="text-amber" />}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text tabular-nums">
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          {!hasData ? (
            <div className="mt-10">
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-amber/15 border border-amber/30 flex items-center justify-center mb-4">
                  <TrendingUp size={24} className="text-amber" strokeWidth={1.8} />
                </div>
                <p className="text-text-secondary text-sm">
                  Henüz değerlendirilmiş mülakat yok
                </p>
                <p className="text-text-muted text-xs mt-1">
                  Mülakat yap ve rapor oluştur — ilerleme grafiklerini burada göreceksin
                </p>
                <Link
                  to="/dashboard/interview/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 text-sm font-medium text-amber hover:bg-amber/15 transition-colors"
                >
                  İlk Mülakatını Başlat
                </Link>
              </Card>
            </div>
          ) : (
        <>
          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score over time */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-text mb-4">
                Skor Grafiği
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: CHART_TICK, fontSize: 11 }}
                    axisLine={{ stroke: CHART_AXIS }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: CHART_TICK, fontSize: 11 }}
                    axisLine={{ stroke: CHART_AXIS }}
                  />
                  <Tooltip content={<ScoreTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#e5a10e"
                    strokeWidth={2}
                    dot={{ fill: "#e5a10e", r: 4 }}
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
                  <PolarGrid stroke={CHART_GRID} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: CHART_TICK, fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: CHART_TICK_DIM, fontSize: 10 }}
                  />
                  <Radar
                    name="Ortalama"
                    dataKey="value"
                    stroke="#e5a10e"
                    fill="#e5a10e"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Strengths / Weaknesses Cumulative */}
          {(progress?.topStrengths?.length || progress?.topWeaknesses?.length) ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Strengths */}
              {progress?.topStrengths && progress.topStrengths.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-display text-lg font-semibold text-success mb-4 flex items-center gap-2">
                    <CheckCircle2 size={18} /> En Sık Güçlü Yönler
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
                    <AlertTriangle size={18} /> Sık Tekrar Eden Gelişim Alanları
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
            </div>
          ) : null}

          {/* Interview History Table */}
          <div className="mt-8">
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
                      const diffInfo = difficultyLabels[iv.difficulty];
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
                            {diffInfo && (
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${diffInfo.classes}`}>
                                {diffInfo.label}
                              </span>
                            )}
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
          </div>
        </>
      )}
        </>
      ) : (
      /* Job Paths Tab */
      <div className="mt-8">
        <JobPaths
          paths={jobPaths}
          onDeletePath={removePath}
          onStartInterview={async (path, question, category) => {
            try {
              // Fetch fresh interviews to avoid stale data
              const freshInterviews = await fetchAll(true);

              // Check if question already has an in-progress/created interview
              if (question.interviewId) {
                const existing = freshInterviews.find(
                  (iv) =>
                    iv._id === question.interviewId &&
                    (iv.status === "created" || iv.status === "in-progress"),
                );
                if (existing) {
                  navigate(`/interview/${existing._id}`);
                  return;
                }
              }

              // Also check if there's any active interview for this job posting + type combo
              const activeInterview = freshInterviews.find(
                (iv) =>
                  iv.jobPostingId === path.jobPostingId &&
                  iv.type === category.type &&
                  (iv.status === "created" || iv.status === "in-progress"),
              );
              if (activeInterview) {
                navigate(`/interview/${activeInterview._id}`);
                return;
              }

              const interview = await createInterview({
                type: category.type,
                difficulty: question.difficulty,
                language: "tr",
                questionCount: 1,
                jobPostingId: path.jobPostingId,
              });
              navigate(`/interview/${interview._id}`);
            } catch (error) {
              console.error("Failed to create interview:", error);
            }
          }}
        />
      </div>
    )}
    </div>
  );
}

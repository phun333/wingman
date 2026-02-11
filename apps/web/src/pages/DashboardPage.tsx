import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listInterviews, getInterviewStats } from "@/lib/api";
import type { Interview, InterviewStats } from "@ffh/types";

const interviewTypes = [
  {
    id: "live-coding",
    icon: "⌨",
    title: "Live Coding",
    description: "Kod yazma becerilerini gerçek zamanlı test et",
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/20",
  },
  {
    id: "system-design",
    icon: "◎",
    title: "System Design",
    description: "Büyük ölçekli sistem tasarımı soruları",
    color: "text-amber",
    bgColor: "bg-amber/10",
    borderColor: "border-amber/20",
  },
  {
    id: "phone-screen",
    icon: "☎",
    title: "Phone Screen",
    description: "Klasik telefon mülakat simülasyonu",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  {
    id: "practice",
    icon: "◈",
    title: "Practice",
    description: "Serbest pratik yaparak kendini geliştir",
    color: "text-text-secondary",
    bgColor: "bg-surface-raised",
    borderColor: "border-border",
  },
] as const;

const typeLabels: Record<string, string> = {
  "live-coding": "Live Coding",
  "system-design": "System Design",
  "phone-screen": "Phone Screen",
  practice: "Practice",
};

const statusLabels: Record<string, { label: string; variant: "success" | "amber" | "danger" | "default" }> = {
  created: { label: "Oluşturuldu", variant: "default" },
  "in-progress": { label: "Devam Ediyor", variant: "amber" },
  completed: { label: "Tamamlandı", variant: "success" },
  evaluated: { label: "Değerlendirildi", variant: "success" },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatDuration(start?: number, end?: number): string {
  if (!start) return "—";
  const endTs = end ?? Date.now();
  const seconds = Math.floor((endTs - start) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}dk ${s}s`;
}

export function DashboardPage() {
  const { user } = useAuth();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<InterviewStats>({ total: 0, completed: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listInterviews(10).catch(() => [] as Interview[]),
      getInterviewStats().catch(() => ({ total: 0, completed: 0, thisWeek: 0 })),
    ]).then(([interviewList, interviewStats]) => {
      setInterviews(interviewList);
      setStats(interviewStats);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Welcome */}
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-3xl font-bold text-text">
          Merhaba, <span className="text-amber">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="mt-2 text-text-secondary">
          Bugün hangi mülakata hazırlanmak istersin?
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "Toplam Mülakat", value: loading ? "…" : String(stats.total) },
          { label: "Bu Hafta", value: loading ? "…" : String(stats.thisWeek) },
          { label: "Tamamlanan", value: loading ? "…" : String(stats.completed) },
          { label: "Başarı Oranı", value: loading ? "…" : stats.total > 0 ? `%${Math.round((stats.completed / stats.total) * 100)}` : "—" },
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

      {/* Quick Start */}
      <motion.div variants={fadeUp} className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text mb-4">
          Hızlı Başlat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {interviewTypes.map((type) => (
            <Link key={type.id} to={`/interview/new?type=${type.id}`}>
              <Card hover className="flex items-start gap-4 h-full">
                <div
                  className={`h-10 w-10 rounded-lg ${type.bgColor} border ${type.borderColor} flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`text-lg ${type.color}`} aria-hidden="true">
                    {type.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-text">
                    {type.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-text-secondary text-pretty">
                    {type.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Interviews */}
      <motion.div variants={fadeUp} className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text mb-4">
          Son Mülakatlar
        </h2>

        {loading ? (
          <Card className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-4">
              <span className="text-xl text-text-muted" aria-hidden="true">
                ○
              </span>
            </div>
            <p className="text-text-secondary text-sm">
              Henüz mülakat yapmadın
            </p>
            <p className="text-text-muted text-xs mt-1">
              Hemen bir mülakat başlat ve pratik yapmaya başla
            </p>
            <Link
              to="/interview/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 text-sm font-medium text-amber hover:bg-amber/15 transition-colors duration-150"
            >
              <span aria-hidden="true">▶</span>
              İlk Mülakatını Başlat
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {interviews.map((interview) => {
              const statusInfo = statusLabels[interview.status] ?? { label: interview.status, variant: "default" as const };
              return (
                <Link key={interview._id} to={
                  interview.status === "completed" || interview.status === "evaluated"
                    ? `/interview/${interview._id}/report`
                    : `/interview/${interview._id}`
                }>
                  <Card hover className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-text text-sm">
                          {typeLabels[interview.type] ?? interview.type}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDate(interview.createdAt)} · {formatDuration(interview.startedAt, interview.endedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${
                        interview.difficulty === "easy"
                          ? "text-success border-success/30 bg-success/10"
                          : interview.difficulty === "medium"
                            ? "text-amber border-amber/30 bg-amber/10"
                            : "text-danger border-danger/30 bg-danger/10"
                      }`}>
                        {interview.difficulty === "easy" ? "Kolay" : interview.difficulty === "medium" ? "Orta" : "Zor"}
                      </span>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

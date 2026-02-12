import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useInterviewsStore } from "@/stores";
import { typeLabels, statusLabels, difficultyLabels, formatDate, formatDuration } from "@/lib/constants";
import {
  Code2,
  Waypoints,
  Phone,
  Dumbbell,
  Play,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Interview, InterviewStats } from "@ffh/types";

const interviewTypes: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: "live-coding",
    icon: Code2,
    title: "Live Coding",
    description: "Kod yazma becerilerini gerçek zamanlı test et",
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/20",
  },
  {
    id: "system-design",
    icon: Waypoints,
    title: "System Design",
    description: "Büyük ölçekli sistem tasarımı soruları",
    color: "text-amber",
    bgColor: "bg-amber/10",
    borderColor: "border-amber/20",
  },
  {
    id: "phone-screen",
    icon: Phone,
    title: "Phone Screen",
    description: "Klasik telefon mülakat simülasyonu",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Practice",
    description: "Serbest pratik yaparak kendini geliştir",
    color: "text-text-secondary",
    bgColor: "bg-surface-raised",
    borderColor: "border-border",
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DashboardPage() {
  const { user } = useAuth();

  const interviews = useInterviewsStore((s) => s.recentInterviews);
  const stats = useInterviewsStore((s) => s.stats);
  const recentFetchedAt = useInterviewsStore((s) => s.recentFetchedAt);
  const isLoading = useInterviewsStore((s) => s.loadingRecent || s.loadingStats);
  const fetchDashboardData = useInterviewsStore((s) => s.fetchDashboardData);
  // Show loading on first mount (never fetched) or when actively loading
  const loading = recentFetchedAt === 0 || isLoading;

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
          {interviewTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Link key={type.id} to={`/interview/new?type=${type.id}`}>
                <Card hover className="flex items-start gap-4 h-full">
                  <div
                    className={`h-10 w-10 rounded-lg ${type.bgColor} border ${type.borderColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent size={18} className={type.color} strokeWidth={1.8} />
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
            );
          })}
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
              <Circle size={20} className="text-text-muted" strokeWidth={1.5} />
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
              <Play size={14} />
              İlk Mülakatını Başlat
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {interviews.map((interview) => {
              const statusInfo = statusLabels[interview.status] ?? { label: interview.status, variant: "default" as const };
              const diffInfo = difficultyLabels[interview.difficulty];
              return (
                <Link key={interview._id} to={
                  interview.status === "completed" || interview.status === "evaluated" || interview.status === "abandoned"
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
                      {diffInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded-md border ${diffInfo.classes}`}>
                          {diffInfo.label}
                        </span>
                      )}
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

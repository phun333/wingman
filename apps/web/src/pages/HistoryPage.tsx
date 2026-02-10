import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listInterviews } from "@/lib/api";
import type { Interview } from "@ffh/types";

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

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function HistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInterviews(50)
      .then(setInterviews)
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="max-w-4xl mx-auto"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-text">
          Geçmiş Mülakatlar
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tüm mülakat geçmişin burada
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6">
        {loading ? (
          <Card className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-text-secondary text-sm">Henüz mülakat geçmişin yok</p>
            <Link
              to="/interview/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 text-sm font-medium text-amber hover:bg-amber/15 transition-colors duration-150"
            >
              İlk Mülakatını Başlat
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {interviews.map((interview) => {
              const statusInfo = statusLabels[interview.status] ?? { label: interview.status, variant: "default" as const };
              return (
                <motion.div key={interview._id} variants={fadeUp}>
                  <Link to={`/interview/${interview._id}`}>
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
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

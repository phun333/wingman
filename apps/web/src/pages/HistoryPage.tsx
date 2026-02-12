import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useInterviewsStore } from "@/stores";
import { typeLabels, statusLabels, difficultyLabels, formatFullDate, formatDuration } from "@/lib/constants";
import { BarChart3 } from "lucide-react";
import type { Interview } from "@ffh/types";

export function HistoryPage() {
  const interviews = useInterviewsStore((s) => s.allInterviews);
  const allFetchedAt = useInterviewsStore((s) => s.allFetchedAt);
  const isLoading = useInterviewsStore((s) => s.loadingAll);
  const fetchAll = useInterviewsStore((s) => s.fetchAll);
  // Show loading on first mount (never fetched) or when actively loading
  const loading = allFetchedAt === 0 || isLoading;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: '#ededef' }}>
          Geçmiş Mülakatlar
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8b8b96' }}>
          Tüm mülakat geçmişin burada
        </p>
      </div>

      <div className="mt-6">
        {loading ? (
          <Card className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm" style={{ color: '#8b8b96' }}>Henüz mülakat geçmişin yok</p>
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
              const diffInfo = difficultyLabels[interview.difficulty];
              return (
                <div key={interview._id}>
                  <Link to={
                    interview.status === "completed" || interview.status === "evaluated" || interview.status === "abandoned"
                      ? `/interview/${interview._id}/report`
                      : `/interview/${interview._id}`
                  }>
                    <Card hover className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm" style={{ color: '#ededef' }}>
                            {typeLabels[interview.type] ?? interview.type}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#55555f' }}>
                            {formatFullDate(interview.createdAt)} · {formatDuration(interview.startedAt, interview.endedAt)}
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
                        {(interview.status === "completed" || interview.status === "evaluated" || interview.status === "abandoned") && (
                          <BarChart3 size={14} className={interview.status === "abandoned" ? "text-danger" : "text-amber"} />
                        )}
                      </div>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

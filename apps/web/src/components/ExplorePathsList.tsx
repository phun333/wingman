import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Building2,
  Code2,
  MessageSquare,
  Layers,
  CheckCircle,
  Circle,
  MapPin,
  Trash2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import type { ExplorePath } from "@/lib/api";

const typeIcons: Record<string, typeof Code2> = {
  "live-coding": Code2,
  "system-design": Layers,
  "phone-screen": MessageSquare,
};

const typeColors: Record<string, string> = {
  "live-coding": "text-info",
  "system-design": "text-amber",
  "phone-screen": "text-success",
};

const difficultyStyles: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-amber/10 text-amber border-amber/20",
  hard: "bg-danger/10 text-danger border-danger/20",
};

interface ExplorePathsListProps {
  paths: ExplorePath[];
  onStartInterview?: (path: ExplorePath, question: any, category: any) => void;
  onDeletePath?: (id: string) => Promise<void>;
}

export function ExplorePathsList({ paths, onStartInterview, onDeletePath }: ExplorePathsListProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget || !onDeletePath) return;
    setDeleting(true);
    try {
      await onDeletePath(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  if (paths.length === 0) return null;

  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <motion.div
          key={path._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-0 overflow-hidden hover:border-amber/25 transition-all">
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {path.job?.companyLogo ? (
                      <img
                        src={path.job.companyLogo}
                        alt={path.job.company}
                        className="h-6 w-6 rounded object-contain"
                      />
                    ) : (
                      <Building2 size={16} className="text-text-muted" />
                    )}
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {path.job?.company || "Şirket"}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-text leading-tight">
                    {path.title}
                  </h3>
                  {/* Job meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-text-secondary">
                    {path.job?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-text-muted" />
                        {path.job.location}
                      </span>
                    )}
                    {path.job?.workplaceType && (
                      <Badge variant={
                        path.job.workplaceType === "Remote" ? "info" :
                        path.job.workplaceType === "Hybrid" ? "amber" : "default"
                      }>
                        {path.job.workplaceType}
                      </Badge>
                    )}
                    {path.job?.seniorityLevel && (
                      <Badge variant="default">{path.job.seniorityLevel}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {path.job?.applyUrl && (
                    <a
                      href={path.job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-info/10 transition-colors"
                      title="İlana Git"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {onDeletePath && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: path._id, title: path.title })}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      title="Kaldır"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <Progress value={path.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-text-muted whitespace-nowrap tabular-nums">
                  {path.completedQuestions}/{path.totalQuestions} soru
                </span>
                <span className="text-xs font-bold text-amber tabular-nums">
                  {path.progress}%
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {path.categories.map((category, idx) => {
                  const Icon = typeIcons[category.type] || Code2;
                  const color = typeColors[category.type] || "text-text-muted";
                  const completedCount = category.questions.filter((q) => q.completed).length;
                  const totalCount = category.questions.length;

                  return (
                    <div
                      key={idx}
                      className="bg-bg rounded-xl p-3.5 border border-border-subtle"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-surface-raised flex items-center justify-center border border-border-subtle">
                            <Icon size={13} className={color} />
                          </div>
                          <span className="text-sm font-medium text-text">{category.name}</span>
                        </div>
                        <span className="text-xs text-text-muted tabular-nums">
                          {completedCount}/{totalCount}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {category.questions.map((q) => (
                          <div key={q.id} className="flex items-start gap-2">
                            {q.completed ? (
                              <CheckCircle size={13} className="text-success mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle size={13} className="text-text-muted mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs leading-relaxed ${
                                q.completed ? "line-through text-text-muted" : "text-text-secondary"
                              }`}>
                                {q.question}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${difficultyStyles[q.difficulty] || ""}`}>
                                  {q.difficulty}
                                </span>
                                {q.score != null && (
                                  <span className="text-[10px] font-bold text-amber">{q.score}/100</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {completedCount < totalCount && onStartInterview && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextQ = category.questions.find((q) => !q.completed);
                            if (nextQ) onStartInterview(path, nextQ, category);
                          }}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber/10 border border-amber/20 px-3 py-2 text-xs font-medium text-amber hover:bg-amber/15 transition-colors cursor-pointer"
                        >
                          Mülakata Başla
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Kaydedilen İlanı Silmek İstediğine Emin Misin?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" ve tüm ilerleme verileri kalıcı olarak silinecek.`
            : undefined
        }
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

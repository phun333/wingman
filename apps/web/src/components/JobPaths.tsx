import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Code2,
  MessageSquare,
  Layers,
  ChevronRight,
  CheckCircle,
  Circle,
  Briefcase
} from "lucide-react";

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

const typeIcons = {
  "live-coding": Code2,
  "system-design": Layers,
  "phone-screen": MessageSquare,
};

const difficultyColors = {
  easy: "text-success",
  medium: "text-amber",
  hard: "text-error",
};

interface JobPathsProps {
  paths: JobPath[];
  onStartInterview?: (path: JobPath, question: any, category: any) => void;
}

export function JobPaths({ paths, onStartInterview }: JobPathsProps) {
  console.log("JobPaths component - paths:", paths);

  if (paths.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-info/15 border border-info/30 flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-info" strokeWidth={1.8} />
        </div>
        <p className="text-text-secondary text-sm">
          Henüz iş ilanı eklememişsiniz
        </p>
        <p className="text-text-muted text-xs mt-1">
          İş ilanı ekledikten sonra size özel mülakat soruları burada görünecek
        </p>
        <Link
          to="/settings"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-info/10 border border-info/20 px-4 py-2 text-sm font-medium text-info hover:bg-info/15 transition-colors"
        >
          İş İlanı Ekle
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {paths.map((path) => (
        <motion.div
          key={path._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="group"
        >
          <Card className="p-6 hover:border-amber/30 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-text-muted" />
                  <h3 className="font-display text-lg font-semibold text-text">
                    {path.title}
                  </h3>
                </div>
                {path.job?.level && (
                  <Badge variant="default">
                    {path.job.level}
                  </Badge>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {path.description}
                </p>
              </div>
              <Link
                to={`/job-path/${path._id}`}
                className="flex items-center gap-1 text-xs text-amber hover:text-amber/80 transition-colors"
              >
                Detaylar
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">
                  İlerleme: {path.completedQuestions} / {path.totalQuestions} soru
                </span>
                <span className="text-xs font-semibold text-amber">
                  {path.progress}%
                </span>
              </div>
              <Progress value={path.progress} className="h-2" />
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {path.categories.map((category, idx) => {
                const Icon = typeIcons[category.type];
                const completedCount = category.questions.filter(q => q.completed).length;
                const totalCount = category.questions.length;
                const categoryProgress = totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0;

                return (
                  <div
                    key={idx}
                    className="bg-surface-raised rounded-lg p-3 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className="text-text-muted" />
                      <span className="text-sm font-medium text-text">
                        {category.name}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {category.questions.slice(0, 3).map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-2 text-xs"
                        >
                          {q.completed ? (
                            <CheckCircle size={12} className="text-success mt-0.5" />
                          ) : (
                            <Circle size={12} className="text-text-muted mt-0.5" />
                          )}
                          <span className={`flex-1 ${q.completed ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
                            {q.question.length > 50
                              ? q.question.substring(0, 50) + "..."
                              : q.question}
                          </span>
                          {q.score && (
                            <span className="text-amber font-semibold">
                              {q.score}
                            </span>
                          )}
                        </div>
                      ))}
                      {category.questions.length > 3 && (
                        <div className="text-xs text-text-muted pl-4">
                          +{category.questions.length - 3} soru daha
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {completedCount}/{totalCount} tamamlandı
                        </span>
                        {completedCount < totalCount && onStartInterview && (
                          <button
                            onClick={() => {
                              const nextQuestion = category.questions.find(q => !q.completed);
                              if (nextQuestion) {
                                onStartInterview(path, nextQuestion, category);
                              }
                            }}
                            className="text-xs text-amber hover:text-amber/80 transition-colors"
                          >
                            Başla →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Average Score */}
            {path.categories.some(c => c.questions.some(q => q.score)) && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    Ortalama Skor
                  </span>
                  <span className="font-display text-lg font-bold text-amber">
                    {Math.round(
                      path.categories
                        .flatMap(c => c.questions)
                        .filter(q => q.score)
                        .reduce((acc, q) => acc + (q.score || 0), 0) /
                      path.categories
                        .flatMap(c => c.questions)
                        .filter(q => q.score).length
                    )}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
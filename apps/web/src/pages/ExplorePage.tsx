import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/lib/usePageTitle";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Briefcase,
  MapPin,
  Building2,
  ExternalLink,
  Globe,
  ChevronDown,
  Sparkles,
  Code2,
  Layers,
  MessageSquare,
  CheckCircle,
  Circle,
  ArrowRight,
  X,
  Filter,
  Clock,
  Users,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useExploreStore } from "@/stores";
import type { ScrapedJob, ExplorePath } from "@/lib/api";

// ─── Constants ───────────────────────────────────────────

const WORKPLACE_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Onsite", label: "Onsite" },
];

const SENIORITY_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "Entry Level", label: "Entry" },
  { value: "Mid Level", label: "Mid" },
  { value: "Senior Level", label: "Senior" },
];

const PAGE_SIZE = 20;

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

// ─── Helpers ─────────────────────────────────────────────

function timeAgo(ms?: number): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
}

function workplaceBadgeVariant(type: string) {
  if (type === "Remote") return "info" as const;
  if (type === "Hybrid") return "amber" as const;
  return "default" as const;
}

// ─── Component ───────────────────────────────────────────

export function ExplorePage() {
  usePageTitle("İş Keşfet");
  const navigate = useNavigate();

  const {
    jobs,
    stats,
    filters,
    loading,
    paths: _paths,
    creatingPathFor,
    setFilters,
    fetchJobs,
    fetchStats,
    fetchPaths,
    startPath,
    getPathForJob,
  } = useExploreStore();

  const [searchInput, setSearchInput] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchPaths();
  }, [fetchStats, fetchJobs, fetchPaths]);

  // Debounced search — 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ q: searchInput });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, setFilters]);

  // Refetch when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchJobs();
  }, [filters.q, filters.workplaceType, filters.seniorityLevel, filters.category, fetchJobs]);

  async function handleStartPath(jobId: string) {
    try {
      await startPath(jobId);
      setExpandedJobId(jobId);
    } catch (e) {
      console.error("Path creation failed:", e);
    }
  }

  function handleStartInterview(path: ExplorePath, categoryType: string) {
    navigate(`/dashboard/interview/new?type=${categoryType}&explorePathId=${path._id}`);
  }

  const visibleJobs = jobs.slice(0, visibleCount);
  const hasMore = visibleCount < jobs.length;
  const activeFilterCount = [filters.workplaceType, filters.seniorityLevel, filters.category].filter(Boolean).length;

  const statCards = useMemo(() => {
    if (!stats) return null;
    return [
      { icon: Briefcase, label: "İlan", value: stats.total, color: "text-amber" },
      { icon: Building2, label: "Şirket", value: stats.companies, color: "text-info" },
      { icon: Globe, label: "Remote", value: stats.byWorkplace?.["Remote"] ?? 0, color: "text-success" },
      { icon: TrendingUp, label: "Kategori", value: stats.categories, color: "text-amber" },
    ];
  }, [stats]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Header + Stats inline ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-info/15 border border-info/25 flex items-center justify-center">
            <Search size={20} className="text-info" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text">İş Keşfet</h1>
            <p className="text-sm text-text-secondary">
              {stats
                ? `${stats.total.toLocaleString("tr-TR")} ilan · ${stats.companies} şirket`
                : "Yükleniyor..."}
            </p>
          </div>
        </div>

        {statCards && (
          <div className="hidden md:flex items-center gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon size={14} className={s.color} />
                <span className="text-sm font-semibold text-text tabular-nums">{s.value.toLocaleString("tr-TR")}</span>
                <span className="text-xs text-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Search + Filters ─── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pozisyon veya şirket ara... (ör. React, Google, DevOps)"
              className="w-full h-11 rounded-lg border border-border bg-surface pl-10 pr-10 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-3.5 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? "bg-info/10 text-info border-info/30"
                : "bg-surface-raised text-text-secondary border-border hover:border-border-subtle"
            }`}
          >
            <Filter size={14} />
            Filtre
            {activeFilterCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-info text-bg text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Çalışma Şekli</label>
                  <div className="flex gap-1.5">
                    {WORKPLACE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilters({ workplaceType: opt.value })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          filters.workplaceType === opt.value
                            ? "bg-info/15 text-info border border-info/30"
                            : "bg-surface border border-border text-text-secondary hover:text-text"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Seviye</label>
                  <div className="flex gap-1.5">
                    {SENIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilters({ seniorityLevel: opt.value })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          filters.seniorityLevel === opt.value
                            ? "bg-info/15 text-info border border-info/30"
                            : "bg-surface border border-border text-text-secondary hover:text-text"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setFilters({ workplaceType: "", seniorityLevel: "", category: "" })}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    >
                      <X size={12} className="inline mr-1" />
                      Temizle
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Loading Skeleton ─── */}
      {loading && jobs.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-surface p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="hidden sm:block h-11 w-11 rounded-xl bg-surface-raised" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-32 bg-surface-raised rounded" />
                  <div className="h-4 w-64 bg-surface-raised rounded" />
                  <div className="h-3 w-48 bg-surface-raised rounded" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-surface-raised rounded-md" />
                    <div className="h-5 w-14 bg-surface-raised rounded-md" />
                    <div className="h-5 w-20 bg-surface-raised rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && jobs.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={28} className="text-text-muted mb-3" strokeWidth={1.5} />
          <h2 className="font-display text-base font-semibold text-text mb-1">Sonuç bulunamadı</h2>
          <p className="text-sm text-text-secondary">Farklı anahtar kelimeler veya filtreler deneyin</p>
        </Card>
      )}

      {/* ─── Job Cards ─── */}
      {visibleJobs.length > 0 && (
        <div className="space-y-3">
          {visibleJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              path={getPathForJob(job._id)}
              isExpanded={expandedJobId === job._id}
              isCreatingPath={creatingPathFor === job._id}
              onToggleExpand={() => setExpandedJobId(expandedJobId === job._id ? null : job._id)}
              onStartPath={() => handleStartPath(job._id)}
              onStartInterview={(categoryType) => {
                const path = getPathForJob(job._id);
                if (path) handleStartInterview(path, categoryType);
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Load More ─── */}
      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            <ChevronDown size={15} className="mr-1" />
            Daha fazla göster ({jobs.length - visibleCount} kaldı)
          </Button>
        </div>
      )}

      {/* ─── Results count ─── */}
      {!loading && jobs.length > 0 && (
        <div className="text-center pb-2">
          <p className="text-xs text-text-muted">
            {visibleJobs.length}/{jobs.length} ilan gösteriliyor
          </p>
        </div>
      )}
    </div>
  );
}

// ─── JobCard ─────────────────────────────────────────────

interface JobCardProps {
  job: ScrapedJob;
  path?: ExplorePath;
  isExpanded: boolean;
  isCreatingPath: boolean;
  onToggleExpand: () => void;
  onStartPath: () => void;
  onStartInterview: (categoryType: string) => void;
}

function JobCard({
  job,
  path,
  isExpanded,
  isCreatingPath,
  onToggleExpand,
  onStartPath,
  onStartInterview,
}: JobCardProps) {
  return (
    <Card className="p-0 overflow-hidden hover:border-info/20 transition-all duration-200">
      {/* ─ Main Row ─ */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Company Logo / Initials */}
          <div className="hidden sm:flex h-11 w-11 rounded-xl bg-surface-raised border border-border-subtle items-center justify-center flex-shrink-0 overflow-hidden">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <span className={`text-sm font-bold text-text-muted ${job.companyLogo ? "hidden" : ""}`}>
              {job.company.slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {job.company}
              </span>
              {job.companyIndustry && (
                <span className="text-[10px] text-text-muted">· {job.companyIndustry}</span>
              )}
            </div>

            <h3 className="font-display text-base font-semibold text-text leading-tight mb-2">
              {job.title}
            </h3>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-text-secondary mb-3">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} className="text-text-muted" />
                  {job.location}
                </span>
              )}
              {job.seniorityLevel && (
                <span className="inline-flex items-center gap-1">
                  <Users size={11} className="text-text-muted" />
                  {job.seniorityLevel}
                </span>
              )}
              {job.commitment.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} className="text-text-muted" />
                  {job.commitment.join(", ")}
                </span>
              )}
              {job.publishedAt && (
                <span className="text-text-muted">{timeAgo(job.publishedAt)}</span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={workplaceBadgeVariant(job.workplaceType)}>
                {job.workplaceType}
              </Badge>
              {job.skills.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="default">{skill}</Badge>
              ))}
              {job.skills.length > 5 && (
                <Badge variant="default">+{job.skills.length - 5}</Badge>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {path ? (
              <div className="text-right">
                <div className="text-xs font-bold text-amber tabular-nums">{path.progress}%</div>
                <div className="text-[10px] text-text-muted">hazırlık</div>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onStartPath(); }}
                loading={isCreatingPath}
                loadingText="..."
                className="text-xs"
              >
                <Sparkles size={12} className="mr-1" />
                Hazırlan
              </Button>
            )}

            <button
              type="button"
              onClick={onToggleExpand}
              className="text-[11px] text-text-muted hover:text-info flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              {isExpanded ? "Kapat" : "Detay"}
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Progress bar if has path */}
        {path && (
          <div className="mt-3 pt-3 border-t border-border-subtle/50">
            <div className="flex items-center gap-3">
              <Progress value={path.progress} className="h-1.5 flex-1" />
              <span className="text-[10px] text-text-muted whitespace-nowrap">
                {path.completedQuestions}/{path.totalQuestions} soru
              </span>
              <div className="flex gap-2">
                {path.categories.map((cat) => {
                  const Icon = typeIcons[cat.type];
                  const color = typeColors[cat.type];
                  const done = cat.questions.filter((q) => q.completed).length;
                  return (
                    <span key={cat.type} className="inline-flex items-center gap-1 text-[10px] text-text-muted" title={cat.name}>
                      <Icon size={10} className={color} />
                      {done}/{cat.questions.length}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─ Expanded Detail ─ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle">
              <div className="px-5 pt-4 pb-3 space-y-4">
                {/* Salary info */}
                {job.isCompensationTransparent && job.salaryMin && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={14} className="text-success" />
                    <span className="text-text">
                      {job.salaryCurrency ?? "$"}{job.salaryMin.toLocaleString()}
                      {job.salaryMax ? ` – ${job.salaryMax.toLocaleString()}` : ""}
                      {job.salaryFrequency ? ` / ${job.salaryFrequency}` : ""}
                    </span>
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && (
                  <div>
                    <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Gereksinimler</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{job.requirements}</p>
                  </div>
                )}

                {/* All Skills */}
                {job.skills.length > 5 && (
                  <div>
                    <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Tüm Beceriler</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s) => <Badge key={s} variant="default">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {/* External links */}
                <div className="flex items-center gap-3">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-info hover:text-info/80 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Orijinal İlana Git
                  </a>
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
                    >
                      <Globe size={12} />
                      {job.company} Website
                    </a>
                  )}
                </div>

                {/* Start Path CTA */}
                {!path && (
                  <div className="pt-2">
                    <Button
                      onClick={onStartPath}
                      loading={isCreatingPath}
                      loadingText="Hazırlanıyor..."
                      className="w-full"
                    >
                      <Sparkles size={16} className="mr-2" />
                      Bu İlan İçin Mülakat Yol Haritası Oluştur
                    </Button>
                  </div>
                )}
              </div>

              {/* Interview Path */}
              {path && (
                <div className="px-5 pb-5">
                  <h4 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
                    Mülakat Yol Haritası
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {path.categories.map((category, idx) => {
                      const Icon = typeIcons[category.type];
                      const color = typeColors[category.type];
                      const completedCount = category.questions.filter((q) => q.completed).length;
                      const totalCount = category.questions.length;

                      return (
                        <div key={idx} className="bg-bg rounded-xl p-3.5 border border-border-subtle">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-surface-raised flex items-center justify-center border border-border-subtle">
                                <Icon size={13} className={color} />
                              </div>
                              <span className="text-sm font-medium text-text">{category.name}</span>
                            </div>
                            <span className="text-xs text-text-muted tabular-nums">{completedCount}/{totalCount}</span>
                          </div>

                          <div className="space-y-2.5">
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
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${difficultyStyles[q.difficulty]}`}>
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

                          {completedCount < totalCount && (
                            <button
                              type="button"
                              onClick={() => onStartInterview(category.type)}
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

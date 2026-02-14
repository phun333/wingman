import { useEffect, useState, useMemo } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { useInterviewsStore } from "@/stores";
import { useTour } from "@/lib/useTour";
import {
  typeLabels,
  statusLabels,
  difficultyLabels,
  formatDate,
  formatDuration,
} from "@/lib/constants";
import {
  Code2,
  Waypoints,
  Phone,
  Dumbbell,
  Play,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Target,
  Zap,
  ChevronRight,
  Mic,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "İyi geceler", emoji: "🌙" };
  if (hour < 12) return { text: "Günaydın", emoji: "☀️" };
  if (hour < 18) return { text: "İyi günler", emoji: "👋" };
  return { text: "İyi akşamlar", emoji: "🌆" };
}

const motivationalMessages = [
  "Bugün bir adım daha ileri git!",
  "Her pratik seni hedefe yaklaştırır!",
  "Kodlama kaslarını çalıştırma vakti!",
  "Başarı hazırlığın eseridir!",
  "Bugünkü mülakatın yarının teklifi olabilir!",
];

function getMotivationalMessage(): string {
  const day = new Date().getDate();
  return motivationalMessages[day % motivationalMessages.length]!;
}

// ─── Animated Counter ────────────────────────────────────

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

// ─── Suggestion Chips ────────────────────────────────────

const suggestions: {
  label: string;
  icon: LucideIcon;
  to: string;
  color: string;
}[] = [
  {
    label: "Live Coding başlat",
    icon: Code2,
    to: "/dashboard/interview/new?type=live-coding",
    color: "text-info",
  },
  {
    label: "System Design pratiği",
    icon: Waypoints,
    to: "/dashboard/interview/new?type=system-design",
    color: "text-amber",
  },
  {
    label: "Phone Screen simülasyonu",
    icon: Phone,
    to: "/dashboard/interview/new?type=phone-screen",
    color: "text-success",
  },
  {
    label: "Serbest pratik yap",
    icon: Dumbbell,
    to: "/dashboard/interview/new?type=practice",
    color: "text-text-secondary",
  },
];

// ─── Interview Type Cards ────────────────────────────────

const interviewTypes: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  borderHover: string;
  tag: string;
}[] = [
  {
    id: "live-coding",
    icon: Code2,
    title: "Live Coding",
    description: "Algoritmik problemleri gerçek zamanlı çöz",
    gradient: "from-info/8 to-transparent",
    iconBg: "bg-info/15 text-info",
    borderHover: "hover:border-info/40",
    tag: "En Popüler",
  },
  {
    id: "system-design",
    icon: Waypoints,
    title: "System Design",
    description: "Büyük ölçekli sistem mimarisi tasarla, whiteboard destekli",
    gradient: "from-amber/8 to-transparent",
    iconBg: "bg-amber/15 text-amber",
    borderHover: "hover:border-amber/40",
    tag: "Senior Seviye",
  },
  {
    id: "phone-screen",
    icon: Phone,
    title: "Phone Screen",
    description: "Sesli mülakat simülasyonu, gerçekçi deneyim",
    gradient: "from-success/8 to-transparent",
    iconBg: "bg-success/15 text-success",
    borderHover: "hover:border-success/40",
    tag: "Sesli",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Serbest Pratik",
    description: "Stressiz ortamda kendini geliştir, ipucu al",
    gradient: "from-text-muted/5 to-transparent",
    iconBg: "bg-surface-raised text-text-secondary",
    borderHover: "hover:border-text-muted/40",
    tag: "Rahat Mod",
  },
];

// ─── Stagger Animations ─────────────────────────────────

const cubicEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: cubicEase },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: cubicEase },
  },
};

// ─── Typing Text ─────────────────────────────────────────

const placeholderTexts = [
  "Bugün hangi konuda pratik yapmak istersin?",
  "Two Sum çözmeye ne dersin?",
  "System Design mülakatına hazır mısın?",
  "Bir phone screen simülasyonu yapalım mı?",
  "Zorlu bir algoritma sorusu deneyelim mi?",
];

function TypingPlaceholder() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = placeholderTexts[textIndex]!;
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex < current.length) {
      timeout = setTimeout(
        () => setCharIndex((c) => c + 1),
        40 + Math.random() * 30,
      );
    } else if (!isDeleting && charIndex === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((c) => c - 1), 20);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((i) => (i + 1) % placeholderTexts.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <span className="text-text-muted pointer-events-none select-none">
      {placeholderTexts[textIndex]!.substring(0, charIndex)}
      <span className="animate-pulse text-amber">|</span>
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────

export function DashboardPage() {
  usePageTitle("Dashboard");
  useTour();
  const { user } = useAuth();
  const navigate = useNavigate();

  const interviews = useInterviewsStore((s) => s.recentInterviews);
  const stats = useInterviewsStore((s) => s.stats);
  const recentFetchedAt = useInterviewsStore((s) => s.recentFetchedAt);
  const isLoading = useInterviewsStore(
    (s) => s.loadingRecent || s.loadingStats,
  );
  const fetchDashboardData = useInterviewsStore((s) => s.fetchDashboardData);
  const loading = recentFetchedAt === 0 || isLoading;

  const greeting = useMemo(getGreeting, []);
  const motivational = useMemo(getMotivationalMessage, []);
  const firstName = user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const successRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="relative z-10">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto space-y-10"
      >
        {/* ───────── Hero Section ───────── */}
        <motion.div variants={fadeUp} className="pt-2">
          {/* Greeting */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber/8 border border-amber/15 mb-5"
            >
              <Sparkles size={13} className="text-amber" />
              <span className="text-xs text-amber font-medium tracking-wide">
                {motivational}
              </span>
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
              {greeting.text},{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber via-amber-light to-amber bg-clip-text text-transparent">
                  {firstName}
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-amber/60 via-amber to-amber/60 rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </span>
            </h1>
            <p className="mt-3 text-text-secondary text-lg max-w-lg mx-auto">
              İstediğin işe bugün bir adım daha yaklaş!
            </p>
          </div>

          {/* Central Prompt Bar */}
          <motion.div variants={scaleIn} className="relative max-w-2xl mx-auto">
            <div
              id="tour-start-interview"
              className="group relative rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm
                         hover:border-amber/30 transition-all duration-300 cursor-pointer
                         hover:shadow-[0_0_40px_rgba(229,161,14,0.06)]"
              onClick={() => navigate("/dashboard/interview/new")}
            >
              {/* Glow ring on hover */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-amber/0 via-amber/10 to-amber/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber/10 border border-amber/20 shrink-0 group-hover:bg-amber/15 transition-colors">
                  <Play size={16} className="text-amber ml-0.5" />
                </div>
                <div className="flex-1 min-w-0 text-base">
                  <TypingPlaceholder />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-text-muted">
                    <Mic size={12} />
                    <span>Sesli</span>
                  </div>
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-amber text-bg group-hover:glow-amber transition-all duration-300">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <motion.div
              variants={stagger}
              className="flex flex-wrap items-center justify-center gap-2 mt-4"
            >
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.label} variants={fadeUp}>
                    <Link
                      to={s.to}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-subtle bg-surface/60
                                 text-xs font-medium text-text-secondary hover:text-text hover:border-amber/30
                                 hover:bg-surface-raised/80 transition-all duration-200 backdrop-blur-sm group/chip"
                    >
                      <Icon
                        size={13}
                        strokeWidth={2}
                        className={`${s.color} opacity-70 group-hover/chip:opacity-100 transition-opacity`}
                      />
                      {s.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ───────── Stats Row ───────── */}
        <motion.div variants={fadeUp}>
          <div id="tour-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Target,
                label: "Toplam Mülakat",
                value: stats.total,
                color: "text-info",
                bg: "bg-info/8",
                border: "border-info/15",
              },
              {
                icon: Flame,
                label: "Bu Hafta",
                value: stats.thisWeek,
                color: "text-amber",
                bg: "bg-amber/8",
                border: "border-amber/15",
              },
              {
                icon: Trophy,
                label: "Tamamlanan",
                value: stats.completed,
                color: "text-success",
                bg: "bg-success/8",
                border: "border-success/15",
              },
              {
                icon: TrendingUp,
                label: "Başarı Oranı",
                value: successRate,
                suffix: "%",
                color: "text-amber-light",
                bg: "bg-amber/8",
                border: "border-amber/15",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-xl border ${stat.border} ${stat.bg} p-4 overflow-hidden group/stat`}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

                  <div className="relative flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center h-9 w-9 rounded-lg ${stat.bg} ${stat.color}`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">
                        {stat.label}
                      </p>
                      <p className="font-display text-2xl font-bold text-text mt-0.5">
                        {loading ? (
                          <span className="inline-block w-8 h-6 rounded bg-surface-raised animate-pulse" />
                        ) : stat.value === 0 &&
                          stat.label === "Başarı Oranı" &&
                          stats.total === 0 ? (
                          "—"
                        ) : (
                          <AnimatedCounter
                            value={stat.value}
                            suffix={
                              "suffix" in stat ? (stat.suffix as string) : ""
                            }
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ───────── Interview Types ───────── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text">
              Mülakat Başlat
            </h2>
            <Link
              to="/dashboard/interview/new"
              className="text-xs text-text-muted hover:text-amber transition-colors flex items-center gap-1 group/link"
            >
              Tümünü gör
              <ChevronRight
                size={12}
                className="group-hover/link:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {interviewTypes.map((type) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.id}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25 }}
                >
                  <Link
                    to={`/dashboard/interview/new?type=${type.id}`}
                    className={`relative block rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm
                               ${type.borderHover} transition-all duration-300 overflow-hidden group/card
                               hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}
                  >
                    {/* Background gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover/card:opacity-100 transition-opacity duration-500`}
                    />

                    <div className="relative p-5 flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center h-11 w-11 rounded-xl ${type.iconBg}
                                    shrink-0 transition-transform duration-300 group-hover/card:scale-110`}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-text">
                            {type.title}
                          </h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-raised/80 text-text-muted border border-border-subtle/50 font-medium">
                            {type.tag}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary text-pretty leading-relaxed">
                          {type.description}
                        </p>
                      </div>

                      <div className="shrink-0 mt-1 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-1 group-hover/card:translate-x-0">
                        <ArrowRight size={16} className="text-text-muted" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ───────── Recent Activity ───────── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text">
              Son Aktivite
            </h2>
            {interviews.length > 0 && (
              <Link
                to="/dashboard/history"
                className="text-xs text-text-muted hover:text-amber transition-colors flex items-center gap-1 group/link"
              >
                Tüm geçmiş
                <ChevronRight
                  size={12}
                  className="group-hover/link:translate-x-0.5 transition-transform"
                />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-border-subtle bg-surface/60 p-8 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
                <span className="text-sm text-text-muted">Yükleniyor...</span>
              </div>
            </div>
          ) : interviews.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {interviews.slice(0, 5).map((interview, i) => (
                <RecentInterviewCard
                  key={interview._id}
                  interview={interview}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </motion.div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative rounded-2xl border border-dashed border-border bg-surface/40 overflow-hidden"
    >
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center">
        <motion.div
          className="h-16 w-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-5"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap size={28} className="text-amber" />
        </motion.div>
        <h3 className="font-display text-lg font-semibold text-text mb-2">
          İlk adımı at
        </h3>
        <p className="text-sm text-text-secondary max-w-sm mb-6">
          Henüz bir mülakat yapmadın. Hemen başla ve AI destekli mülakat
          deneyimini keşfet!
        </p>
        <Link
          to="/dashboard/interview/new"
          className="inline-flex items-center gap-2.5 rounded-xl bg-amber text-bg px-6 py-3 text-sm font-semibold
                     hover:bg-amber-light transition-colors duration-200 glow-amber-sm hover:glow-amber group/cta"
        >
          <Play
            size={16}
            className="group-hover/cta:scale-110 transition-transform"
          />
          İlk Mülakatını Başlat
          <ArrowRight
            size={14}
            className="group-hover/cta:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Recent Interview Card ───────────────────────────────

function RecentInterviewCard({
  interview,
  index,
}: {
  interview: any;
  index: number;
}) {
  const statusInfo = statusLabels[interview.status] ?? {
    label: interview.status,
    variant: "default" as const,
  };
  const diffInfo = difficultyLabels[interview.difficulty];

  const typeIcons: Record<string, LucideIcon> = {
    "live-coding": Code2,
    "system-design": Waypoints,
    "phone-screen": Phone,
    practice: Dumbbell,
  };

  const typeIconColors: Record<string, string> = {
    "live-coding": "text-info bg-info/10",
    "system-design": "text-amber bg-amber/10",
    "phone-screen": "text-success bg-success/10",
    practice: "text-text-secondary bg-surface-raised",
  };

  const Icon = typeIcons[interview.type] ?? Code2;
  const iconClasses =
    typeIconColors[interview.type] ?? "text-text-secondary bg-surface-raised";

  const href =
    interview.status === "completed" ||
    interview.status === "evaluated" ||
    interview.status === "abandoned"
      ? `/interview/${interview._id}/report`
      : `/interview/${interview._id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={href}>
        <div
          className="group/row flex items-center gap-4 rounded-xl border border-border-subtle/60 bg-surface/60 backdrop-blur-sm
                     px-4 py-3.5 hover:border-amber/25 hover:bg-surface/90 transition-all duration-200 cursor-pointer"
        >
          {/* Type icon */}
          <div
            className={`flex items-center justify-center h-9 w-9 rounded-lg ${iconClasses} shrink-0`}
          >
            <Icon size={16} strokeWidth={1.8} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-text group-hover/row:text-amber transition-colors">
                {typeLabels[interview.type] ?? interview.type}
              </span>
              {interview.status === "in-progress" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock size={10} />
                {formatDate(interview.createdAt)}
              </span>
              <span className="text-text-muted/30">·</span>
              <span className="text-xs text-text-muted">
                {formatDuration(interview.startedAt, interview.endedAt)}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {diffInfo && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md border ${diffInfo.classes} font-medium`}
              >
                {diffInfo.label}
              </span>
            )}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <ChevronRight
              size={14}
              className="text-text-muted/50 group-hover/row:text-amber group-hover/row:translate-x-0.5 transition-all ml-1"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

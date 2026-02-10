import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

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
          { label: "Toplam Mülakat", value: "0" },
          { label: "Bu Hafta", value: "0" },
          { label: "Ortalama Skor", value: "—" },
          { label: "Seri", value: "0 gün" },
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

      {/* Empty state — Recent Interviews */}
      <motion.div variants={fadeUp} className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text mb-4">
          Son Mülakatlar
        </h2>
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
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Card } from "./Card";
import { Flame, Calendar, Trophy, Target } from "lucide-react";
import { getDailyActivity, type DailyActivity } from "@/lib/api";

const THEME = {
  dark: [
    "rgba(255, 255, 255, 0.04)", // level 0 — boş gün
    "rgba(229, 161, 14, 0.25)",  // level 1 — 1 soru
    "rgba(229, 161, 14, 0.45)",  // level 2 — 2 soru
    "rgba(229, 161, 14, 0.65)",  // level 3 — 3-4 soru
    "rgba(229, 161, 14, 0.9)",   // level 4 — 5+ soru
  ],
};

export function StreakHeatmap() {
  const [data, setData] = useState<DailyActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyActivity()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (!data || data.activity.length === 0) {
    return (
      <Card>
        <h2 className="font-display font-semibold text-text mb-3">
          <Flame size={16} className="inline mr-1.5 text-amber" /> Günlük Seri
        </h2>
        <p className="text-sm text-text-secondary">
          Henüz aktivite verisi yok. Mülakat tamamladıkça burada günlük serin görünecek.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display font-semibold text-text mb-4">
        <Flame size={16} className="inline mr-1.5 text-amber" /> Günlük Seri
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            icon: Flame,
            label: "Mevcut Seri",
            value: `${data.currentStreak} gün`,
            highlight: data.currentStreak > 0,
          },
          {
            icon: Trophy,
            label: "En Uzun Seri",
            value: `${data.longestStreak} gün`,
            highlight: false,
          },
          {
            icon: Calendar,
            label: "Aktif Gün",
            value: String(data.totalActiveDays),
            highlight: false,
          },
          {
            icon: Target,
            label: "Toplam Çözüm",
            value: String(data.totalSolved),
            highlight: false,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-3 ${
              stat.highlight
                ? "bg-amber/10 border-amber/25"
                : "bg-surface-raised border-border-subtle"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon
                size={12}
                className={stat.highlight ? "text-amber" : "text-text-muted"}
              />
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
            <p
              className={`font-display text-lg font-bold tabular-nums ${
                stat.highlight ? "text-amber" : "text-text"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <ActivityCalendar
          data={data.activity}
          theme={{ dark: THEME.dark }}
          colorScheme="dark"
          blockSize={12}
          blockMargin={3}
          blockRadius={3}
          fontSize={12}
          showTotalCount={false}
          labels={{
            months: [
              "Oca", "Şub", "Mar", "Nis", "May", "Haz",
              "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
            ],
            weekdays: ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
            totalCount: "{{count}} mülakat tamamlandı",
            legend: {
              less: "Az",
              more: "Çok",
            },
          }}
          renderBlock={(block, activity) => (
            <g>
              <title>
                {activity.count === 0
                  ? `${activity.date} — aktivite yok`
                  : `${activity.date} — ${activity.count} mülakat`}
              </title>
              {block}
            </g>
          )}
        />
      </div>
    </Card>
  );
}

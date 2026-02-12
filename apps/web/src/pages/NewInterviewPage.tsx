import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createInterview, startInterview } from "@/lib/api";
import { Code2, Waypoints, Phone, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InterviewType, Difficulty } from "@ffh/types";

const types: {
  id: InterviewType;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    id: "live-coding",
    icon: Code2,
    title: "Live Coding",
    desc: "Algoritmik problemleri gerçek zamanlı çöz",
  },
  {
    id: "system-design",
    icon: Waypoints,
    title: "System Design",
    desc: "Büyük ölçekli sistemler tasarla",
  },
  {
    id: "phone-screen",
    icon: Phone,
    title: "Phone Screen",
    desc: "Teknik telefon mülakatı simülasyonu",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Practice",
    desc: "Serbest pratik, stressiz ortam",
  },
];

const difficulties: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Kolay", color: "text-success border-success/30 bg-success/10" },
  { id: "medium", label: "Orta", color: "text-amber border-amber/30 bg-amber/10" },
  { id: "hard", label: "Zor", color: "text-danger border-danger/30 bg-danger/10" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function NewInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("type") as InterviewType | null;

  const [selectedType, setSelectedType] = useState<InterviewType | null>(
    preselected || "live-coding", // Default to live-coding for testing
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(1);
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "typescript" | "python">("javascript");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!selectedType) return;
    setLoading(true);
    setError(null);

    try {
      const interview = await createInterview({
        type: selectedType,
        difficulty,
        language: "tr",
        questionCount,
        codeLanguage: (selectedType === "live-coding" || selectedType === "practice") ? codeLanguage : undefined,
      });

      // Start the interview immediately
      await startInterview(interview._id);

      navigate(`/interview/${interview._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mülakat oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-3xl mx-auto"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-text">
          Yeni Mülakat
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Mülakat türünü ve ayarlarını seç
        </p>
      </motion.div>

      {/* Step 1 — Type */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Mülakat Türü
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map((t) => {
            const IconComponent = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`
                  text-left rounded-xl border p-4 transition-all duration-150 cursor-pointer
                  ${
                    selectedType === t.id
                      ? "border-amber bg-amber/5 glow-amber-sm"
                      : "border-border-subtle bg-surface hover:border-border"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <IconComponent
                    size={20}
                    strokeWidth={1.8}
                    className={selectedType === t.id ? "text-amber" : "text-text-secondary"}
                  />
                  <div>
                    <p className="font-display font-semibold text-text">
                      {t.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 2 — Difficulty */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Zorluk
        </h2>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`
                rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer
                ${difficulty === d.id ? d.color : "border-border bg-surface text-text-secondary hover:border-border"}
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Step 3 — Code Language (for Live Coding and Practice) */}
      {(selectedType === "live-coding" || selectedType === "practice") && (
        <motion.div
          key={`code-lang-${selectedType}`}
          variants={fadeUp}
          className="mt-8"
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
            Kod Dili
          </h2>
          <div className="flex gap-2">
            {[
              { id: "javascript" as const, label: "JavaScript", icon: "🟨" },
              { id: "typescript" as const, label: "TypeScript", icon: "🔷" },
              { id: "python" as const, label: "Python", icon: "🐍" },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setCodeLanguage(lang.id)}
                className={`
                  rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center gap-2
                  ${codeLanguage === lang.id ? "border-amber bg-amber/10 text-amber" : "border-border-subtle bg-surface text-text-secondary hover:border-border"}
                `}
              >
                <span>{lang.icon}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 4 — Question count */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Soru Sayısı
        </h2>
        <div className="flex gap-2">
          {[1, 3, 5, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuestionCount(n)}
              className={`
                rounded-lg border px-4 py-2 text-sm font-medium tabular-nums transition-all duration-150 cursor-pointer
                ${questionCount === n ? "border-amber bg-amber/10 text-amber" : "border-border bg-surface text-text-secondary hover:border-border"}
              `}
            >
              {n} Soru
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary & Start */}
      <motion.div variants={fadeUp} className="mt-10">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                {selectedType
                  ? `${types.find((t) => t.id === selectedType)?.title} · ${difficulties.find((d) => d.id === difficulty)?.label} · ${questionCount} Soru${selectedType === "live-coding" ? ` · ${codeLanguage.toUpperCase()}` : ""}`
                  : "Mülakat türü seçin"}
              </p>
            </div>
            <Button
              onClick={handleStart}
              disabled={!selectedType || loading}
              size="lg"
            >
              {loading ? "Oluşturuluyor…" : "Mülakata Başla"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

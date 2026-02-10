import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createInterview, startInterview } from "@/lib/api";
import type { InterviewType, Difficulty } from "@ffh/types";

const types: {
  id: InterviewType;
  icon: string;
  title: string;
  desc: string;
}[] = [
  {
    id: "live-coding",
    icon: "⌨",
    title: "Live Coding",
    desc: "Algoritmik problemleri gerçek zamanlı çöz",
  },
  {
    id: "system-design",
    icon: "◎",
    title: "System Design",
    desc: "Büyük ölçekli sistemler tasarla",
  },
  {
    id: "phone-screen",
    icon: "☎",
    title: "Phone Screen",
    desc: "Teknik telefon mülakatı simülasyonu",
  },
  {
    id: "practice",
    icon: "◈",
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
    preselected,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(5);

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
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
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
          {types.map((t) => (
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
                <span className="text-xl" aria-hidden="true">
                  {t.icon}
                </span>
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
          ))}
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

      {/* Step 3 — Question count */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          Soru Sayısı
        </h2>
        <div className="flex gap-2">
          {[3, 5, 7].map((n) => (
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
                  ? `${types.find((t) => t.id === selectedType)?.title} · ${difficulties.find((d) => d.id === difficulty)?.label} · ${questionCount} Soru`
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

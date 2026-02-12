import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  FileText,
  Briefcase,
  Brain,
  Flame,
  ChevronDown,
  ChevronUp,
  Building2,
  GraduationCap,
  Clock,
  Code2,
  Star,
} from "lucide-react";
import { StreakHeatmap } from "@/components/ui/StreakHeatmap";
import { Link } from "react-router-dom";
import type { Resume } from "@ffh/types";
import { useProfileStore } from "@/stores";
import type { ProfileData } from "@/lib/api";
import { ConfirmModal } from "@/components/ui/ConfirmModal";


const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Resume Detail Card ──────────────────────────────────

function ResumeDetailCard({
  resume,
  onDelete,
}: {
  resume: Resume;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised overflow-hidden">
      {/* Header — always visible */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text truncate">
              {resume.name || resume.fileName}
            </h3>
            {resume.title && (
              <Badge variant="amber">{resume.title}</Badge>
            )}
            {resume.yearsOfExperience != null && (
              <Badge variant="info">
                <Clock size={10} className="mr-1" />
                {resume.yearsOfExperience} yıl deneyim
              </Badge>
            )}
          </div>

          {/* Skills — always show */}
          <div className="flex flex-wrap gap-1 mt-2">
            {resume.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md bg-amber/8 border border-amber/15 text-amber px-1.5 py-0.5 text-[11px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            title={expanded ? "Daralt" : "Detayları Göster"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-danger/50 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer text-xs"
            title="Sil"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded detail section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle px-4 py-4 space-y-5">
              {/* ── Experience ── */}
              {resume.experience.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Building2 size={13} /> İş Deneyimi
                  </h4>
                  <div className="space-y-3">
                    {resume.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="relative pl-4 border-l-2 border-amber/30"
                      >
                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber" />
                        <p className="text-sm font-medium text-text">
                          {exp.role}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {exp.company}
                          <span className="mx-1.5 text-border">•</span>
                          {exp.duration}
                        </p>
                        {exp.highlights.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {exp.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="text-xs text-text-secondary flex gap-1.5"
                              >
                                <Star
                                  size={10}
                                  className="text-amber/50 mt-0.5 shrink-0"
                                />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Education ── */}
              {resume.education.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <GraduationCap size={13} /> Eğitim
                  </h4>
                  <div className="space-y-2">
                    {resume.education.map((edu, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 border border-border-subtle"
                      >
                        <GraduationCap
                          size={14}
                          className="text-info mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-text">
                            {edu.school}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {edu.degree}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Skills Summary ── */}
              {resume.skills.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Code2 size={13} /> Yetenekler ({resume.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((s) => (
                      <Badge key={s} variant="amber">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-surface border border-border-subtle p-2.5 text-center">
                  <p className="text-lg font-bold text-amber tabular-nums">
                    {resume.yearsOfExperience ?? "—"}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Yıl Deneyim
                  </p>
                </div>
                <div className="rounded-lg bg-surface border border-border-subtle p-2.5 text-center">
                  <p className="text-lg font-bold text-info tabular-nums">
                    {resume.skills.length}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Yetenek
                  </p>
                </div>
                <div className="rounded-lg bg-surface border border-border-subtle p-2.5 text-center">
                  <p className="text-lg font-bold text-success tabular-nums">
                    {resume.experience.length}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    İş Deneyimi
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SettingsPage() {
  // Zustand profile store
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.loading);
  const profileFetchedAt = useProfileStore((s) => s.fetchedAt);
  const loading = profileFetchedAt === 0 || isLoading;
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const storeUploadFile = useProfileStore((s) => s.uploadFile);
  const storeUploadText = useProfileStore((s) => s.uploadText);
  const storeRemoveResume = useProfileStore((s) => s.removeResume);

  // Profile form (local UI state)
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);

  // Resume
  const [resumeText, setResumeText] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteResumeTarget, setDeleteResumeTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingResume, setDeletingResume] = useState(false);

  // Fetch profile once (cached)
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sync local form state when profile loads
  useEffect(() => {
    if (profile) {
      setInterests(profile.profile?.interests ?? []);
      setGoals(profile.profile?.goals ?? "");
    }
  }, [profile]);

  // ─── Profile Save ──────────────────────────────────────

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await saveProfile({ interests, goals: goals || undefined });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function addInterest() {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
    }
  }

  function removeInterest(item: string) {
    setInterests(interests.filter((i) => i !== item));
  }

  // ─── Resume Upload ─────────────────────────────────────

  async function handleResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setResumeError(null);
    try {
      await storeUploadFile(file);
    } catch (err) {
      setResumeError(
        err instanceof Error ? err.message : "Yükleme başarısız",
      );
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleResumeText() {
    if (!resumeText.trim()) return;

    setUploadingResume(true);
    setResumeError(null);
    try {
      await storeUploadText(resumeText, "resume-paste.txt");
      setResumeText("");
    } catch (err) {
      setResumeError(
        err instanceof Error ? err.message : "Analiz başarısız",
      );
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleDeleteResume() {
    if (!deleteResumeTarget) return;
    setDeletingResume(true);
    try {
      await storeRemoveResume(deleteResumeTarget.id);
      setDeleteResumeTarget(null);
    } catch {
      // ignore
    } finally {
      setDeletingResume(false);
    }
  }

  // ─── Memory ────────────────────────────────────────────

  function getMemoryValue(key: string): string | null {
    const entry = profile?.memory?.find((m) => m.key === key);
    if (!entry) return null;
    try {
      return JSON.parse(entry.value);
    } catch {
      return entry.value;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-3xl mx-auto space-y-8"
    >
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-text">Profil & Ayarlar</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kişisel bilgilerini ve mülakat tercihlerini yönet
        </p>
      </motion.div>

      {/* ─── Profile Card ─── */}
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="font-display font-semibold text-text mb-4">
            <User size={16} className="inline mr-1.5" /> Profil Bilgileri
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                  İsim
                </label>
                <p className="text-text font-medium">{profile?.name}</p>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                  Email
                </label>
                <p className="text-text font-medium">{profile?.email}</p>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                İlgi Alanları
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-md bg-amber/10 border border-amber/20 text-amber px-2 py-1 text-xs font-medium"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeInterest(item)}
                      className="text-amber/60 hover:text-amber ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="ör: Backend, Distributed Systems, ML"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <Button size="sm" variant="secondary" onClick={addInterest} className="!h-7 !px-2.5 !text-xs">
                  Ekle
                </Button>
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                Hedefler
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="ör: FAANG'a girmek, Senior pozisyon almak..."
                rows={2}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Profili Kaydet"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ─── Resume Section ─── */}
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="font-display font-semibold text-text mb-4">
            <FileText size={16} className="inline mr-1.5" /> Özgeçmiş
          </h2>

          {/* Existing resumes — expanded detail view */}
          {profile?.resumes && profile.resumes.length > 0 && (
            <div className="space-y-4 mb-6">
              {profile.resumes.map((resume) => (
                <ResumeDetailCard
                  key={resume._id}
                  resume={resume}
                  onDelete={() =>
                    setDeleteResumeTarget({
                      id: resume._id,
                      name: resume.name || resume.fileName || "Özgeçmiş",
                    })
                  }
                />
              ))}
            </div>
          )}

          {/* Upload */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                PDF / TXT Dosya Yükle
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleResumeFile}
                disabled={uploadingResume}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-surface-raised file:text-text hover:file:bg-surface-raised/80 file:cursor-pointer"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 border-t border-border-subtle" />
              <p className="relative inline-block bg-surface px-3 text-xs text-text-muted">
                veya metin olarak yapıştır
              </p>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Özgeçmişinizi buraya yapıştırın..."
              rows={4}
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none"
            />
            <Button
              size="sm"
              onClick={handleResumeText}
              disabled={uploadingResume || !resumeText.trim()}
            >
              {uploadingResume ? "Analiz ediliyor…" : "Analiz Et & Kaydet"}
            </Button>
            {resumeError && (
              <p className="text-sm text-danger">{resumeError}</p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ─── Job Postings Link ─── */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-text mb-1">
                <Briefcase size={16} className="inline mr-1.5" /> İş İlanları
              </h2>
              <p className="text-sm text-text-secondary">
                İş ilanlarını ve mülakat yol haritanı ayrı sayfadan yönet
                {profile?.jobPostings && profile.jobPostings.length > 0 && (
                  <span className="text-amber ml-1">
                    ({profile.jobPostings.length} ilan kayıtlı)
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-4 py-2 text-sm font-medium text-amber hover:bg-amber/15 transition-colors"
            >
              İlanlara Git →
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* ─── Streak Heatmap ─── */}
      <motion.div variants={fadeUp}>
        <StreakHeatmap />
      </motion.div>

      {/* ─── Memory / Performance Section ─── */}
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="font-display font-semibold text-text mb-4">
            <Brain size={16} className="inline mr-1.5" /> Performans Hafızası
          </h2>

          {profile?.memory && profile.memory.length > 0 ? (
            <div className="space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-raised border border-border-subtle p-3">
                  <p className="text-xs text-text-muted">Toplam Mülakat</p>
                  <p className="text-lg font-bold text-text tabular-nums">
                    {getMemoryValue("total_interviews") ?? "0"}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-raised border border-border-subtle p-3">
                  <p className="text-xs text-text-muted">Ortalama Skor</p>
                  <p className="text-lg font-bold text-amber tabular-nums">
                    {getMemoryValue("avg_score") ?? "—"}
                  </p>
                </div>
              </div>

              {/* Strong topics */}
              {(() => {
                const strong = getMemoryValue("strong_topics");
                if (!Array.isArray(strong) || strong.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      Güçlü Yönler
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(strong as string[]).map((s) => (
                        <Badge key={s} variant="success">{s}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Weak topics */}
              {(() => {
                const weak = getMemoryValue("weak_topics");
                if (!Array.isArray(weak) || weak.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      Geliştirilmesi Gereken Alanlar
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(weak as string[]).map((w) => (
                        <Badge key={w} variant="danger">{w}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Henüz hafıza verisi yok. Mülakatları tamamlayıp rapor oluşturdukça,
              AI performansını hatırlayacak.
            </p>
          )}
        </Card>
      </motion.div>

      {/* ─── Delete Resume Confirmation Modal ─── */}
      <ConfirmModal
        open={deleteResumeTarget !== null}
        onClose={() => setDeleteResumeTarget(null)}
        onConfirm={handleDeleteResume}
        title="Özgeçmişi Silmek İstediğine Emin Misin?"
        description={
          deleteResumeTarget
            ? `"${deleteResumeTarget.name}" özgeçmişi kalıcı olarak silinecek.`
            : undefined
        }
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={deletingResume}
      />
    </motion.div>
  );
}

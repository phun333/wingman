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
  Award,
  Globe,
  Target,
  Rocket,
  Trophy,
  Wrench,
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
      <div className="flex items-start justify-between px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
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
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resume.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md bg-amber/8 border border-amber/15 text-amber px-2 py-0.5 text-[11px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-4 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            title={expanded ? "Daralt" : "Detayları Göster"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg text-danger/50 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer text-xs"
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
            <div className="border-t border-border-subtle px-5 py-5 space-y-6">
              {/* ── Summary ── */}
              {resume.summary && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    <FileText size={13} /> Profesyonel Özet
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed bg-surface rounded-lg px-3 py-2 border border-border-subtle">
                    {resume.summary}
                  </p>
                </div>
              )}

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
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exp.technologies.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded bg-info/8 border border-info/15 text-info px-1 py-0 text-[9px] font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
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

              {/* ── Projects ── */}
              {resume.projects && resume.projects.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Rocket size={13} /> Projeler
                  </h4>
                  <div className="space-y-3">
                    {resume.projects.map((proj, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-surface px-3 py-2.5 border border-border-subtle"
                      >
                        <p className="text-sm font-medium text-text">{proj.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{proj.description}</p>
                        {proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.technologies.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded bg-success/8 border border-success/15 text-success px-1 py-0 text-[9px] font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {proj.highlights.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {proj.highlights.map((h, j) => (
                              <li key={j} className="text-xs text-text-secondary flex gap-1.5">
                                <Star size={10} className="text-success/50 mt-0.5 shrink-0" />
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
                            {edu.year && <span className="ml-1.5 text-text-muted">({edu.year})</span>}
                            {edu.gpa && <span className="ml-1.5 text-text-muted">GPA: {edu.gpa}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Certifications ── */}
              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Award size={13} /> Sertifikalar
                  </h4>
                  <div className="space-y-1.5">
                    {resume.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                        <Award size={11} className="text-amber/60 shrink-0" />
                        <span className="font-medium text-text">{cert.name}</span>
                        <span className="text-text-muted">— {cert.issuer}</span>
                        {cert.year && <span className="text-text-muted">({cert.year})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Key Achievements ── */}
              {resume.keyAchievements && resume.keyAchievements.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Trophy size={13} /> Öne Çıkan Başarılar
                  </h4>
                  <ul className="space-y-1">
                    {resume.keyAchievements.map((a, i) => (
                      <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                        <Trophy size={10} className="text-amber/50 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Categorized Skills ── */}
              {resume.categorizedSkills && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Wrench size={13} /> Teknik Yetenekler (Kategorize)
                  </h4>
                  <div className="space-y-2">
                    {resume.categorizedSkills.programmingLanguages.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Programlama Dilleri</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.programmingLanguages.map((s) => (
                            <Badge key={s} variant="amber">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.categorizedSkills.frameworks.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Framework'ler</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.frameworks.map((s) => (
                            <Badge key={s} variant="info">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.categorizedSkills.databases.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Veritabanları</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.databases.map((s) => (
                            <Badge key={s} variant="success">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.categorizedSkills.cloud.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Cloud / DevOps</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.cloud.map((s) => (
                            <Badge key={s} variant="info">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.categorizedSkills.tools.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Araçlar</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.tools.map((s) => (
                            <Badge key={s} variant="amber">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.categorizedSkills.methodologies.length > 0 && (
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Metodolojiler</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.categorizedSkills.methodologies.map((s) => (
                            <Badge key={s} variant="success">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Languages ── */}
              {resume.languages && resume.languages.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    <Globe size={13} /> Diller
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.languages.map((l) => (
                      <Badge key={l} variant="info">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Interview Topics ── */}
              {resume.interviewTopics && resume.interviewTopics.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    <Target size={13} /> Önerilen Mülakat Konuları
                  </h4>
                  <ul className="space-y-1">
                    {resume.interviewTopics.map((t, i) => (
                      <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                        <Target size={10} className="text-info/50 mt-0.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-surface border border-border-subtle p-3.5 text-center">
                  <p className="text-xl font-bold text-amber tabular-nums">
                    {resume.yearsOfExperience ?? "—"}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
                    Yıl Deneyim
                  </p>
                </div>
                <div className="rounded-xl bg-surface border border-border-subtle p-3.5 text-center">
                  <p className="text-xl font-bold text-info tabular-nums">
                    {resume.skills.length}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
                    Yetenek
                  </p>
                </div>
                <div className="rounded-xl bg-surface border border-border-subtle p-3.5 text-center">
                  <p className="text-xl font-bold text-success tabular-nums">
                    {resume.experience.length}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
                    İş Deneyimi
                  </p>
                </div>
                <div className="rounded-xl bg-surface border border-border-subtle p-3.5 text-center">
                  <p className="text-xl font-bold text-amber tabular-nums">
                    {resume.projects?.length ?? 0}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
                    Proje
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
      className="max-w-4xl mx-auto space-y-10 pb-8"
    >
      {/* ─── Page Header ─── */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-text">Profil & Ayarlar</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Kişisel bilgilerini ve mülakat tercihlerini yönet
        </p>
      </motion.div>

      {/* ─── Profile Card ─── */}
      <motion.div variants={fadeUp}>
        <Card className="!p-7">
          <h2 className="font-display text-lg font-semibold text-text mb-6 flex items-center gap-2">
            <User size={18} className="text-amber" /> Profil Bilgileri
          </h2>

          <div className="space-y-6">
            {/* Name & Email in two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs text-text-muted uppercase tracking-wider">
                  İsim
                </label>
                <p className="text-text font-medium text-base">{profile?.name}</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-text-muted uppercase tracking-wider">
                  Email
                </label>
                <p className="text-text font-medium text-base">{profile?.email}</p>
              </div>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Interests */}
            <div className="space-y-3">
              <label className="block text-xs text-text-muted uppercase tracking-wider">
                İlgi Alanları
              </label>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber/10 border border-amber/20 text-amber px-2.5 py-1.5 text-xs font-medium"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeInterest(item)}
                        className="text-amber/60 hover:text-amber ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3 items-center">
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
                <Button size="sm" variant="secondary" onClick={addInterest} className="!h-8 !px-3.5 !text-xs shrink-0">
                  Ekle
                </Button>
              </div>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Goals */}
            <div className="space-y-2">
              <label className="block text-xs text-text-muted uppercase tracking-wider">
                Hedefler
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="ör: FAANG'a girmek, Senior pozisyon almak..."
                rows={3}
                className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveProfile} loading={saving} loadingText="Kaydediliyor…">
                Profili Kaydet
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Resume Section ─── */}
      <motion.div variants={fadeUp}>
        <Card className="!p-7">
          <h2 className="font-display text-lg font-semibold text-text mb-6 flex items-center gap-2">
            <FileText size={18} className="text-amber" /> Özgeçmiş
          </h2>

          {/* Existing resumes — expanded detail view */}
          {profile?.resumes && profile.resumes.length > 0 && (
            <div className="space-y-4 mb-8">
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
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs text-text-muted uppercase tracking-wider">
                PDF / TXT Dosya Yükle
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleResumeFile}
                disabled={uploadingResume}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-surface-raised file:text-text hover:file:bg-surface-raised/80 file:cursor-pointer disabled:opacity-50"
              />
              {uploadingResume && (
                <div className="flex items-center gap-2 mt-3 text-xs text-amber">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
                  <span>CV analiz ediliyor, bu birkaç saniye sürebilir…</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t border-border-subtle" />
              <span className="px-4 text-xs text-text-muted">veya metin olarak yapıştır</span>
              <div className="flex-1 border-t border-border-subtle" />
            </div>

            <div className="space-y-3">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Özgeçmişinizi buraya yapıştırın..."
                rows={5}
                className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none leading-relaxed"
              />
              <Button
                size="sm"
                onClick={handleResumeText}
                disabled={!resumeText.trim()}
                loading={uploadingResume}
                loadingText="Analiz ediliyor…"
              >
                Analiz Et & Kaydet
              </Button>
              {resumeError && (
                <p className="text-sm text-danger mt-2">{resumeError}</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Job Postings Link ─── */}
      <motion.div variants={fadeUp}>
        <Card className="!p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-lg font-semibold text-text flex items-center gap-2">
                <Briefcase size={18} className="text-amber" /> İş İlanları
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                İş ilanlarını ve mülakat yol haritanı ayrı sayfadan yönet
                {profile?.jobPostings && profile.jobPostings.length > 0 && (
                  <span className="text-amber ml-1.5">
                    ({profile.jobPostings.length} ilan kayıtlı)
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/dashboard/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-amber/10 border border-amber/20 px-5 py-2.5 text-sm font-medium text-amber hover:bg-amber/15 transition-colors shrink-0"
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
        <Card className="!p-7">
          <h2 className="font-display text-lg font-semibold text-text mb-6 flex items-center gap-2">
            <Brain size={18} className="text-amber" /> Performans Hafızası
          </h2>

          {profile?.memory && profile.memory.length > 0 ? (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-surface-raised border border-border-subtle p-4">
                  <p className="text-xs text-text-muted mb-1">Toplam Mülakat</p>
                  <p className="text-2xl font-bold text-text tabular-nums">
                    {getMemoryValue("total_interviews") ?? "0"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-raised border border-border-subtle p-4">
                  <p className="text-xs text-text-muted mb-1">Ortalama Skor</p>
                  <p className="text-2xl font-bold text-amber tabular-nums">
                    {getMemoryValue("avg_score") ?? "—"}
                  </p>
                </div>
              </div>

              {/* Strong topics */}
              {(() => {
                const strong = getMemoryValue("strong_topics");
                if (!Array.isArray(strong) || strong.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Güçlü Yönler
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Geliştirilmesi Gereken Alanlar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(weak as string[]).map((w) => (
                        <Badge key={w} variant="danger">{w}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed">
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

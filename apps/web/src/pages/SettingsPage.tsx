import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { User, FileText, Briefcase, Brain } from "lucide-react";
import {
  getProfile,
  updateProfile,
  uploadResumeFile,
  uploadResumeText,
  deleteResume,
  parseJobPosting,
  listJobPostings,
  deleteJobPosting,
  type ProfileData,
} from "@/lib/api";
import type { JobPosting, Resume } from "@ffh/types";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);

  // Resume
  const [resumeText, setResumeText] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Job Posting
  const [jobUrl, setJobUrl] = useState("");
  const [jobRawText, setJobRawText] = useState("");
  const [parsingJob, setParsingJob] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [useManualJobText, setUseManualJobText] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setInterests(data.profile?.interests ?? []);
      setGoals(data.profile?.goals ?? "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Profile Save ──────────────────────────────────────

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile({ interests, goals: goals || undefined });
      await loadProfile();
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
      await uploadResumeFile(file);
      await loadProfile();
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
      await uploadResumeText({ text: resumeText, fileName: "resume-paste.txt" });
      setResumeText("");
      await loadProfile();
    } catch (err) {
      setResumeError(
        err instanceof Error ? err.message : "Analiz başarısız",
      );
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleDeleteResume(id: string) {
    try {
      await deleteResume(id);
      await loadProfile();
    } catch {
      // ignore
    }
  }

  // ─── Job Posting Parse ─────────────────────────────────

  async function handleParseJob() {
    if (!jobUrl && !jobRawText) return;

    setParsingJob(true);
    setJobError(null);
    try {
      await parseJobPosting({
        url: jobUrl || undefined,
        rawText: useManualJobText ? jobRawText || undefined : undefined,
      });
      setJobUrl("");
      setJobRawText("");
      await loadProfile();
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Analiz başarısız");
    } finally {
      setParsingJob(false);
    }
  }

  async function handleDeleteJob(id: string) {
    try {
      await deleteJobPosting(id);
      await loadProfile();
    } catch {
      // ignore
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
              <div className="flex gap-2">
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
                <Button size="sm" variant="secondary" onClick={addInterest}>
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

          {/* Existing resumes */}
          {profile?.resumes && profile.resumes.length > 0 && (
            <div className="space-y-2 mb-4">
              {profile.resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {resume.name || resume.fileName}
                      {resume.title && (
                        <span className="text-text-secondary ml-2">— {resume.title}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resume.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))}
                      {resume.skills.length > 6 && (
                        <Badge variant="default">+{resume.skills.length - 6}</Badge>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteResume(resume._id)}
                    className="text-danger/60 hover:text-danger text-xs ml-3 cursor-pointer"
                  >
                    Sil
                  </button>
                </div>
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

      {/* ─── Job Postings Section ─── */}
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="font-display font-semibold text-text mb-4">
            <Briefcase size={16} className="inline mr-1.5" /> İş İlanları
          </h2>

          {/* Existing jobs */}
          {profile?.jobPostings && profile.jobPostings.length > 0 && (
            <div className="space-y-2 mb-4">
              {profile.jobPostings.map((job) => (
                <div
                  key={job._id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {job.title}
                      {job.company && (
                        <span className="text-text-secondary ml-2">@ {job.company}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.level && <Badge variant="amber">{job.level}</Badge>}
                      {job.skills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job._id)}
                    className="text-danger/60 hover:text-danger text-xs ml-3 cursor-pointer"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div className="space-y-3">
            {!useManualJobText ? (
              <>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                    İlan URL'si
                  </label>
                  <Input
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://linkedin.com/jobs/..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setUseManualJobText(true)}
                  className="text-xs text-text-muted hover:text-amber transition-colors cursor-pointer"
                >
                  URL çalışmıyor mu? İlan metnini yapıştır →
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1">
                    İlan Metni
                  </label>
                  <textarea
                    value={jobRawText}
                    onChange={(e) => setJobRawText(e.target.value)}
                    placeholder="İş ilanı metnini buraya yapıştırın..."
                    rows={5}
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setUseManualJobText(false)}
                  className="text-xs text-text-muted hover:text-amber transition-colors cursor-pointer"
                >
                  ← URL ile ekle
                </button>
              </>
            )}
            <Button
              size="sm"
              onClick={handleParseJob}
              disabled={parsingJob || (!jobUrl && !jobRawText)}
            >
              {parsingJob ? "Analiz ediliyor…" : "İlanı Analiz Et"}
            </Button>
            {jobError && (
              <p className="text-sm text-danger">{jobError}</p>
            )}
          </div>
        </Card>
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
    </motion.div>
  );
}

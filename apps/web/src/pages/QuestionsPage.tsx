import { useEffect, useMemo, useState, memo, useDeferredValue } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useQuestionsStore } from "@/stores";
import type { SortOption } from "@/stores";
import {
  createInterview,
  startInterview,
} from "@/lib/api";
import { useInterviewsStore } from "@/stores";
import { difficultyLabels } from "@/lib/constants";
import {
  Search,
  Filter,
  Building2,
  Tag,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Play,
  Crown,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Flame,
  ChevronDown,
} from "lucide-react";
import type {
  LeetcodeProblem,
  CompanyStats,
  TopicStats,
} from "@ffh/types";
import { useRef } from "react";

const DIFFICULTY_VARIANT = {
  easy: "success" as const,
  medium: "amber" as const,
  hard: "danger" as const,
};

const PAGE_SIZE = 30;

export function QuestionsPage() {
  usePageTitle("Sorular");
  const _navigate = useNavigate();

  // ── Store ──────────────────────────────────────────────
  const {
    // Filters
    tab, searchTerm, selectedDifficulty, selectedCompany,
    selectedTopic, faangOnly, sortBy, currentPage, showFilters,
    // Data
    problems, totalCount: _totalCount, companies, topics,
    loading, error,
    // Actions
    setTab, setSearchTerm, setSelectedDifficulty, setSelectedCompany,
    setSelectedTopic, setFaangOnly, setSortBy, setCurrentPage,
    setShowFilters, clearFilters,
    // Fetchers
    fetchProblems, fetchCompanies, fetchTopics,
  } = useQuestionsStore();

  // ── Data Loading (stale-while-revalidate) ──────────────

  // Fetch problems when filters change
  useEffect(() => {
    if (tab === "problems") {
      const timer = setTimeout(
        () => fetchProblems(),
        searchTerm ? 300 : 0,
      );
      return () => clearTimeout(timer);
    }
  }, [tab, fetchProblems, searchTerm, selectedDifficulty, selectedCompany, selectedTopic, faangOnly]);

  // Eagerly load companies (needed for filter dropdown)
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Load topics when tab changes
  useEffect(() => {
    if (tab === "topics") {
      fetchTopics();
    }
  }, [tab, fetchTopics]);

  // ── Sorted & Paginated ────────────────────────────────

  const sortedProblems = useMemo(() => {
    const arr = [...problems];
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    arr.sort((a, b) => {
      switch (sortBy) {
        case "frequency": return b.frequency - a.frequency;
        case "rating": return b.rating - a.rating;
        case "acceptance": return b.acceptanceRate - a.acceptanceRate;
        case "difficulty": return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        default: return 0;
      }
    });
    return arr;
  }, [problems, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProblems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageProblems = sortedProblems.slice(pageStart, pageStart + PAGE_SIZE);

  const hasActiveFilters = selectedDifficulty || selectedCompany || selectedTopic || faangOnly;

  function handleCompanyClick(company: string) {
    setSelectedCompany(company);
    setTab("problems");
  }

  function handleTopicClick(topic: string) {
    setSelectedTopic(topic);
    setTab("problems");
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text mb-1">LeetCode Soruları</h1>
        <p className="text-text-secondary text-sm">
          1825 soru · 200 şirket · Şirkete özel yol haritaları ile hazırlan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-raised rounded-lg w-fit">
        {([
          { id: "problems" as const, label: "Sorular", icon: Hash },
          { id: "companies" as const, label: "Şirketler", icon: Building2 },
          { id: "topics" as const, label: "Konular", icon: Tag },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
              ${tab === id
                ? "bg-amber text-bg shadow-sm"
                : "text-text-secondary hover:text-text hover:bg-surface-overlay"
              }
            `}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ━━━ Problems Tab ━━━ */}
      {tab === "problems" && (
        <>
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Soru, şirket veya konu ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "primary" : "secondary"}
              size="md"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={15} />
              Filtre
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 rounded-full bg-amber" />
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
                <Card className="p-4 space-y-4">
                  {/* Difficulty */}
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                      Zorluk
                    </label>
                    <div className="flex gap-2">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDifficulty(selectedDifficulty === d ? "" : d)}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer
                            ${selectedDifficulty === d
                              ? difficultyLabels[d]?.classes
                              : "border-border-subtle text-text-secondary hover:border-border"
                            }
                          `}
                        >
                          {difficultyLabels[d]?.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company — Searchable Dropdown */}
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                      Şirket
                    </label>
                    <CompanyDropdown
                      companies={companies}
                      selected={selectedCompany}
                      onSelect={(c) => setSelectedCompany(c)}
                    />
                  </div>

                  {/* Topic — Searchable Dropdown */}
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
                      Konu
                    </label>
                    <TopicDropdown
                      topics={topics.length > 0 ? topics : undefined}
                      selected={selectedTopic}
                      onSelect={(t) => setSelectedTopic(t)}
                      onOpen={() => fetchTopics()}
                    />
                  </div>

                  {/* FAANG only + Sort */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faangOnly}
                        onChange={(e) => setFaangOnly(e.target.checked)}
                        className="rounded border-border accent-amber"
                      />
                      <span className="text-sm text-text-secondary">
                        Sadece FAANG soruları
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Sırala:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-2 py-1 bg-surface-raised border border-border-subtle rounded text-xs text-text focus:outline-none focus:border-amber/50"
                      >
                        <option value="frequency">Sıklık</option>
                        <option value="rating">Puan</option>
                        <option value="acceptance">Kabul Oranı</option>
                        <option value="difficulty">Zorluk</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-amber hover:underline cursor-pointer"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </Card>
          )}

          {/* Active Filters Tags */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedDifficulty && (
                <FilterTag label={difficultyLabels[selectedDifficulty]?.label ?? selectedDifficulty} onRemove={() => setSelectedDifficulty("")} />
              )}
              {selectedCompany && (
                <FilterTag label={selectedCompany} onRemove={() => setSelectedCompany("")} />
              )}
              {selectedTopic && (
                <FilterTag label={selectedTopic} onRemove={() => setSelectedTopic("")} />
              )}
              {faangOnly && (
                <FilterTag label="FAANG" onRemove={() => setFaangOnly(false)} />
              )}
              <button onClick={clearFilters} className="text-xs text-text-muted hover:text-amber cursor-pointer">
                Temizle
              </button>
            </div>
          )}

          {/* Results Count + Page Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted flex items-center gap-2">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
                  Yükleniyor...
                </>
              ) : (
                `${sortedProblems.length} soru bulundu`
              )}
            </p>
            {!loading && sortedProblems.length > 0 && (
              <p className="text-sm text-text-muted">
                Sayfa {safePage} / {totalPages}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <Card className="p-4 border-danger/20 bg-danger/5">
              <p className="text-danger text-sm">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading && problems.length === 0 && (
            <div className="flex h-48 items-center justify-center">
              <div className="animate-spin w-7 h-7 border-2 border-amber border-t-transparent rounded-full" />
            </div>
          )}

          {/* Problems Table */}
          {pageProblems.length > 0 && (
            <div className="border border-border-subtle rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_90px_80px_80px_80px] gap-4 px-4 py-3 bg-surface-raised text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border-subtle">
                <span>#</span>
                <span>Soru</span>
                <span>Zorluk</span>
                <span className="text-center">Kabul %</span>
                <span className="text-center">Sıklık</span>
                <span className="text-center">Puan</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border-subtle/50">
                {pageProblems.map((problem) => (
                  <ProblemRow key={problem._id} problem={problem} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}

          {/* Empty */}
          {!loading && pageProblems.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="text-text-muted mx-auto mb-4 opacity-40" />
              <h3 className="text-base font-semibold text-text mb-1">Soru bulunamadı</h3>
              <p className="text-sm text-text-secondary mb-4">
                Filtreleri değiştirmeyi deneyin.
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Filtreleri Temizle
              </Button>
            </div>
          )}
        </>
      )}

      {/* ━━━ Companies Tab ━━━ */}
      {tab === "companies" && (
        <CompaniesGrid companies={companies} onSelect={handleCompanyClick} />
      )}

      {/* ━━━ Topics Tab ━━━ */}
      {tab === "topics" && (
        <TopicsGrid topics={topics} onSelect={handleTopicClick} />
      )}
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  // Build visible page numbers: always show first, last, current ± 2
  const pages = useMemo(() => {
    const set = new Set<number>();
    set.add(1);
    set.add(totalPages);
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      if (i >= 1 && i <= totalPages) set.add(i);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  const btnBase =
    "h-8 min-w-8 px-2 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center";
  const btnNormal = `${btnBase} text-text-secondary hover:text-text hover:bg-surface-overlay`;
  const btnActive = `${btnBase} bg-amber text-bg`;
  const btnDisabled = `${btnBase} text-text-muted/40 pointer-events-none`;

  function handleChange(page: number) {
    onPageChange(page);
    // scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-surface-raised/50">
      <span className="text-xs text-text-muted">
        {(currentPage - 1) * PAGE_SIZE + 1}–
        {Math.min(currentPage * PAGE_SIZE, totalPages * PAGE_SIZE)} gösteriliyor
      </span>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => handleChange(1)}
          className={currentPage === 1 ? btnDisabled : btnNormal}
          disabled={currentPage === 1}
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev */}
        <button
          onClick={() => handleChange(currentPage - 1)}
          className={currentPage === 1 ? btnDisabled : btnNormal}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Numbers */}
        {pages.map((page, i) => {
          // Show ellipsis if gap between consecutive entries
          const prev = pages[i - 1];
          const showEllipsis = prev !== undefined && page - prev > 1;
          return (
            <span key={page} className="flex items-center">
              {showEllipsis && (
                <span className="px-1 text-xs text-text-muted">…</span>
              )}
              <button
                onClick={() => handleChange(page)}
                className={page === currentPage ? btnActive : btnNormal}
              >
                {page}
              </button>
            </span>
          );
        })}

        {/* Next */}
        <button
          onClick={() => handleChange(currentPage + 1)}
          className={currentPage === totalPages ? btnDisabled : btnNormal}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last */}
        <button
          onClick={() => handleChange(totalPages)}
          className={currentPage === totalPages ? btnDisabled : btnNormal}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Company Searchable Dropdown ────────────────────────

function CompanyDropdown({
  companies,
  selected,
  onSelect,
}: {
  companies: CompanyStats[];
  selected: string;
  onSelect: (company: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`
          w-full flex items-center justify-between px-3 py-2 bg-surface border rounded-lg text-sm transition-colors cursor-pointer
          ${selected ? "border-amber/30 text-amber" : "border-border-subtle text-text-secondary"}
          ${open ? "border-amber/50" : "hover:border-border"}
        `}
      >
        <span className="flex items-center gap-2">
          <Building2 size={14} />
          {selected || "Tüm Şirketler"}
        </span>
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border-subtle rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Şirket ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-surface-raised border border-border-subtle rounded text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
          </div>

          {/* "All" option */}
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onSelect(""); setOpen(false); }}
              className={`
                w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer
                ${!selected ? "bg-amber/10 text-amber" : "text-text-secondary hover:bg-surface-raised"}
              `}
            >
              Tüm Şirketler
            </button>

            {filtered.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => { onSelect(c.name); setOpen(false); }}
                className={`
                  w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between
                  ${selected === c.name ? "bg-amber/10 text-amber" : "text-text-secondary hover:bg-surface-raised"}
                `}
              >
                <span>{c.name}</span>
                <span className="text-text-muted">{c.total}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-text-muted text-center">Bulunamadı</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Topic Searchable Dropdown ──────────────────────────

function TopicDropdown({
  topics,
  selected,
  onSelect,
  onOpen,
}: {
  topics?: TopicStats[];
  selected: string;
  onSelect: (topic: string) => void;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const localTopics = topics ?? [];

  const filtered = localTopics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSearch("");
          if (!open) onOpen?.();
        }}
        className={`
          w-full flex items-center justify-between px-3 py-2 bg-surface border rounded-lg text-sm transition-colors cursor-pointer
          ${selected ? "border-amber/30 text-amber" : "border-border-subtle text-text-secondary"}
          ${open ? "border-amber/50" : "hover:border-border"}
        `}
      >
        <span className="flex items-center gap-2">
          <Tag size={14} />
          {selected || "Tüm Konular"}
        </span>
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border-subtle rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Konu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-surface-raised border border-border-subtle rounded text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onSelect(""); setOpen(false); }}
              className={`
                w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer
                ${!selected ? "bg-amber/10 text-amber" : "text-text-secondary hover:bg-surface-raised"}
              `}
            >
              Tüm Konular
            </button>

            {filtered.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => { onSelect(t.name); setOpen(false); }}
                className={`
                  w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between
                  ${selected === t.name ? "bg-amber/10 text-amber" : "text-text-secondary hover:bg-surface-raised"}
                `}
              >
                <span>{t.name}</span>
                <span className="text-text-muted">{t.total}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-text-muted text-center">Bulunamadı</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Problem Row ────────────────────────────────────────

const ProblemRow = memo(function ProblemRow({ problem }: { problem: LeetcodeProblem }) {
  const navigate = useNavigate();
  const fetchAllInterviews = useInterviewsStore((s) => s.fetchAll);
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleStartInterview() {
    try {
      setStarting(true);

      // Check for existing in-progress/created practice interview
      const freshInterviews = await fetchAllInterviews(true);
      const activeInterview = freshInterviews.find(
        (iv) =>
          iv.type === "practice" &&
          (iv.status === "created" || iv.status === "in-progress"),
      );

      if (activeInterview) {
        navigate(`/interview/${activeInterview._id}`);
        return;
      }

      const interview = await createInterview({
        type: "practice",
        difficulty: problem.difficulty,
        language: "tr",
        questionCount: 1,
        codeLanguage: "javascript",
      });
      await startInterview(interview._id);
      navigate(`/interview/${interview._id}?problemId=${problem._id}`);
    } catch (err) {
      console.error("Mülakat başlatılamadı:", err);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        className="grid grid-cols-[60px_1fr_90px_80px_80px_80px] gap-4 px-4 py-3 hover:bg-surface-raised/50 transition-colors cursor-pointer group"
      >
        {/* ID */}
        <span className="text-sm text-text-muted font-mono">
          {problem.leetcodeId}
        </span>

        {/* Title + Tags */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text truncate group-hover:text-amber transition-colors">
              {problem.title}
            </span>
            {problem.isPremium && (
              <Crown size={12} className="text-amber shrink-0" />
            )}
            {problem.askedByFaang && (
              <Flame size={12} className="text-orange-400 shrink-0" />
            )}
          </div>
          {problem.relatedTopics.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {problem.relatedTopics.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised text-text-muted">
                  {t}
                </span>
              ))}
              {problem.relatedTopics.length > 3 && (
                <span className="text-[10px] text-text-muted">
                  +{problem.relatedTopics.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div>
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
            {difficultyLabels[problem.difficulty]?.label}
          </Badge>
        </div>

        {/* Acceptance */}
        <div className="text-center">
          <span className="text-sm text-text-secondary">
            {problem.acceptanceRate.toFixed(1)}%
          </span>
        </div>

        {/* Frequency */}
        <div className="text-center">
          <FrequencyBar value={problem.frequency} />
        </div>

        {/* Rating */}
        <div className="text-center">
          <span className="text-sm font-mono text-text-secondary">
            {problem.rating}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border-subtle/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Description */}
                <div>
                  <p className="text-xs text-text-secondary line-clamp-6 whitespace-pre-line leading-relaxed">
                    {problem.description.slice(0, 500)}
                    {problem.description.length > 500 ? "..." : ""}
                  </p>
                </div>

                {/* Right: Metadata */}
                <div className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} /> {problem.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown size={11} /> {problem.dislikes.toLocaleString()}
                    </span>
                    <span>Accepted: {problem.accepted}</span>
                    <span>Submissions: {problem.submissions}</span>
                  </div>

                  {/* Companies */}
                  {problem.companies.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                        Şirketler
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {problem.companies.map((c) => (
                          <span
                            key={c}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border-subtle"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartInterview();
                      }}
                      loading={starting}
                    >
                      <Play size={13} />
                      Çözmeye Başla
                    </Button>
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <ExternalLink size={12} />
                      LeetCode
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Frequency Bar ──────────────────────────────────────

const FrequencyBar = memo(function FrequencyBar({ value }: { value: number }) {
  const width = Math.min(value, 100);
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <div className="w-10 h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-amber/60"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted font-mono w-7 text-center">
        {value.toFixed(0)}
      </span>
    </div>
  );
});

// ─── Filter Tag ─────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber/10 text-amber text-xs border border-amber/20">
      {label}
      <button onClick={onRemove} className="hover:text-amber-light cursor-pointer">
        <X size={12} />
      </button>
    </span>
  );
}

// ─── Companies Grid ─────────────────────────────────────

const GRID_PAGE_SIZE = 24;

const CompanyCard = memo(function CompanyCard({
  company,
  onSelect,
}: {
  company: CompanyStats;
  onSelect: (c: string) => void;
}) {
  return (
    <Card
      hover
      className="p-4 transition-transform hover:scale-[1.02]"
      onClick={() => onSelect(company.name)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-amber" />
          <span className="font-semibold text-sm text-text">
            {company.name}
          </span>
        </div>
        <span className="text-lg font-bold text-text">
          {company.total}
        </span>
      </div>

      <div className="space-y-1.5">
        <DifficultyBar label="Kolay" value={company.easy} total={company.total} color="success" />
        <DifficultyBar label="Orta" value={company.medium} total={company.total} color="amber" />
        <DifficultyBar label="Zor" value={company.hard} total={company.total} color="danger" />
      </div>
    </Card>
  );
});

function CompaniesGrid({
  companies,
  onSelect,
}: {
  companies: CompanyStats[];
  onSelect: (c: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(
    () => {
      if (!deferredSearch) return companies;
      const q = deferredSearch.toLowerCase();
      return companies.filter((c) => c.name.toLowerCase().includes(q));
    },
    [companies, deferredSearch],
  );

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(GRID_PAGE_SIZE);
  }, [deferredSearch]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Şirket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <span className="text-sm text-text-muted ml-3">
          {filtered.length} şirket
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visibleItems.map((company) => (
          <CompanyCard key={company.name} company={company} onSelect={onSelect} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((c) => c + GRID_PAGE_SIZE)}
          >
            <ChevronDown size={15} />
            Daha fazla göster ({filtered.length - visibleCount} kaldı)
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-text-muted py-8 text-sm">Şirket bulunamadı</p>
      )}
    </div>
  );
}

// ─── Topics Grid ────────────────────────────────────────

const TopicCard = memo(function TopicCard({
  topic,
  onSelect,
}: {
  topic: TopicStats;
  onSelect: (t: string) => void;
}) {
  return (
    <Card
      hover
      className="p-4 transition-transform hover:scale-[1.02]"
      onClick={() => onSelect(topic.name)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-info" />
          <span className="font-semibold text-sm text-text">
            {topic.name}
          </span>
        </div>
        <span className="text-lg font-bold text-text">
          {topic.total}
        </span>
      </div>

      <div className="space-y-1.5">
        <DifficultyBar label="Kolay" value={topic.easy} total={topic.total} color="success" />
        <DifficultyBar label="Orta" value={topic.medium} total={topic.total} color="amber" />
        <DifficultyBar label="Zor" value={topic.hard} total={topic.total} color="danger" />
      </div>
    </Card>
  );
});

function TopicsGrid({
  topics,
  onSelect,
}: {
  topics: TopicStats[];
  onSelect: (t: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(
    () => {
      if (!deferredSearch) return topics;
      const q = deferredSearch.toLowerCase();
      return topics.filter((t) => t.name.toLowerCase().includes(q));
    },
    [topics, deferredSearch],
  );

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(GRID_PAGE_SIZE);
  }, [deferredSearch]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Konu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-amber/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <span className="text-sm text-text-muted ml-3">
          {filtered.length} konu
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visibleItems.map((topic) => (
          <TopicCard key={topic.name} topic={topic} onSelect={onSelect} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((c) => c + GRID_PAGE_SIZE)}
          >
            <ChevronDown size={15} />
            Daha fazla göster ({filtered.length - visibleCount} kaldı)
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-text-muted py-8 text-sm">Konu bulunamadı</p>
      )}
    </div>
  );
}

// ─── Difficulty Bar Component ───────────────────────────

const DIFF_BAR_COLORS = {
  success: "bg-success/60",
  amber: "bg-amber/60",
  danger: "bg-danger/60",
} as const;

type DiffBarColor = keyof typeof DIFF_BAR_COLORS;

const DifficultyBar = memo(function DifficultyBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: DiffBarColor;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-8">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div
          className={`h-full rounded-full ${DIFF_BAR_COLORS[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted w-5 text-right">{value}</span>
    </div>
  );
});

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listProblems, createInterview, startInterview } from "@/lib/api";
import { difficultyLabels } from "@/lib/constants";
import {
  Code2,
  Play,
  Clock,
  Target,
  Filter,
  Search,
} from "lucide-react";
import type { Problem, Difficulty } from "@ffh/types";

const difficultyVariants = {
  easy: "success" as const,
  medium: "amber" as const,
  hard: "danger" as const,
};

const categoryVariants = {
  "array": "info" as const,
  "string": "default" as const,
  "tree": "success" as const,
  "graph": "danger" as const,
  "dynamic-programming": "amber" as const,
  "greedy": "info" as const,
  "backtracking": "danger" as const,
  "default": "default" as const,
};

export function QuestionsPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "">("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [solvingProblem, setSolvingProblem] = useState<string | null>(null);

  const categories = [
    "array", "string", "tree", "graph", "dynamic-programming",
    "greedy", "backtracking", "sorting", "searching", "math"
  ];

  useEffect(() => {
    loadProblems();
  }, [selectedDifficulty, selectedCategory]);

  async function loadProblems() {
    try {
      setLoading(true);
      const data = await listProblems({
        difficulty: selectedDifficulty || undefined,
        category: selectedCategory || undefined,
      });
      setProblems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorular yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleSolveProblem(problemId: string) {
    try {
      setSolvingProblem(problemId);
      console.log("Starting problem solve for ID:", problemId);

      // Create practice interview with specific problem
      const interview = await createInterview({
        type: "practice",
        difficulty: "medium", // We'll use the problem's difficulty
        language: "tr",
        questionCount: 1,
        codeLanguage: "javascript",
      });

      console.log("Created interview:", interview._id);

      // Start interview immediately
      await startInterview(interview._id);

      // Navigate to interview room
      const url = `/interview/${interview._id}?problemId=${problemId}`;
      console.log("Navigating to:", url);
      navigate(url);
    } catch (err) {
      console.error("Problem çözme başlatılamadı:", err);
      setError("Problem çözme başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSolvingProblem(null);
    }
  }

  const filteredProblems = problems.filter(problem =>
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-muted">Sorular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Algorítma Soruları</h1>
        <p className="text-text-secondary">
          {problems.length} soru mevcut. İstediğin soruyu seçip direkt çözmeye başla.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="text"
                placeholder="Soru ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | "")}
              className="px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-amber"
            >
              <option value="">Tüm Seviyeler</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-amber"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-4 border-danger/20 bg-danger/5">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      {/* Problems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProblems.map((problem) => (
          <motion.div
            key={problem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 h-full flex flex-col hover:border-amber/30 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text mb-1 line-clamp-2">
                    {problem.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={difficultyVariants[problem.difficulty]}>
                      {difficultyLabels[problem.difficulty]?.label}
                    </Badge>
                    <Badge variant={categoryVariants[problem.category as keyof typeof categoryVariants] || categoryVariants.default}>
                      {problem.category}
                    </Badge>
                  </div>
                </div>
                <Code2 size={16} className="text-text-muted shrink-0 ml-2" />
              </div>

              {/* Description */}
              <div className="flex-1 mb-4">
                <p className="text-sm text-text-secondary line-clamp-3">
                  {problem.description}
                </p>
              </div>

              {/* Complexity Info */}
              {(problem.timeComplexity || problem.spaceComplexity) && (
                <div className="flex items-center gap-4 mb-4 text-xs text-text-muted">
                  {problem.timeComplexity && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Time: {problem.timeComplexity}</span>
                    </div>
                  )}
                  {problem.spaceComplexity && (
                    <div className="flex items-center gap-1">
                      <Target size={12} />
                      <span>Space: {problem.spaceComplexity}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Solve Button */}
              <Button
                onClick={() => handleSolveProblem(problem._id)}
                disabled={solvingProblem === problem._id}
                className="w-full bg-gradient-to-r from-amber to-orange hover:from-amber/80 hover:to-orange/80"
                size="sm"
              >
                {solvingProblem === problem._id ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Başlatılıyor...
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-2" />
                    Çöz
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProblems.length === 0 && !loading && (
        <div className="text-center py-12">
          <Code2 size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">Soru bulunamadı</h3>
          <p className="text-text-secondary mb-4">
            Arama kriterlerinize uygun soru bulunamadı. Filtreleri değiştirmeyi deneyin.
          </p>
          <Button
            onClick={() => {
              setSelectedDifficulty("");
              setSelectedCategory("");
              setSearchTerm("");
            }}
            variant="ghost"
          >
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  );
}
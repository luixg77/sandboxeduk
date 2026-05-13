"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { HeroSummary } from "@/components/ui/HeroSummary";
import { QuestionDetailModal } from "./QuestionDetailModal";
import { ImportQuestionsModal } from "./ImportQuestionsModal";
import { CourseExclusiveBadge } from "@/components/admin/CourseExclusiveBadge";
import {
  useQuestions,
  useDisciplines,
  useSubjects,
  useEducationStages,
  useGrades,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteRecord,
  useBnccSkills,
  useInactivateQuestion,
  useActivateQuestion,
  type SortOrder,
} from "@/hooks/useAdminData";
import type {
  Question,
  QuestionFilters,
  QuestionType,
  QuestionOrigin,
  QuestionDifficulty,
  QuestionStatus,
  CreateQuestionPayload,
  AlternativePayload,
} from "@/types/question.types";
import {
  EMPTY_QUESTION_FILTERS,
  DIFFICULTY_CONFIG,
  questionDisplayCode,
} from "@/types/question.types";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Eye,
  Edit2,
  Heart,
  MoreHorizontal,
  HelpCircle,
  CheckSquare,
  Square,
  List,
  BookMarked,
  Star,
  ChevronDown,
  Filter,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ImagePlus,
  Archive,
  Trash2,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getPaginationItems(currentPage: number, lastPage: number, maxLength = 7) {
  if (lastPage <= maxLength) return Array.from({ length: lastPage }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }
  
  for (let i = start; i <= end; i++) pages.push(i);

  if (end < lastPage) {
    if (end < lastPage - 1) pages.push("...");
    pages.push(lastPage);
  }

  return pages;
}

// ─────────────────────────────────────────────────────────────
// Favorites — localStorage (no DB table yet)
// ─────────────────────────────────────────────────────────────
const FAVORITES_KEY = "kodar_question_favorites";

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch {
      /* ignore parse errors */
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Limpa IDs fantasma (questões que foram deletadas mas IDs ficaram no localStorage)
  const cleanupStaleIds = useCallback((validIds: Set<string>) => {
    setFavorites((prev) => {
      const cleaned = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      if (cleaned.size !== prev.size) {
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(cleaned)));
        } catch { /* ignore */ }
      }
      return cleaned;
    });
  }, []);

  return { favorites, toggle, cleanupStaleIds };
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "all", label: "Todas", Icon: List },
  { id: "mine", label: "Minhas", Icon: BookMarked },
  { id: "favorites", label: "Favoritas", Icon: Star },
  { id: "inactive", label: "Inativas", Icon: Archive },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ─────────────────────────────────────────────────────────────
// Form state for create / edit modal
// ─────────────────────────────────────────────────────────────
interface QuestionFormState {
  statement: string;
  type: QuestionType;
  origin: QuestionOrigin;
  difficulty: QuestionDifficulty | "";
  comment: string;
  source: string;
  year: string;
  status: QuestionStatus;
  bncc_skill_id: string;
  stage_id: string;
  discipline_id: string;
  subject_id: string;
  grade_id: string;
  image_url: string | null;
  image_file: File | null;
  alternatives: (AlternativePayload & { image_file?: File | null })[];
}

const DEFAULT_ALTERNATIVES: (AlternativePayload & {
  image_file?: File | null;
})[] = [
  {
    letter: "A",
    text: "",
    is_correct: false,
    image_url: null,
    image_file: null,
  },
  {
    letter: "B",
    text: "",
    is_correct: false,
    image_url: null,
    image_file: null,
  },
  {
    letter: "C",
    text: "",
    is_correct: false,
    image_url: null,
    image_file: null,
  },
  {
    letter: "D",
    text: "",
    is_correct: false,
    image_url: null,
    image_file: null,
  },
  {
    letter: "E",
    text: "",
    is_correct: false,
    image_url: null,
    image_file: null,
  },
];

function buildEmptyForm(): QuestionFormState {
  return {
    statement: "",
    type: "multiple_choice",
    origin: "custom",
    difficulty: "",
    comment: "",
    source: "",
    year: "",
    status: "draft",
    bncc_skill_id: "",
    stage_id: "",
    discipline_id: "",
    subject_id: "",
    grade_id: "",
    image_url: null,
    image_file: null,
    alternatives: DEFAULT_ALTERNATIVES.map((a) => ({ ...a })),
  };
}

function formFromQuestion(q: Question): QuestionFormState {
  return {
    statement: q.statement,
    type: q.type,
    origin: q.origin,
    difficulty: q.difficulty ?? "",
    comment: q.comment ?? "",
    source: q.source ?? "",
    year: q.year ? String(q.year) : "",
    status: q.status,
    bncc_skill_id: q.bncc_skill_id ?? "",
    stage_id: q.stage_id ?? "",
    discipline_id: q.discipline_id ?? "",
    subject_id: q.subject_id ?? "",
    grade_id: q.grade_id ?? "",
    image_url: q.image_url ?? null,
    image_file: null,
    alternatives: q.question_alternatives.length
      ? q.question_alternatives.map((a) => ({
          letter: a.letter,
          text: a.text,
          is_correct: a.is_correct,
          image_url: a.image_url ?? null,
          image_file: null,
        }))
      : DEFAULT_ALTERNATIVES.map((a) => ({ ...a })),
  };
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function BancoDeQuestoesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [filters, setFilters] = useState<QuestionFilters>(
    EMPTY_QUESTION_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [activateTarget, setActivateTarget] = useState<Question | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { favorites, toggle: toggleFavorite, cleanupStaleIds } = useFavorites();
  const debouncedKeyword = useDebounce(filters.keyword, 400);

  // Resolve current user ID for "Minhas" tab
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Build query filters — tabs contribute created_by / status filters
  const queryFilters = useMemo<Partial<QuestionFilters>>(() => {
    const f: Partial<QuestionFilters> = {
      ...filters,
      keyword: debouncedKeyword,
    };
    if (activeTab === "mine" && currentUserId) {
      f.created_by = currentUserId;
      f.origin = "custom";
    }
    if (activeTab === "inactive") f.status = "inactive";
    if (activeTab === "favorites") {
      f.ids = Array.from(favorites);
    }
    return f;
  }, [filters, debouncedKeyword, activeTab, currentUserId, favorites]);

  const [limit, setLimit] = useState<number>(20);

  const effectiveLimit = activeTab === "favorites" ? 9999 : limit;
  
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuestions(queryFilters, page, effectiveLimit, sortOrder);
  
  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: subjectsFiltered } = useSubjects(filters.discipline_id);
  const { data: stagesRes } = useEducationStages(1, 100);
  const { data: gradesRes } = useGrades(1, 100);

  const allQuestions = response?.data ?? [];
  const totalCount = response?.count ?? 0;
  const totalPages = Math.ceil(totalCount / effectiveLimit);

  // Favorites tab filtered server-side via ids (no DB table yet, but ids sent to query)
  const displayList = useMemo(() => {
    return allQuestions;
  }, [allQuestions]);

  // Aggressive cleanup: when viewing the "Favoritas" tab, if the DB reports fewer valid
  // questions than we have in localStorage, sync them. 
  useEffect(() => {
    if (activeTab === "favorites" && !isLoading && !isError) {
      if (totalCount < favorites.size) {
        if (page === 1 && totalCount === allQuestions.length) {
          // All valid favorites are on this page. Just clean up directly.
          const validIds = new Set(allQuestions.map((q) => q.id));
          cleanupStaleIds(validIds);
        } else {
          // Valid favorites span multiple pages. We must query Supabase to find exactly which IDs still exist.
          const syncFavorites = async () => {
            const supabase = createClient();
            const { data } = await supabase
              .from("questions")
              .select("id")
              .in("id", Array.from(favorites))
              .is("deleted_at", null);
            if (data) {
              const validIds = new Set(data.map((d) => d.id));
              cleanupStaleIds(validIds);
            }
          };
          syncFavorites();
        }
      }
    }
  }, [
    activeTab,
    isLoading,
    isError,
    totalCount,
    favorites.size,
    page,
    allQuestions,
    cleanupStaleIds,
  ]);

  const { mutate: inactivateQuestion, isPending: isDeleting } =
    useInactivateQuestion();
  const { mutate: activateQuestion, isPending: isActivating } =
    useActivateQuestion();

  const setFilter = (key: keyof QuestionFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "discipline_id") next.subject_id = ""; // cascade reset
      return next;
    });
    setPage(1);
  };
  const clearFilters = () => {
    setFilters(EMPTY_QUESTION_FILTERS);
    setPage(1);
  };

  const hasActiveFilters =
    Object.entries(filters)
      .filter(([k]) => k !== "keyword")
      .some(([, v]) => Boolean(v)) || Boolean(debouncedKeyword);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(
      selected.size === displayList.length
        ? new Set<string>()
        : new Set<string>(displayList.map((q) => q.id)),
    );
  };

  const handleEdit = (q: Question) => {
    setDetailQuestion(null);
    setEditingQuestion(q);
    setShowCreate(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    inactivateQuestion(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleActivateConfirm = () => {
    if (!activateTarget) return;
    activateQuestion(activateTarget.id, {
      onSuccess: () => setActivateTarget(null),
    });
  };

  const disciplines = disciplinesRes?.data ?? [];
  const subjects = subjectsFiltered ?? [];
  const stages = stagesRes?.data ?? [];
  const grades = gradesRes?.data ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Hero ── */}
      <div className="px-8 pt-8">
        <HeroSummary
          title="Banco de Questões"
          description="Gerencie, filtre e crie questões educacionais para provas, simulados e avaliações"
          icon={<HelpCircle className="w-8 h-8 text-white" />}
          themeClass="bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600"
        >
          <div className="flex gap-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 bg-purple-700/30 hover:bg-purple-700/50 text-white px-5 py-3 rounded-xl font-bold transition-colors whitespace-nowrap border border-white/20 shadow-sm"
              title="Importar questões em lote a partir do JSON fatiado"
            >
              <UploadCloud className="w-4 h-4" />
              Importar Questões
            </button>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowCreate(true);
              }}
              className="flex items-center gap-2 bg-white text-purple-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-purple-50 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nova Questão
            </button>
          </div>
        </HeroSummary>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-6 px-8 pb-16 items-start">
        {/* ═══════════ FILTER SIDEBAR ═══════════ */}
        <aside
          className={`shrink-0 sticky top-8 transition-all duration-300 ${filtersOpen ? "w-64" : "w-12"}`}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              {filtersOpen && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-bold text-slate-700">
                    Filtros
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {filtersOpen && (
              <div className="p-4 space-y-5">
                {/* Keyword */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enunciado..."
                      value={filters.keyword}
                      onChange={(e) => setFilter("keyword", e.target.value)}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-slate-400"
                    />
                    {filters.keyword && (
                      <button
                        onClick={() => setFilter("keyword", "")}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Disciplina */}
                <FilterSelect
                  label="Disciplina"
                  value={filters.discipline_id}
                  onChange={(v) => setFilter("discipline_id", v)}
                >
                  <option value="">Todas</option>
                  <option value="null">Sem disciplina</option>
                  {disciplines.map((d: { id: string; name: string }) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* Assunto (Dependent Focus) */}
                <FilterSelect
                  label="Assunto"
                  value={filters.subject_id}
                  onChange={(v) => setFilter("subject_id", v)}
                  disabled={!filters.discipline_id || filters.discipline_id === 'null'}
                >
                  <option value="">{filters.discipline_id && filters.discipline_id !== 'null' ? "Todos" : "Selecione uma disciplina"}</option>
                  <option value="null">Sem assunto</option>
                  {subjects.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* Etapa */}
                <FilterSelect
                  label="Etapa de Ensino"
                  value={filters.stage_id}
                  onChange={(v) => setFilter("stage_id", v)}
                >
                  <option value="">Todas</option>
                  {stages.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* Série */}
                <FilterSelect
                  label="Série"
                  value={filters.grade_id}
                  onChange={(v) => setFilter("grade_id", v)}
                >
                  <option value="">Todas</option>
                  {grades.map((g: { id: string; name: string }) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* Dificuldade */}
                <FilterSelect
                  label="Dificuldade"
                  value={filters.difficulty}
                  onChange={(v) => setFilter("difficulty", v)}
                >
                  <option value="">Todas</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </FilterSelect>

                {/* Tipo */}
                <FilterSelect
                  label="Tipo"
                  value={filters.type}
                  onChange={(v) => setFilter("type", v)}
                >
                  <option value="">Todos</option>
                  <option value="multiple_choice">Múltipla Escolha</option>
                  <option value="discursive">Discursiva</option>
                </FilterSelect>

                {/* Origem */}
                <FilterSelect
                  label="Origem"
                  value={filters.origin}
                  onChange={(v) => setFilter("origin", v)}
                >
                  <option value="">Todas</option>
                  <option value="system">Sistema</option>
                  <option value="custom">Minhas</option>
                </FilterSelect>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                  >
                    <X className="h-3.5 w-3.5" /> Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === "favorites" && favorites.size > 0 && (
                  <span
                    className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${
                      activeTab === "favorites"
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {favorites.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results bar */}
          {!isLoading && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {selected.size > 0 && selected.size === displayList.length ? (
                    <CheckSquare className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {selected.size > 0
                    ? `${selected.size} selecionadas`
                    : "Selecionar todas"}
                </button>
                <span className="text-xs text-slate-400">
                  {activeTab === "favorites"
                    ? `${favorites.size} favoritadas`
                    : `${totalCount} ${totalCount === 1 ? "questão" : "questões"}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all shadow-sm"
                  title={
                    sortOrder === "newest"
                      ? "Mostrando mais recentes primeiro"
                      : "Mostrando mais antigas primeiro"
                  }
                >
                  {sortOrder === "newest" ? (
                    <ArrowDown className="w-3 h-3 text-purple-500" />
                  ) : (
                    <ArrowUp className="w-3 h-3 text-purple-500" />
                  )}
                  {sortOrder === "newest" ? "Mais recentes" : "Mais antigas"}
                </button>
                {selected.size > 0 && (
                  <>
                    <button className="text-xs font-medium px-3 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
                      Adicionar à lista
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="h-5 w-24 bg-slate-100 rounded-lg" />
                    <div className="h-5 w-20 bg-slate-100 rounded-full" />
                    <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-100">
              <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-base font-bold text-slate-700">
                Erro ao carregar questões
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Verifique a conexão e tente novamente.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && !isError && displayList.length === 0 && (
            <EmptyState
              icon={<Search className="h-8 w-8 text-slate-400" />}
              title={
                activeTab === "favorites"
                  ? "Nenhuma questão favoritada"
                  : "Nenhuma questão encontrada"
              }
              description={
                hasActiveFilters
                  ? "Tente remover alguns filtros."
                  : 'Crie sua primeira questão clicando em "+ Nova Questão".'
              }
              action={
                hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Limpar filtros
                  </button>
                ) : undefined
              }
            />
          )}

          {/* ── Question cards ── */}
          {!isLoading && !isError && displayList.length > 0 && (
            <>
              <div className="space-y-3">
                {displayList.map((q) => {
                  const diff = q.difficulty
                    ? DIFFICULTY_CONFIG[q.difficulty]
                    : null;
                  const discColor = q.disciplines?.color_hex ?? "#94a3b8";
                  const isFav = favorites.has(q.id);
                  const isSel = selected.has(q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => setDetailQuestion(q)}
                      className={`group relative bg-white rounded-2xl border cursor-pointer overflow-hidden
                        hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200
                        ${isSel ? "border-purple-300 shadow-[0_0_0_3px_rgba(147,51,234,0.08)]" : "border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]"}
                        ${q.status === "draft" ? "opacity-80" : ""}
                      `}
                    >
                      {/* Discipline color strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ backgroundColor: discColor }}
                      />

                      <div className="pl-4 pr-5 py-4 flex gap-4 items-start">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => toggleSelect(q.id, e)}
                          className="mt-0.5 shrink-0 text-slate-300 hover:text-purple-600 transition-colors"
                        >
                          {isSel ? (
                            <CheckSquare className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Top badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md tracking-wide">
                              {questionDisplayCode(q.id)}
                            </span>
                            {q.disciplines && (
                              <span
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: `${discColor}15`,
                                  color: discColor,
                                  borderColor: `${discColor}35`,
                                }}
                              >
                                {q.disciplines.name}
                              </span>
                            )}
                            {diff && (
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${diff.cls}`}
                              >
                                {diff.label}
                              </span>
                            )}
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                              {q.type === "multiple_choice"
                                ? "MC"
                                : "Discursiva"}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                q.origin === "system"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : currentUserId && q.created_by === currentUserId
                                    ? "bg-violet-50 text-violet-600 border-violet-200"
                                    : "bg-teal-50 text-teal-600 border-teal-200"
                              }`}
                            >
                              {q.origin === "system"
                                ? "Sistema"
                                : currentUserId && q.created_by === currentUserId
                                  ? "Minha"
                                  : "Personalizada"}
                            </span>
                            {q.status === "draft" && (
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600">
                                Rascunho
                              </span>
                            )}
                            {(q as any).course && (
                              <CourseExclusiveBadge course={(q as any).course} />
                            )}
                          </div>

                          {/* Statement Preview (Strip tags na lista) */}
                          <div className="space-y-3">
                            {(() => {
                              const htmlStr = q.statement;
                              const imgMatch = htmlStr.match(/<img[^>]+>/i);
                              
                              let beforeText = "";
                              let afterText = "";
                              let previewUrl = q.image_url && !htmlStr.includes("<img") ? q.image_url : null;

                              if (imgMatch) {
                                const fullTag = imgMatch[0];
                                const srcMatch = fullTag.match(/src="([^">]+)"/i);
                                if (srcMatch) previewUrl = srcMatch[1];

                                const parts = htmlStr.split(fullTag);
                                beforeText = parts[0]
                                  .replace(/<[^>]+>/g, " ")
                                  .replace(/\s+/g, " ")
                                  .trim();
                                afterText = parts
                                  .slice(1)
                                  .join("")
                                  .replace(/<[^>]+>/g, " ")
                                  .replace(/\s+/g, " ")
                                  .trim();
                              } else {
                                beforeText = htmlStr
                                  .replace(/<[^>]+>/g, " ")
                                  .replace(/\s+/g, " ")
                                  .trim();
                              }

                              return (
                                <>
                                  {beforeText && (
                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:text-slate-900 transition-colors">
                                      {beforeText}
                                    </p>
                                  )}

                                  {previewUrl && (
                                    <div className="h-32 max-w-[260px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={previewUrl}
                                        alt="Anexo do enunciado"
                                        className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                      />
                                    </div>
                                  )}

                                  {afterText && (
                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:text-slate-900 transition-colors mt-2">
                                      {afterText}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Metadata footer */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2.5">
                            {q.source && (
                              <span className="text-[11px] text-slate-400">
                                {q.source}
                              </span>
                            )}
                            {q.year && (
                              <span className="text-[11px] text-slate-400">
                                {q.year}
                              </span>
                            )}
                            {q.bncc_skills && (
                              <span className="text-[11px] font-mono text-slate-400">
                                {q.bncc_skills.code}
                              </span>
                            )}
                            {q.subjects && (
                              <span className="text-[11px] text-slate-400">
                                Assunto: {q.subjects.name}
                              </span>
                            )}
                            {q.grades && (
                              <span className="text-[11px] text-slate-400">
                                {q.grades.name}
                              </span>
                            )}
                            {q.education_stages && (
                              <span className="text-[11px] text-slate-400">
                                {q.education_stages.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons — reveal on hover */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionBtn
                            title="Visualizar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailQuestion(q);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </ActionBtn>

                          {activeTab !== "inactive" && (
                            <>
                              <ActionBtn
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(q);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </ActionBtn>
                              <ActionBtn
                                title={isFav ? "Desfavoritar" : "Favoritar"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(q.id);
                                }}
                                className={
                                  isFav
                                    ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                    : ""
                                }
                              >
                                <Heart
                                  className={`h-4 w-4 ${isFav ? "fill-amber-500" : ""}`}
                                />
                              </ActionBtn>
                              <ActionBtn
                                title="Inativar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(q);
                                }}
                              >
                                <Archive className="h-4 w-4" />
                              </ActionBtn>
                            </>
                          )}

                          {activeTab === "inactive" && (
                            <ActionBtn
                              title="Ativar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivateTarget(q);
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </ActionBtn>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {activeTab !== "favorites" && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-4">
                  {/* Paginador (Sliding Window) */}
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center justify-center h-9 px-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </button>
                      
                      {getPaginationItems(page, totalPages).map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof p === "number" && setPage(p)}
                          disabled={p === "..."}
                          className={`flex items-center justify-center h-9 min-w-[36px] px-2 text-sm font-medium rounded-lg transition-colors ${
                            p === page
                              ? "bg-purple-600 text-white border border-purple-600 shadow-sm"
                              : p === "..."
                                ? "text-slate-400 cursor-default bg-transparent"
                                : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center justify-center h-9 px-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Dense Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens por pág:</span>
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 shadow-inner">
                      {[10, 20, 50].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setLimit(num);
                            setPage(1);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            limit === num
                              ? "bg-white text-purple-700 shadow-sm border border-slate-200/50"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <QuestionDetailModal
        question={detailQuestion}
        onClose={() => setDetailQuestion(null)}
        onEdit={handleEdit}
      />

      {/* ── Create / Edit Modal ── */}
      {showCreate && (
        <QuestionFormModal
          editingQuestion={editingQuestion}
          onClose={() => {
            setShowCreate(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {/* ── Import Modal ── */}
      <ImportQuestionsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* ── Inactivate Confirm Modal ── */}
      {deleteTarget && (
        <InactivateConfirmModal
          question={deleteTarget}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Activate Confirm Modal ── */}
      {activateTarget && (
        <ActivateConfirmModal
          question={activateTarget}
          isActivating={isActivating}
          onConfirm={handleActivateConfirm}
          onClose={() => setActivateTarget(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QuestionFormModal — create or edit
// ─────────────────────────────────────────────────────────────
function QuestionFormModal({
  editingQuestion,
  onClose,
}: {
  editingQuestion: Question | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(editingQuestion);
  const [form, setForm] = useState<QuestionFormState>(
    editingQuestion ? formFromQuestion(editingQuestion) : buildEmptyForm(),
  );

  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: subjectsRes, isFetching: isFetchingSubjects } = useSubjects(
    form.discipline_id,
  );
  const { data: stagesRes } = useEducationStages(1, 100);
  const { data: gradesRes } = useGrades(1, 100);
  const { data: bnccSkills } = useBnccSkills();
  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const isPending = isCreating || isUpdating;

  const disciplines = disciplinesRes?.data ?? [];
  const subjects = subjectsRes ?? [];
  const stages = stagesRes?.data ?? [];
  const grades = gradesRes?.data ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const setField = <K extends keyof QuestionFormState>(
    key: K,
    value: QuestionFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const setAltText = (letter: string, text: string) =>
    setForm((prev) => ({
      ...prev,
      alternatives: prev.alternatives.map((a) =>
        a.letter === letter ? { ...a, text } : a,
      ),
    }));

  const markCorrect = (letter: string) =>
    setForm((prev) => ({
      ...prev,
      alternatives: prev.alternatives.map((a) => ({
        ...a,
        is_correct: a.letter === letter,
      })),
    }));

  const supabase = useMemo(() => createClient(), []);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    if (file.size > 6 * 1024 * 1024)
      throw new Error("A imagem deve ter no máximo 6MB.");
    if (!["image/jpeg", "image/png"].includes(file.type))
      throw new Error("Apenas imagens JPG/PNG são aceitas.");

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const { data: userData } = await supabase.auth.getUser();
    const filePath = `${userData.user?.id || "public"}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("questions_media")
      .upload(filePath, file);
    if (uploadError)
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);

    const { data } = supabase.storage
      .from("questions_media")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const buildPayload = (): {
    question: CreateQuestionPayload;
    alternatives: AlternativePayload[];
  } => ({
    question: {
      statement: form.statement.trim(),
      type: form.type,
      origin: form.origin,
      difficulty: form.difficulty || null,
      comment: form.comment.trim() || null,
      answer_key:
        form.type === "multiple_choice"
          ? (form.alternatives.find((a) => a.is_correct)?.letter ?? null)
          : null,
      source: form.source.trim() || null,
      year: form.year ? Number(form.year) : null,
      status: form.status,
      bncc_skill_id: form.bncc_skill_id || null,
      stage_id: form.stage_id || null,
      discipline_id: form.discipline_id || null,
      subject_id: form.subject_id || null,
      grade_id: form.grade_id || null,
      image_url: null, // Statement image now embedded as HTML inline
    },
    alternatives:
      form.type === "multiple_choice"
        ? form.alternatives.map((a) => ({
            letter: a.letter,
            text: a.text,
            is_correct: a.is_correct,
            image_url: a.image_url || null,
          }))
        : [],
  });

  const handleSubmit = async (status: QuestionStatus) => {
    try {
      setIsUploading(true);

      // Note: form.image_file and form.image_url for statement are removed.
      // Images for statement are dynamically uploaded by the RichTextEditor.

      // Upload alternative images if exist
      if (form.type === "multiple_choice") {
        for (let i = 0; i < form.alternatives.length; i++) {
          const alt = form.alternatives[i];
          if (alt.image_file) {
            const url = await uploadImage(alt.image_file);
            alt.image_url = url;
            alt.image_file = null;
          }
        }
      }

      const { question, alternatives } = buildPayload();
      const payload = { question: { ...question, status }, alternatives };

      if (isEdit && editingQuestion) {
        updateQuestion(
          { id: editingQuestion.id, ...payload },
          { onSuccess: onClose },
        );
      } else {
        createQuestion(payload, { onSuccess: onClose });
      }
    } catch (error: any) {
      alert(error.message || "Erro durante o upload da imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl animate-bounce-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              {isEdit ? (
                <Edit2 className="h-4 w-4 text-purple-600" />
              ) : (
                <Plus className="h-4 w-4 text-purple-600" />
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit
                ? `Editar — ${questionDisplayCode(editingQuestion!.id)}`
                : "Nova Questão"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type + Origin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Tipo de Questão</FormLabel>
              <div className="flex gap-2">
                {(["multiple_choice", "discursive"] as QuestionType[]).map(
                  (val) => (
                    <button
                      key={val}
                      onClick={() => setField("type", val)}
                      className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                        form.type === val
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {val === "multiple_choice"
                        ? "Múltipla Escolha"
                        : "Discursiva"}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div>
              <FormLabel>Origem</FormLabel>
              <div className="flex gap-2">
                {(["custom", "system"] as QuestionOrigin[]).map((val) => (
                  <button
                    key={val}
                    onClick={() => setField("origin", val)}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                      form.origin === val
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {val === "custom" ? "Minha" : "Sistema"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Statement */}
          <div className="flex flex-col flex-1">
            <FormLabel required>Enunciado</FormLabel>
            <RichTextEditor
              value={form.statement}
              onChange={(val) => setField("statement", val)}
              onImageUpload={uploadImage}
            />
          </div>

          {/* Alternatives */}
          {form.type === "multiple_choice" && (
            <div>
              <FormLabel>
                Alternativas{" "}
                <span className="font-normal text-slate-400 normal-case ml-1">
                  — clique na letra para marcar o gabarito
                </span>
              </FormLabel>
              <div className="space-y-2">
                {form.alternatives.map((alt) => (
                  <div key={alt.letter} className="flex items-center gap-2">
                    <button
                      onClick={() => markCorrect(alt.letter)}
                      className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold border-2 transition-all ${
                        alt.is_correct
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400"
                      }`}
                    >
                      {alt.letter}
                    </button>
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={alt.text}
                        onChange={(e) => setAltText(alt.letter, e.target.value)}
                        placeholder={`Alternativa ${alt.letter}...`}
                        className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-slate-400 transition-colors pr-10 ${
                          alt.is_correct
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      />
                      <div className="absolute right-1 top-1 flex items-center gap-2">
                        {alt.image_url || alt.image_file ? (
                          <div className="relative group h-8 w-12 rounded-md overflow-hidden border border-slate-200 shadow-sm bg-slate-50 z-10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                alt.image_file
                                  ? URL.createObjectURL(alt.image_file)
                                  : alt.image_url!
                              }
                              alt={`Anexo alternativa ${alt.letter}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() =>
                                  setForm((p) => ({
                                    ...p,
                                    alternatives: p.alternatives.map((a) =>
                                      a.letter === alt.letter
                                        ? {
                                            ...a,
                                            image_file: null,
                                            image_url: null,
                                          }
                                        : a,
                                    ),
                                  }))
                                }
                                className="text-white hover:text-red-400 p-0.5 rounded-full transition-colors"
                                title="Remover anexo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer bg-white p-1 rounded shadow-sm border hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600">
                            <ImagePlus className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setForm((p) => ({
                                    ...p,
                                    alternatives: p.alternatives.map((a) =>
                                      a.letter === alt.letter
                                        ? {
                                            ...a,
                                            image_file: e.target.files![0],
                                          }
                                        : a,
                                    ),
                                  }));
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Disciplina</FormLabel>
              <FormSelect
                value={form.discipline_id}
                onChange={(v) => {
                  setForm((prev) => ({
                    ...prev,
                    discipline_id: v,
                    subject_id: "",
                  }));
                }}
              >
                <option value="">Selecionar...</option>
                {disciplines.map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Assunto</FormLabel>
              <FormSelect
                value={form.subject_id}
                onChange={(v) => setField("subject_id", v)}
              >
                <option value="">
                  {isFetchingSubjects
                    ? "Carregando..."
                    : form.discipline_id
                      ? "Selecionar..."
                      : "Selecione a disciplina primeiro"}
                </option>
                {subjects.map((s: { id: string; name: string }) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Dificuldade</FormLabel>
              <FormSelect
                value={form.difficulty}
                onChange={(v) =>
                  setField("difficulty", v as QuestionDifficulty | "")
                }
              >
                <option value="">Selecionar...</option>
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Etapa de Ensino</FormLabel>
              <FormSelect
                value={form.stage_id}
                onChange={(v) => setField("stage_id", v)}
              >
                <option value="">Selecionar...</option>
                {stages.map((s: { id: string; name: string }) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Série</FormLabel>
              <FormSelect
                value={form.grade_id}
                onChange={(v) => setField("grade_id", v)}
              >
                <option value="">Selecionar...</option>
                {grades.map((g: { id: string; name: string }) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Fonte</FormLabel>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                placeholder="Ex: ENEM 2023"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-slate-400"
              />
            </div>
            <div>
              <FormLabel>Ano</FormLabel>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="Ex: 2024"
                min={1900}
                max={2100}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-slate-400"
              />
            </div>
            <div className="col-span-2">
              <FormLabel>Habilidade BNCC</FormLabel>
              <FormSelect
                value={form.bncc_skill_id}
                onChange={(v) => setField("bncc_skill_id", v)}
              >
                <option value="">Selecionar...</option>
                {(bnccSkills ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.description}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          {/* Comment */}
          <div>
            <FormLabel>Comentário / Resolução</FormLabel>
            <RichTextEditor
              value={form.comment}
              onChange={(val) => setField("comment", val)}
              onImageUpload={uploadImage}
              wrapperClassName="border-amber-100 focus-within:ring-amber-500/20 focus-within:border-amber-400 bg-amber-50/50 min-h-[140px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <div className="flex gap-2 items-center">
            {isUploading && (
              <span className="text-xs text-purple-600 flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </span>
            )}
            <button
              onClick={() => handleSubmit("draft")}
              disabled={!form.statement.trim() || isPending || isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 disabled:opacity-40"
            >
              Salvar rascunho
            </button>
            <button
              onClick={() => handleSubmit("active")}
              disabled={!form.statement.trim() || isPending || isUploading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm disabled:opacity-40"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Publicar questão"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// InactivateConfirmModal
// ─────────────────────────────────────────────────────────────
function InactivateConfirmModal({
  question,
  isDeleting,
  onConfirm,
  onClose,
}: {
  question: Question;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-bounce-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Archive className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Inativar Questão
          </h2>
        </div>
        <p className="text-sm text-slate-600 mb-1">
          Tem certeza que deseja inativar a questão{" "}
          <span className="font-bold text-slate-800">
            {questionDisplayCode(question.id)}
          </span>
          ?
        </p>
        <p className="text-xs text-slate-500 mb-4">
          Ela será movida para a aba &quot;Inativas&quot; e não estará mais
          disponível para novas avaliações, preservando todos os dados.
        </p>
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5 line-clamp-2 mb-5">
          {question.statement.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sim, inativar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ActivateConfirmModal
// ─────────────────────────────────────────────────────────────
function ActivateConfirmModal({
  question,
  isActivating,
  onConfirm,
  onClose,
}: {
  question: Question;
  isActivating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-bounce-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <RefreshCw className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Ativar Questão</h2>
        </div>
        <p className="text-sm text-slate-600 mb-1">
          Tem certeza que deseja ativar novamente a questão{" "}
          <span className="font-bold text-slate-800">
            {questionDisplayCode(question.id)}
          </span>
          ?
        </p>
        <p className="text-xs text-slate-500 mb-4">
          Ela voltará para a lista de "Todas" as questões e poderá ser usada
          novamente.
        </p>
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5 line-clamp-2 mb-5">
          {question.statement.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isActivating}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60"
          >
            {isActivating && <Loader2 className="h-4 w-4 animate-spin" />}
            Sim, ativar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────
function FilterSelect({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700 disabled:cursor-not-allowed"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}



function ActionBtn({
  children,
  title,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function FormLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FormSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
        {icon}
      </div>
      <p className="text-base font-bold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

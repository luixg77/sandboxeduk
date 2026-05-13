'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSummary } from '@/components/ui/HeroSummary';
import {
  useLessonPlans, useCreateLessonPlan, useUpdateLessonPlan,
  useDeleteLessonPlan, useImportLessonPlans,
  useDisciplines, useGrades, useProjects,
} from '@/hooks/useAdminData';
import { createClient } from '@/lib/supabase/client';
import { CourseExclusiveBadge } from '@/components/admin/CourseExclusiveBadge';
import type { TipoDocumento, TipoConteudo, PlanStatus, PlanOrigin, LessonPlan } from './types';
import {
  Plus, Search, SlidersHorizontal, X, Edit2,
  FileText, Layers, Upload, BookOpen,
  ChevronDown, Trash2, Download, Zap,
  ClipboardList, List, Tag, Hash,
  FileUp, PenLine, Clock, CheckCircle2,
  BookMarked, Star, MoreVertical, Globe, Eye,
  Image as ImageIcon, ChevronLeft, ChevronRight,
  Volume2, Accessibility, BarChart2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const TIPO_DOC_CONFIG: Record<TipoDocumento, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  plano_aula:         { label: 'Plano de Aula',      color: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: FileText },
  sequencia_didatica: { label: 'Sequência Didática', color: 'bg-violet-50 text-violet-700 border-violet-200', Icon: Layers   },
  material_diverso:   { label: 'Material Diverso',   color: 'bg-sky-50 text-sky-700 border-sky-200',          Icon: BookOpen },
};

const ACCENT_COLORS: Record<TipoDocumento, string> = {
  plano_aula:         'from-indigo-500 to-blue-500',
  sequencia_didatica: 'from-violet-500 to-purple-500',
  material_diverso:   'from-sky-500 to-cyan-500',
};

const STATUS_CONFIG: Record<PlanStatus, { label: string; cls: string }> = {
  rascunho:  { label: 'Rascunho',  cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  publicado: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const TABS = [
  { id: 'todos',     label: 'Todos',          Icon: List       },
  { id: 'meus',      label: 'Meus Materiais', Icon: BookMarked },
  { id: 'sistema',   label: 'Sistema',        Icon: Globe      },
  { id: 'favoritos', label: 'Favoritos',      Icon: Star       },
] as const;
type TabId = typeof TABS[number]['id'];

const FAVORITES_KEY = 'kodar_plan_favorites';

function usePlanFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { favorites, toggle };
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function PlanosAulaPage() {
  const router = useRouter();
  const { favorites, toggle: toggleFavorite } = usePlanFavorites();

  const [page, setPage]               = useState(1);
  const LIMIT = 10;
  const [search, setSearch]           = useState('');
  const [filterTipo, setFilterTipo]   = useState('');
  const [filterDisc, setFilterDisc]   = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterInteractive, setFilterInteractive] = useState('');
  const [filterPcd, setFilterPcd]     = useState('');
  const [filterDownload, setFilterDownload] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [activeTab, setActiveTab]     = useState<TabId>('todos');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pdfPlan, setPdfPlan]         = useState<LessonPlan | null>(null);
  const [showImport, setShowImport]   = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const originFilter = activeTab === 'meus' ? 'custom' : activeTab === 'sistema' ? 'sistema' : (filterOrigin || undefined);

  const filters = useMemo(() => ({
    search:      debouncedSearch || undefined,
    tipo_documento: filterTipo || undefined,
    discipline_id:  filterDisc || undefined,
    grade_id:       filterGrade || undefined,
    status:         filterStatus || undefined,
    origin:         originFilter,
    interactive:    filterInteractive === 'sim' ? true : filterInteractive === 'nao' ? false : undefined,
    can_download:   filterDownload === 'sim' ? true : filterDownload === 'nao' ? false : undefined,
    pcd_sign:        filterPcd === 'libras' ? true : undefined,
    pcd_voice:       filterPcd === 'audio' ? true : undefined,
    audience: (filterAudience === 'professor' ? 'professor'
            : filterAudience === 'aluno'     ? 'aluno'
            : undefined) as 'professor' | 'aluno' | undefined,
  }), [debouncedSearch, filterTipo, filterDisc, filterGrade, filterStatus, originFilter, filterInteractive, filterDownload, filterPcd, filterAudience]);

  const { data: plansRes, isLoading } = useLessonPlans(filters, page, LIMIT);
  const plans       = plansRes?.data ?? [];
  const totalCount  = plansRes?.count ?? 0;
  const totalPages  = Math.ceil(totalCount / LIMIT) || 1;

  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: gradesRes }      = useGrades(1, 100);
  const { data: projectsRes }    = useProjects(1, 100);
  const disciplines = disciplinesRes?.data ?? [];
  const grades      = gradesRes?.data      ?? [];
  const projects    = projectsRes?.data    ?? [];

  const { mutateAsync: createPlan, isPending: isCreating } = useCreateLessonPlan();
  const { mutateAsync: updatePlan, isPending: isUpdating } = useUpdateLessonPlan();
  const { mutate: deletePlan,      isPending: isDeleting } = useDeleteLessonPlan();

  // Favorites are client-side only — filter locally if on favorites tab
  const visiblePlans = activeTab === 'favoritos'
    ? plans.filter(p => favorites.has(p.id))
    : plans;

  const hasFilters = Boolean(search || filterTipo || filterAudience || filterDisc || filterGrade || filterStatus || filterOrigin || filterInteractive || filterPcd || filterDownload);
  const clearFilters = () => {
    setSearch(''); setFilterTipo(''); setFilterAudience(''); setFilterDisc(''); setFilterGrade('');
    setFilterStatus(''); setFilterOrigin(''); setFilterInteractive('');
    setFilterPcd(''); setFilterDownload('');
    setPage(1);
  };

  const handleCreate = async (payload: Record<string, any>) => {
    const plan = await createPlan(payload);
    setShowCreate(false);
    if (payload.tipo_conteudo === 'texto') {
      router.push(`/admin/gestao-conteudos/planos-aula/editor?id=${plan.id}`);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, any>) => {
    await updatePlan({ id, payload });
    setEditingPlan(null);
    setShowCreate(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <HeroSummary
        title="Acervo Pedagógico"
        description="Gerencie planos de aula, sequências didáticas e materiais do acervo"
        icon={<ClipboardList className="w-8 h-8 text-white" />}
        themeClass="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white/20 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" /> Importar Acervo
          </button>
          <button
            onClick={() => { setEditingPlan(null); setShowCreate(true); }}
            className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Plano
          </button>
        </div>
      </HeroSummary>

      <div className="flex flex-1 gap-5 p-5 min-h-0 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filtros</span>
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {filtersOpen && (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Título, palavra-chave..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <FilterSelect label="Tipo de Material" value={filterTipo} onChange={v => { setFilterTipo(v); setPage(1); }}>
                <option value="">Todos</option>
                <option value="plano_aula">Plano de Aula</option>
                <option value="sequencia_didatica">Seq. Didática</option>
                <option value="material_diverso">Material Diverso</option>
              </FilterSelect>

              <FilterSelect label="Público-Alvo" value={filterAudience} onChange={v => { setFilterAudience(v); setPage(1); }}>
                <option value="">Todos</option>
                <option value="professor">Professores</option>
                <option value="aluno">Alunos</option>
              </FilterSelect>

              {disciplines.length > 0 && (
                <FilterSelect label="Disciplina" value={filterDisc} onChange={v => { setFilterDisc(v); setPage(1); }}>
                  <option value="">Todas</option>
                  {disciplines.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </FilterSelect>
              )}

              {grades.length > 0 && (
                <FilterSelect label="Série / Ano" value={filterGrade} onChange={v => { setFilterGrade(v); setPage(1); }}>
                  <option value="">Todas</option>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </FilterSelect>
              )}

              <FilterSelect label="Status" value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }}>
                <option value="">Todos</option>
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
              </FilterSelect>

              <FilterSelect label="Interatividade" value={filterInteractive} onChange={v => { setFilterInteractive(v); setPage(1); }}>
                <option value="">Todos</option>
                <option value="sim">Interativo</option>
                <option value="nao">Não interativo</option>
              </FilterSelect>

              <FilterSelect label="Acessibilidade" value={filterPcd} onChange={v => { setFilterPcd(v); setPage(1); }}>
                <option value="">Todas</option>
                <option value="libras">Com Libras</option>
                <option value="audio">Com Narração</option>
              </FilterSelect>

              <FilterSelect label="Download" value={filterDownload} onChange={v => { setFilterDownload(v); setPage(1); }}>
                <option value="">Todos</option>
                <option value="sim">✓ Disponível</option>
                <option value="nao">Indisponível</option>
              </FilterSelect>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                >
                  <X className="h-3.5 w-3.5" /> Limpar filtros
                </button>
              )}
            </div>
          )}

          <div className="mt-auto p-4 border-t border-slate-100 space-y-2">
            {[
              { label: 'Total', value: totalCount, color: 'text-slate-700' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{s.label}</span>
                <span className={`text-[11px] font-bold tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'favoritos' && favorites.size > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${
                    activeTab === 'favoritos' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {favorites.size}
                  </span>
                )}
              </button>
            ))}
            <div className="ml-auto pr-2 text-xs text-slate-400 font-medium">
              {totalCount} {totalCount === 1 ? 'item' : 'itens'}
            </div>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse flex">
                  <div className="w-[160px] shrink-0 bg-slate-100 h-[200px]" />
                  <div className="flex-1 p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-5 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && visiblePlans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <ClipboardList className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-700">
                {activeTab === 'favoritos' ? 'Nenhum favorito ainda' : hasFilters ? 'Nenhum resultado' : 'Nenhum material criado ainda'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {hasFilters ? 'Tente remover os filtros.' : 'Crie ou importe materiais.'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* List */}
          {!isLoading && visiblePlans.length > 0 && (
            <div className="space-y-3">
              {visiblePlans.map((plan) => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  disciplines={disciplines}
                  isFav={favorites.has(plan.id)}
                  onFavorite={() => toggleFavorite(plan.id)}
                  onEdit={() => { setEditingPlan(plan); setShowCreate(true); }}
                  onDelete={() => setConfirmDelete(plan.id)}
                  onOpenEditor={() => router.push(`/admin/gestao-conteudos/planos-aula/editor?id=${plan.id}`)}
                  onViewFile={() => setPdfPlan(plan)}
                  onToggleStatus={() => updatePlan({ id: plan.id, payload: { status: plan.status === 'publicado' ? 'rascunho' : 'publicado' } })}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 font-medium px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <PlanFormModal
          editingPlan={editingPlan}
          disciplines={disciplines}
          grades={grades}
          projects={projects}
          isSubmitting={isCreating || isUpdating}
          onClose={() => { setShowCreate(false); setEditingPlan(null); }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportAcervoModal
          onClose={() => setShowImport(false)}
        />
      )}

      {/* PDF/File Viewer */}
      {pdfPlan && pdfPlan.file_url && (
        <FileViewerModal
          title={pdfPlan.title}
          url={pdfPlan.file_url}
          onClose={() => setPdfPlan(null)}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-bold text-slate-800">Excluir material?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { deletePlan(confirmDelete); setConfirmDelete(null); }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlanListItem — layout horizontal tipo acervo
// ─────────────────────────────────────────────────────────────
const ACCENT_BG: Record<TipoDocumento, string> = {
  plano_aula:         'bg-indigo-600',
  sequencia_didatica: 'bg-violet-600',
  material_diverso:   'bg-sky-500',
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(value) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`}
        />
      ))}
    </div>
  );
}

function PlanListItem({
  plan, disciplines, isFav, onFavorite, onEdit, onDelete, onOpenEditor, onViewFile, onToggleStatus,
}: {
  plan: LessonPlan;
  disciplines: any[];
  isFav: boolean;
  onFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenEditor: () => void;
  onViewFile: () => void;
  onToggleStatus: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const discColor = useMemo(() => {
    if (!plan.disciplina) return '#6366f1';
    const match = disciplines.find((d: any) => d.name === plan.disciplina);
    return match?.color_hex ?? '#6366f1';
  }, [plan.disciplina, disciplines]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setDetailsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avgRating = plan.ratings > 0 ? plan.total_rating / plan.ratings : 0;
  const breadcrumb = [plan.serie, plan.disciplina].filter(Boolean).join(' > ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Left: colored bookmark + thumbnail */}
        <div className="flex shrink-0">
          <div className={`w-2 ${ACCENT_BG[plan.tipo_documento]}`} />
          <div className="w-[160px] h-[200px] overflow-hidden shrink-0 relative">
            {plan.thumbnail && !thumbError
              ? <img src={plan.thumbnail} alt={plan.title} className="w-full h-full object-cover" onError={() => setThumbError(true)} />
              : (
                <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
                  plan.tipo_documento === 'plano_aula' ? 'bg-indigo-50' :
                  plan.tipo_documento === 'material_diverso' ? 'bg-sky-50' : 'bg-violet-50'
                }`}>
                  {plan.tipo_documento === 'plano_aula'
                    ? <FileText className="h-12 w-12 text-indigo-300" />
                    : plan.tipo_documento === 'sequencia_didatica'
                    ? <Layers className="h-12 w-12 text-violet-300" />
                    : <BookOpen className="h-12 w-12 text-sky-300" />
                  }
                  <span className="text-[10px] font-semibold text-center px-2 leading-tight text-slate-400">
                    {TIPO_DOC_CONFIG[plan.tipo_documento].label}
                  </span>
                </div>
              )
            }
          </div>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-1.5">
          {/* Top row: UID, rating, accessibility, discipline */}
          <div className="flex items-center gap-2 flex-wrap">
            {plan.uid_external && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                UID: {plan.uid_external}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_CONFIG[plan.status]?.cls ?? ''}`}>
              {STATUS_CONFIG[plan.status]?.label ?? plan.status}
            </span>
            {avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                <StarRating value={avgRating} />
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {plan.pcd_sign && (
                <span title="Língua de Sinais" className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold">
                  🤟
                </span>
              )}
              {plan.pcd_voice && (
                <span title="Narração em Áudio" className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs">
                  🔊
                </span>
              )}
              {plan.disciplina && (
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: discColor }}
                >
                  {plan.disciplina}
                </span>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          {breadcrumb && (
            <p className="text-xs text-slate-400 font-medium">{breadcrumb}</p>
          )}

          {/* Title */}
          <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
            {plan.title}
          </h3>
          {plan.course && (
            <div>
              <CourseExclusiveBadge course={plan.course} />
            </div>
          )}

          {/* Description */}
          {plan.description && (
            <div>
              <p className={`text-sm text-slate-600 leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
                <span className="font-semibold text-slate-700">Objetivo/Descrição: </span>
                {plan.description}
              </p>
              {plan.description.length > 180 && (
                <button
                  onClick={() => setDescExpanded(v => !v)}
                  className="mt-0.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  {descExpanded ? 'Ver menos ▴' : 'Ver mais ▾'}
                </button>
              )}
            </div>
          )}

          {/* Keywords */}
          {plan.keywords && (
            <p className="text-xs text-slate-400 line-clamp-1">
              <span className="font-semibold">Palavras-chave:</span> {plan.keywords}
            </p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        {/* Left actions */}
        <div className="flex items-center gap-2">
          {plan.can_download && plan.file_url && (
            <a
              href={plan.file_url}
              target="_blank"
              rel="noreferrer"
              title="Baixar"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            title={isFav ? 'Desfavoritar' : 'Favoritar'}
            onClick={onFavorite}
            className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
              isFav ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100' : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-amber-500'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Right: DETALHES dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 border-indigo-600 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors"
          >
            DETALHES <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
          {detailsOpen && (
            <div className="absolute right-0 bottom-10 z-30 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
              {plan.file_url && (
                <button onClick={() => { setDetailsOpen(false); onViewFile(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Visualizar arquivo
                </button>
              )}
              {plan.tipo_conteudo === 'texto' && (
                <button onClick={() => { setDetailsOpen(false); onOpenEditor(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <PenLine className="h-3.5 w-3.5" /> Abrir Editor
                </button>
              )}
              <button onClick={() => { setDetailsOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Edit2 className="h-3.5 w-3.5" /> Editar metadados
              </button>
              <button onClick={() => { setDetailsOpen(false); onToggleStatus(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {plan.status === 'publicado' ? 'Mover p/ Rascunho' : 'Publicar'}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={() => { setDetailsOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ImportAcervoModal — importa o JSON raspado do Evoluir
// ─────────────────────────────────────────────────────────────
function ImportAcervoModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(0);
  const { mutateAsync: importPlans } = useImportLessonPlans();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleFile = async (f: File) => {
    setError('');
    setFile(f);
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('O arquivo deve ser um array JSON');
      setPreview(data);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao ler o arquivo');
      setFile(null);
    }
  };

  const typeCount = (preview ?? []).reduce((acc: Record<string, number>, item: any) => {
    const t = item.type ?? 'Desconhecido';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError('');
    try {
      const rows = preview.map((item: any) => {
        const classifier = (item.classifiers ?? [])[0] ?? {};
        return {
          title:          item.title ?? '',
          description:    item.description ?? '',
          tipo_documento:  'material_diverso',
          tipo_conteudo:   'arquivo',
          disciplina:      classifier.discipline ?? '',
          serie:           classifier.grade ?? '',
          subject:         '',
          skills:          item.bncc ? [item.bncc.trim()] : [],
          projetos:        [],
          keywords:        item.keywords ?? null,
          thumbnail:       item.thumbnail ?? null,
          file_url:        item.file_url ?? null,
          file_name:       item.title ?? null,
          origin:          'sistema',
          status:          'publicado',
          uid_external:    item.uid ?? null,
          medium_id:       item.medium_id ?? null,
          interactive:     item.interactive ?? false,
          can_download:    item.can_download ?? true,
          pcd_sign:        item.pcd_sign ?? false,
          pcd_voice:       item.pcd_voice ?? false,
          ratings:         item.ratings ?? 0,
          total_rating:    item.total_rating ?? 0,
          source_platform: item.from ?? 'evoluir',
          classifiers:     item.classifiers ?? null,
        };
      });
      const result = await importPlans(rows);
      setImported(result.inserted);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!importing ? onClose : undefined} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <Upload className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Importar Acervo</h2>
          </div>
          {!importing && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-800 mb-1">Importação concluída!</p>
              <p className="text-sm text-slate-500 mb-6">{imported} materiais importados com sucesso.</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {!preview ? (
                <label className="flex flex-col items-center justify-center gap-3 h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-sky-300 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">Selecione o arquivo JSON</p>
                    <p className="text-xs text-slate-400 mt-0.5">evoluir_acervo.json · máx. 50 MB</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </label>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{file?.name}</span>
                    <button onClick={() => { setPreview(null); setFile(null); }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      Trocar
                    </button>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{preview.length}</span> itens encontrados
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(typeCount).map(([t, c]) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                        {t}: {c as number}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Todos serão importados como <strong>Material Diverso</strong> com origem <strong>Sistema</strong>.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {preview && (
                <div className="flex justify-end gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Importar {preview.length} itens
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlanFormModal
// ─────────────────────────────────────────────────────────────
function PlanFormModal({
  editingPlan, disciplines, grades, projects, isSubmitting, onClose, onCreate, onUpdate,
}: {
  editingPlan: LessonPlan | null;
  disciplines: { id: string; name: string }[];
  grades: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: Record<string, any>) => void;
  onUpdate: (id: string, payload: Record<string, any>) => void;
}) {
  const isEdit = Boolean(editingPlan);

  const empty = {
    title: '', description: '', tipo_documento: 'plano_aula' as TipoDocumento,
    projetos: [] as string[], subject: '',
    discipline_id: null as string | null, disciplina: '',
    grade_id: null as string | null, serie: '',
    skills: [] as string[], tipo_conteudo: 'texto' as TipoConteudo,
    file_name: null as string | null, file_url: null as string | null,
    keywords: '', origin: 'custom' as PlanOrigin, status: 'rascunho' as PlanStatus,
  };

  const [form, setFormState] = useState(editingPlan ? {
    title:        editingPlan.title,
    description:  editingPlan.description,
    tipo_documento: editingPlan.tipo_documento,
    projetos:      editingPlan.projetos ?? [],
    subject:      editingPlan.subject ?? '',
    discipline_id: editingPlan.discipline_id,
    disciplina:    editingPlan.disciplina ?? '',
    grade_id:      editingPlan.grade_id,
    serie:         editingPlan.serie ?? '',
    skills:       editingPlan.skills ?? [],
    tipo_conteudo: editingPlan.tipo_conteudo,
    file_name:     editingPlan.file_name,
    file_url:      editingPlan.file_url,
    keywords:      editingPlan.keywords ?? '',
    origin:        editingPlan.origin,
    status:        editingPlan.status,
  } : empty);

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [onClose]);

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t || form.skills.includes(t)) return;
    setField('skills', [...form.skills, t]);
    setSkillInput('');
  };

  const handleFileSelect = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext ?? '')) { setUploadError('Use PDF, DOC ou DOCX.'); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError('Máximo 20 MB.'); return; }
    setUploadError('');
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `plans/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage.from('lesson-plans-files').upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('lesson-plans-files').getPublicUrl(data.path);
      setFormState((prev) => ({ ...prev, file_name: file.name, file_url: publicUrl }));
    } catch { setUploadError('Erro ao fazer upload.'); }
    finally { setUploading(false); }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Título obrigatório';
    if (form.tipo_conteudo === 'arquivo' && !form.file_name) errs.arquivo = 'Selecione um arquivo';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      tipo_documento: form.tipo_documento,
      tipo_conteudo: form.tipo_conteudo,
      projetos:      form.projetos,
      subject:      form.subject.trim(),
      discipline_id: form.discipline_id,
      disciplina:    form.disciplina,
      grade_id:      form.grade_id,
      serie:         form.serie,
      skills:        form.skills,
      keywords:      form.keywords || null,
      file_name:     form.tipo_conteudo === 'arquivo' ? form.file_name : null,
      file_url:      form.tipo_conteudo === 'arquivo' ? form.file_url : null,
      origin:        form.origin,
      status:        form.status,
      content:       null,
    };
    if (isEdit && editingPlan) onUpdate(editingPlan.id, payload);
    else onCreate(payload);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Editar Material' : 'Novo Plano / Sequência'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tipo documento */}
          <div>
            <FormLabel required>Tipo de documento</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'plano_aula',        label: 'Plano de Aula',    Icon: FileText, color: 'indigo' },
                { value: 'sequencia_didatica', label: 'Seq. Didática',   Icon: Layers,   color: 'violet' },
                { value: 'material_diverso',   label: 'Mat. Diverso',    Icon: BookOpen, color: 'sky'    },
              ] as const).map(({ value, label, Icon, color }) => (
                <button key={value} type="button" onClick={() => setField('tipo_documento', value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                    form.tipo_documento === value
                      ? color === 'indigo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : color === 'violet' ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <FormLabel required>Título</FormLabel>
            <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)}
              placeholder="Ex: Plano de Aula — Frações"
              className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 ${errors.title ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Descrição */}
          <div>
            <FormLabel>Descrição</FormLabel>
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
              placeholder="Objetivo do material..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Disciplina + Série */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Disciplina</FormLabel>
              {disciplines.length > 0 ? (
                <FormSelect value={form.discipline_id ?? ''} onChange={(v) => {
                  const disc = disciplines.find((d: any) => d.id === v);
                  setFormState((prev) => ({ ...prev, discipline_id: v || null, disciplina: disc?.name ?? '' }));
                }}>
                  <option value="">Selecionar...</option>
                  {disciplines.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </FormSelect>
              ) : (
                <input type="text" value={form.disciplina} onChange={(e) => setFormState((prev) => ({ ...prev, discipline_id: null, disciplina: e.target.value }))}
                  placeholder="Ex: Matemática"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                />
              )}
            </div>
            <div>
              <FormLabel>Série / Ano</FormLabel>
              {grades.length > 0 ? (
                <FormSelect value={form.grade_id ?? ''} onChange={(v) => {
                  const grade = grades.find((g: any) => g.id === v);
                  setFormState((prev) => ({ ...prev, grade_id: v || null, serie: grade?.name ?? '' }));
                }}>
                  <option value="">Selecionar...</option>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </FormSelect>
              ) : (
                <input type="text" value={form.serie} onChange={(e) => setFormState((prev) => ({ ...prev, grade_id: null, serie: e.target.value }))}
                  placeholder="Ex: 6º Ano"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                />
              )}
            </div>
          </div>

          {/* Assunto + Keywords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Assunto / Tema</FormLabel>
              <input type="text" value={form.subject} onChange={(e) => setField('subject', e.target.value)}
                placeholder="Ex: Frações equivalentes"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
            <div>
              <FormLabel>Palavras-chave</FormLabel>
              <input type="text" value={form.keywords ?? ''} onChange={(e) => setField('keywords', e.target.value)}
                placeholder="Ex: frações, divisão..."
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Habilidades */}
          <div>
            <FormLabel>Habilidades (BNCC)</FormLabel>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Ex: EF06MA13 — Enter para adicionar"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
              />
              <button type="button" onClick={addSkill} className="px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((h) => (
                  <span key={h} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                    <Hash className="h-2.5 w-2.5" />
                    {h}
                    <button onClick={() => setField('skills', form.skills.filter(x => x !== h))} className="ml-0.5 text-teal-500 hover:text-teal-800">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status + Origem */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(v) => setField('status', v as PlanStatus)}>
                <option value="rascunho">Rascunho</option>
                <option value="publicado">Publicado</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Origem</FormLabel>
              <FormSelect value={form.origin} onChange={(v) => setField('origin', v as PlanOrigin)}>
                <option value="custom">Meus Materiais</option>
                <option value="sistema">Sistema</option>
              </FormSelect>
            </div>
          </div>

          {/* Tipo conteúdo */}
          <div>
            <FormLabel required>Tipo de conteúdo</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'texto',   label: 'Editor de texto',  Icon: PenLine, hint: 'Editor Notion-style' },
                { value: 'arquivo', label: 'Upload de arquivo', Icon: FileUp,  hint: 'PDF, DOC, DOCX'     },
              ] as const).map(({ value, label, Icon, hint }) => (
                <button key={value} type="button" onClick={() => setField('tipo_conteudo', value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.tipo_conteudo === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] opacity-70">{hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          {form.tipo_conteudo === 'arquivo' && (
            <div>
              <FormLabel required>Arquivo</FormLabel>
              {form.file_name ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                  <span className="text-sm text-slate-700 font-medium flex-1 truncate">{form.file_name}</span>
                  {form.file_url && (
                    <a href={form.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline shrink-0">Ver</a>
                  )}
                  <button onClick={() => setFormState((prev) => ({ ...prev, arquivo_nome: null, file_url: null }))} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-3 h-28 border-2 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''} ${errors.arquivo ? 'border-red-400' : 'border-slate-200'}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-slate-500">Enviando...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-slate-400" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600">Clique para selecionar</p>
                        <p className="text-xs text-slate-400">PDF, DOC, DOCX · máx. 20 MB</p>
                      </div>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                </label>
              )}
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              {errors.arquivo && <p className="text-xs text-red-500 mt-1">{errors.arquivo}</p>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || uploading || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Salvando...</>
            ) : isEdit ? 'Salvar alterações'
              : form.tipo_conteudo === 'texto'
                ? <><PenLine className="h-4 w-4" /> Criar e Abrir Editor</>
                : <><FileUp className="h-4 w-4" /> Salvar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FileViewerModal
// ─────────────────────────────────────────────────────────────
function FileViewerModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [onClose]);

  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('pdf');
  const embedUrl = isPdf ? url : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-[400] flex flex-col">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col m-4 md:m-8 rounded-2xl overflow-hidden shadow-2xl bg-white" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
            <span className="text-sm font-bold text-slate-800 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200">
              <Eye className="h-3.5 w-3.5" /> Abrir em nova aba
            </a>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100">
          <iframe src={embedUrl} title={title} className="w-full h-full border-0" style={{ minHeight: '70vh' }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────
function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FormSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

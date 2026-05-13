"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  useSimulators,
  useSimulatorKnowledgeAreas,
  useSimulatorSources,
  useInactivateSimulator,
  useActivateSimulator,
  Simulator,
  SortOrder,
} from '@/hooks/useSimulators';
import { SimulatorCard } from '@/components/simulators/SimulatorCard';
import { SimulationViewer } from '@/components/simulators/SimulationViewer';
import { DeleteSimulatorModal } from '@/components/simulators/DeleteSimulatorModal';
import { HeroSummary } from '@/components/ui/HeroSummary';
import {
  Search,
  Loader2,
  Cuboid,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
  ArrowDown,
  ArrowUp,
  List,
  Archive,
  RefreshCw,
} from 'lucide-react';

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
// Filter sidebar select component
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
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-700 disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: 'Todos', Icon: List },
  { id: 'inactive', label: 'Inativos', Icon: Archive },
] as const;
type TabId = (typeof TABS)[number]['id'];

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SimulatorsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Filters
  const [knowledgeArea, setKnowledgeArea] = useState('');
  const [source, setSource] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Modals
  const [selectedSimulator, setSelectedSimulator] = useState<Simulator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Simulator | null>(null);

  // Queries
  const statusFilter = activeTab === 'inactive' ? 'inactive' : 'active';
  const { data, isLoading, error } = useSimulators({
    page,
    pageSize: limit,
    search: debouncedSearch,
    knowledgeArea,
    source,
    status: statusFilter,
    sortOrder,
  });

  const { data: knowledgeAreas } = useSimulatorKnowledgeAreas();
  const { data: sources } = useSimulatorSources();

  // Mutations
  const { mutate: inactivateSimulator, isPending: isInactivating } = useInactivateSimulator();
  const { mutate: activateSimulator } = useActivateSimulator();

  const simulators = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.pageCount || 0;

  // Reset page on filter/tab changes
  useEffect(() => { setPage(1); }, [debouncedSearch, knowledgeArea, source, activeTab]);

  const hasActiveFilters = Boolean(debouncedSearch || knowledgeArea || source);
  const activeFilterCount = [debouncedSearch, knowledgeArea, source].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setKnowledgeArea('');
    setSource('');
    setPage(1);
  };

  const handleOpenViewer = (simulator: Simulator) => {
    setSelectedSimulator(simulator);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseViewer = () => {
    setSelectedSimulator(null);
    document.body.style.overflow = 'auto';
  };

  const handleInactivateConfirm = () => {
    if (!deleteTarget) return;
    inactivateSimulator(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleActivate = (simulator: Simulator) => {
    activateSimulator(simulator.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Hero ── */}
      <div className="px-4 sm:px-8 pt-6 sm:pt-8">
        <Link
          href="/admin/gestao-conteudos"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
        </Link>

        <HeroSummary
          title="Simuladores 3D"
          description="Acesse e gerencie laboratórios virtuais e simulações interativas."
          icon={<Cuboid className="w-8 h-8 text-white" />}
          themeClass="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
        >
          <Link
            href="/admin/gestao-conteudos/simuladores-3d/novo"
            className="flex items-center gap-2 bg-white text-slate-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Simulador
          </Link>
        </HeroSummary>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-4 sm:gap-6 px-4 sm:px-8 pb-16 items-start">
        {/* ═══════════ FILTER SIDEBAR ═══════════ */}
        <aside
          className={`shrink-0 sticky top-8 transition-all duration-300 hidden sm:block ${
            filtersOpen ? 'w-56 lg:w-64' : 'w-12'
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              {filtersOpen && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-bold text-slate-700">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
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
                {/* Buscar */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Título, tópico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 placeholder-slate-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Área de Conhecimento */}
                <FilterSelect
                  label="Área de Conhecimento"
                  value={knowledgeArea}
                  onChange={setKnowledgeArea}
                >
                  <option value="">Todas</option>
                  {(knowledgeAreas || []).map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </FilterSelect>

                {/* Fonte */}
                <FilterSelect
                  label="Fonte"
                  value={source}
                  onChange={setSource}
                >
                  <option value="">Todas</option>
                  {(sources || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile search */}
            <div className="relative w-full sm:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar simulador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Results bar */}
          {!isLoading && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {totalCount} {totalCount === 1 ? 'simulador' : 'simuladores'}
              </span>
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all shadow-sm"
                title={sortOrder === 'newest' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
              >
                {sortOrder === 'newest' ? (
                  <ArrowDown className="w-3 h-3 text-slate-500" />
                ) : (
                  <ArrowUp className="w-3 h-3 text-slate-500" />
                )}
                {sortOrder === 'newest' ? '+ Mais recentes' : '+ Mais antigas'}
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse flex items-center gap-4"
                >
                  <div className="w-20 h-14 bg-slate-100 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-4 w-24 bg-slate-100 rounded-full" />
                      <div className="h-4 w-16 bg-slate-100 rounded-full" />
                    </div>
                    <div className="h-4 w-1/3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
                <Cuboid className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-base font-bold text-slate-700">Erro ao carregar simuladores</p>
              <p className="text-sm text-slate-400 mt-1">{(error as Error).message}</p>
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && !error && simulators.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
                {activeTab === 'inactive' ? (
                  <Archive className="h-8 w-8 text-slate-300" />
                ) : (
                  <Cuboid className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                {activeTab === 'inactive'
                  ? 'Nenhum simulador inativo'
                  : 'Nenhum simulador encontrado'
                }
              </h3>
              <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
                {hasActiveFilters
                  ? 'Tente remover alguns filtros.'
                  : activeTab === 'inactive'
                    ? 'Simuladores inativados aparecerão aqui.'
                    : 'Crie seu primeiro simulador clicando em "+ Novo Simulador".'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* ── Cards list ── */}
          {!isLoading && !error && simulators.length > 0 && (
            <>
              <div className="flex flex-col space-y-3">
                {simulators.map((simulator) => (
                  <SimulatorCard
                    key={simulator.id}
                    simulator={simulator}
                    onOpenViewer={handleOpenViewer}
                    onInactivate={setDeleteTarget}
                    onActivate={handleActivate}
                    showInactiveActions={activeTab === 'inactive'}
                  />
                ))}
              </div>

              {/* Pagination */}
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
                        onClick={() => typeof p === 'number' && setPage(p)}
                        disabled={p === '...'}
                        className={`flex items-center justify-center h-9 min-w-[36px] px-2 text-sm font-medium rounded-lg transition-colors ${
                          p === page
                            ? 'bg-slate-700 text-white border border-slate-700 shadow-sm'
                            : p === '...'
                              ? 'text-slate-400 cursor-default bg-transparent'
                              : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
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

                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens por pág:</span>
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 shadow-inner">
                    {[12, 24, 48].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setLimit(num);
                          setPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                          limit === num
                            ? 'bg-white text-slate-700 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Viewer Modal ── */}
      {selectedSimulator && (
        <SimulationViewer
          simulator={selectedSimulator}
          onClose={handleCloseViewer}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <DeleteSimulatorModal
        simulator={deleteTarget}
        isOpen={!!deleteTarget}
        isPending={isInactivating}
        onConfirm={handleInactivateConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { HeroSummary } from '@/components/ui/HeroSummary';
import {
  useBooks, useDisciplines, useGrades, useProjects, useAssignBookToProject, type BookFilters,
} from '@/hooks/useAdminData';
import {
  Search, SlidersHorizontal, X, Star, Download, Eye,
  ChevronDown, ChevronLeft, ChevronRight,
  Library, BookOpen, FolderOpen,
} from 'lucide-react';
import { CourseExclusiveBadge } from '@/components/admin/CourseExclusiveBadge';

// ─────────────────────────────────────────────────────────────
// ProjectAssignModal
// ─────────────────────────────────────────────────────────────
function ProjectAssignModal({ resourceId, resourceName, currentProjectIds, projects, onSave, onClose, isLoading }: {
  resourceId: string; resourceName: string; currentProjectIds: string[];
  projects: { id: string; name: string }[];
  onSave: (ids: string[]) => void; onClose: () => void; isLoading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(currentProjectIds);
  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Vincular a Projetos</p>
            <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">{resourceName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 mb-4">
          {projects.map(p => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${selected.includes(p.id) ? 'border-amber-400 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <FolderOpen className={`h-4 w-4 shrink-0 ${selected.includes(p.id) ? 'text-amber-500' : 'text-slate-300'}`} />
              <span className="text-sm font-semibold text-slate-700 flex-1">{p.name}</span>
              {selected.includes(p.id) && (
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => onSave(selected)} disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {isLoading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const FAVORITES_KEY = 'kodar_library_favorites';

function useBookFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const s = localStorage.getItem(FAVORITES_KEY);
      if (s) setFavorites(new Set(JSON.parse(s) as string[]));
    } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
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
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
      >
        {children}
      </select>
    </div>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(value) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BookCard
// ─────────────────────────────────────────────────────────────
function BookCard({
  book, disciplines, isFav, onFavorite, projects, onAssignProject,
}: {
  book: any; disciplines: any[]; isFav: boolean; onFavorite: () => void;
  projects: { id: string; name: string }[]; onAssignProject: (book: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setDetailsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const avgRating = book.ratings > 0 ? book.total_rating / book.ratings : 0;
  const breadcrumb = [book.serie, book.disciplina].filter(Boolean).join(' > ');

  const discColor = useMemo(() => {
    if (!book.disciplina) return '#f59e0b';
    const match = disciplines.find((d: any) => d.name === book.disciplina);
    return match?.color_hex ?? '#f59e0b';
  }, [book.disciplina, disciplines]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Left: amber bookmark + thumbnail */}
        <div className="flex shrink-0">
          <div className="w-2 bg-amber-500" />
          <div className="w-[140px] h-[196px] overflow-hidden shrink-0 relative">
            {book.thumbnail && !thumbError
              ? <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" onError={() => setThumbError(true)} />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-amber-50">
                  <BookOpen className="h-12 w-12 text-amber-300" />
                  <span className="text-[10px] font-semibold text-center px-2 leading-tight text-slate-400">Livro</span>
                </div>
              )
            }
          </div>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-1.5">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap">
            {book.uid_external && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                UID: {book.uid_external}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              book.status === 'publicado'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {book.status === 'publicado' ? 'Publicado' : 'Rascunho'}
            </span>
            {avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                <StarRating value={avgRating} />
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {book.pcd_sign && (
                <span title="Língua de Sinais" className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold">🤟</span>
              )}
              {book.pcd_voice && (
                <span title="Narração em Áudio" className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs">🔊</span>
              )}
              {book.disciplina && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: discColor }}>
                  {book.disciplina}
                </span>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          {breadcrumb && <p className="text-xs text-slate-400 font-medium">{breadcrumb}</p>}

          {/* Title */}
          <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">{book.title}</h3>
          {book.course && (
            <div>
              <CourseExclusiveBadge course={book.course} />
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div>
              <p className={`text-sm text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                <span className="font-semibold text-slate-700">Descrição: </span>
                {book.description}
              </p>
              {book.description.length > 180 && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-0.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {expanded ? 'Ver menos ▴' : 'Ver mais ▾'}
                </button>
              )}
            </div>
          )}

          {/* Keywords */}
          {book.keywords && (
            <p className="text-xs text-slate-400 line-clamp-1">
              <span className="font-semibold">Palavras-chave:</span> {book.keywords}
            </p>
          )}

          {/* Copyright */}
          {book.copyright && (
            <p className="text-xs text-slate-400 line-clamp-1">
              <span className="font-semibold">Autor:</span> {book.copyright}
            </p>
          )}
        </div>
      </div>

      {/* Project badges */}
      {(book.book_projects ?? []).length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {(book.book_projects as any[]).map((bp: any) => bp.projects && (
            <span key={bp.project_id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              {bp.projects.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          {book.can_download && book.file_url && (
            <a href={book.file_url} target="_blank" rel="noreferrer" title="Baixar"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
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
          {projects.length > 0 && (
            <button
              title="Vincular a Projetos"
              onClick={() => onAssignProject(book)}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 border-amber-500 text-amber-600 text-xs font-bold hover:bg-amber-50 transition-colors"
          >
            DETALHES <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
          {detailsOpen && (
            <div className="absolute right-0 bottom-10 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
              {book.file_url && (
                <a href={book.file_url} target="_blank" rel="noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Visualizar
                </a>
              )}
              {book.can_download && book.file_url && (
                <a href={book.file_url} target="_blank" rel="noreferrer" download
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function BibliotecaPage() {
  const { favorites, toggle: toggleFavorite } = useBookFavorites();

  const LIMIT = 10;
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [filterDisc, setFilterDisc]   = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterInteractive, setFilterInteractive] = useState('');
  const [filterPcd, setFilterPcd]           = useState('');
  const [filterDownload, setFilterDownload] = useState('');
  const [filterProject, setFilterProject]   = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'todos' | 'favoritos'>('todos');
  const [assigningBook, setAssigningBook] = useState<any | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo<BookFilters>(() => ({
    search:        debouncedSearch || undefined,
    discipline_id: filterDisc     || undefined,
    grade_id:      filterGrade    || undefined,
    status:        filterStatus   || undefined,
    interactive:   filterInteractive === 'sim' ? true : filterInteractive === 'nao' ? false : undefined,
    can_download:  filterDownload === 'sim' ? true : filterDownload === 'nao' ? false : undefined,
    pcd_sign:      filterPcd === 'libras' ? true : undefined,
    pcd_voice:     filterPcd === 'audio'  ? true : undefined,
    audience:      filterAudience === 'professor' ? 'professor' : filterAudience === 'aluno' ? 'aluno' : undefined,
    project_id:    filterProject  || undefined,
  }), [debouncedSearch, filterDisc, filterGrade, filterStatus, filterInteractive, filterDownload, filterPcd, filterAudience, filterProject]);

  const { data: booksRes, isLoading } = useBooks(filters, page, LIMIT);
  const books      = booksRes?.data  ?? [];
  const totalCount = booksRes?.count ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: gradesRes }      = useGrades(1, 100);
  const { data: projectsRes }    = useProjects(1, 100);
  const disciplines = disciplinesRes?.data ?? [];
  const grades      = gradesRes?.data      ?? [];
  const projects    = projectsRes?.data    ?? [];

  const { mutate: assignProject, isPending: assigning } = useAssignBookToProject();

  const visibleBooks = activeTab === 'favoritos' ? books.filter(b => favorites.has(b.id)) : books;

  const hasFilters = Boolean(search || filterDisc || filterGrade || filterAudience || filterStatus || filterInteractive || filterPcd || filterDownload || filterProject);
  const clearFilters = () => {
    setSearch(''); setFilterDisc(''); setFilterGrade(''); setFilterAudience('');
    setFilterStatus(''); setFilterInteractive(''); setFilterPcd(''); setFilterDownload(''); setFilterProject('');
    setPage(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {assigningBook && (
        <ProjectAssignModal
          resourceId={assigningBook.id}
          resourceName={assigningBook.title}
          currentProjectIds={(assigningBook.book_projects ?? []).map((bp: any) => bp.project_id)}
          projects={projects}
          isLoading={assigning}
          onClose={() => setAssigningBook(null)}
          onSave={(ids) => {
            assignProject({ bookId: assigningBook.id, projectIds: ids });
            setAssigningBook(null);
          }}
        />
      )}
      <HeroSummary
        title="Biblioteca"
        description="Explore e gerencie livros, textos e materiais de leitura do acervo"
        icon={<Library className="w-8 h-8 text-white" />}
        themeClass="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500"
      />

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
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

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
                <option value="sim">Disponível</option>
                <option value="nao">Indisponível</option>
              </FilterSelect>

              {projects.length > 0 && (
                <FilterSelect label="Projeto" value={filterProject} onChange={v => { setFilterProject(v); setPage(1); }}>
                  <option value="">Todos</option>
                  {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </FilterSelect>
              )}

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

          <div className="mt-auto p-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Total</span>
              <span className="text-[11px] font-bold tabular-nums text-slate-700">{totalCount}</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {([
              { id: 'todos', label: 'Todos', Icon: Library },
              { id: 'favoritos', label: 'Favoritos', Icon: Star },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'favoritos' && favorites.size > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${
                    activeTab === 'favoritos' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>{favorites.size}</span>
                )}
              </button>
            ))}
            <div className="ml-auto pr-2 text-xs text-slate-400 font-medium">
              {totalCount} {totalCount === 1 ? 'livro' : 'livros'}
            </div>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse flex">
                  <div className="w-[142px] shrink-0 bg-slate-100 h-[196px]" />
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
          {!isLoading && visibleBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 mb-4">
                <Library className="h-7 w-7 text-amber-400" />
              </div>
              <p className="text-base font-bold text-slate-700">
                {activeTab === 'favoritos' ? 'Nenhum favorito ainda' : hasFilters ? 'Nenhum resultado' : 'Nenhum livro encontrado'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {hasFilters ? 'Tente remover os filtros.' : ''}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700">
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* List */}
          {!isLoading && visibleBooks.length > 0 && (
            <div className="space-y-3">
              {visibleBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  disciplines={disciplines}
                  isFav={favorites.has(book.id)}
                  onFavorite={() => toggleFavorite(book.id)}
                  projects={projects}
                  onAssignProject={setAssigningBook}
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
              <span className="text-sm text-slate-600 font-medium px-2">{page} / {totalPages}</span>
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
    </div>
  );
}

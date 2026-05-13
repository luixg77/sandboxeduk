'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { useGames, useDisciplines, useGrades, useProjects, useAssignGameToProject, useUpdateRecord, type GameFilters } from '@/hooks/useAdminData';
import {
  Search, SlidersHorizontal, X, Star,
  ChevronDown, ChevronLeft, ChevronRight,
  Gamepad2, Play, Zap, FolderOpen,
} from 'lucide-react';
import { CourseExclusiveBadge } from '@/components/admin/CourseExclusiveBadge';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ENGINE_LABELS: Record<string, string> = {
  'basic':           'Interativo',
  'booleano':        'Verdadeiro/Falso',
  'dinamico':        'Dinâmico',
  'digitar':         'Digitação',
  'agrupar':         'Agrupar',
  'match':           'Combinar',
  'ambientado':      'Ambientado',
  'reconstruir':     'Reconstruir',
  'sequencia':       'Sequência',
  'match-quadrados': 'Combinar Quadrados',
  'basico':          'Básico',
  'basic-interativo':'Interativo Avançado',
};

const DIFFICULTY_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: 'Fácil',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { label: 'Médio',   cls: 'bg-amber-50   text-amber-700   border-amber-200'   },
  3: { label: 'Difícil', cls: 'bg-red-50     text-red-700     border-red-200'     },
};

const FAVORITES_KEY = 'kodar_games_favorites';
const GAME_PLAY_BASE = 'https://edu.avaensinodigital.com.br';

function useGameFavorites() {
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
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-slate-700"
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
        <Star key={i} className={`h-3 w-3 ${i < Math.round(value) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} />
      ))}
    </div>
  );
}

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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vincular a Projetos</p>
            <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">{resourceName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 mb-4">
          {projects.map(p => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${selected.includes(p.id) ? 'border-green-400 bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <FolderOpen className={`h-4 w-4 shrink-0 ${selected.includes(p.id) ? 'text-green-500' : 'text-slate-300'}`} />
              <span className="text-sm font-semibold text-slate-700 flex-1">{p.name}</span>
              {selected.includes(p.id) && (
                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => onSave(selected)} disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AudienceModal
// ─────────────────────────────────────────────────────────────
function AudienceModal({ game, onSave, onClose, isLoading }: {
  game: any; onSave: (audience: 'professor' | 'aluno') => void; onClose: () => void; isLoading: boolean;
}) {
  const current: 'professor' | 'aluno' = game.source_platform === 'evoluir_alunos' ? 'aluno' : 'professor';
  const [selected, setSelected] = useState<'professor' | 'aluno'>(current);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destinado a</p>
            <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">{game.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 mb-5">
          {([
            { value: 'professor', emoji: '🧑‍🏫', label: 'Professor', hint: 'Acervo do professor' },
            { value: 'aluno',     emoji: '🎒',    label: 'Aluno',     hint: 'Acervo do aluno'     },
          ] as { value: 'professor' | 'aluno'; emoji: string; label: string; hint: string }[]).map(({ value, emoji, label, hint }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all ${
                selected === value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-bold">{label}</span>
              <span className="text-[10px] opacity-70">{hint}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => onSave(selected)} disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GameCard — grid card layout
// ─────────────────────────────────────────────────────────────
function GameCard({ game, disciplines, isFav, onFavorite, projects, onAssignProject, onEditAudience }: {
  game: any; disciplines: any[]; isFav: boolean; onFavorite: () => void;
  projects: { id: string; name: string }[]; onAssignProject: (game: any) => void;
  onEditAudience: (game: any) => void;
}) {
  const [thumbError, setThumbError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const avgRating = game.ratings > 0 ? game.total_rating / game.ratings : 0;
  const diff = DIFFICULTY_LABELS[game.difficulty as number];
  const engineLabel = ENGINE_LABELS[game.engine] ?? game.engine ?? '';

  const discColor = useMemo(() => {
    if (!game.disciplina) return '#22c55e';
    const match = disciplines.find((d: any) => d.name === game.disciplina);
    return match?.color_hex ?? '#22c55e';
  }, [game.disciplina, disciplines]);

  const playUrl = game.oed_content_id
    ? `${GAME_PLAY_BASE}/game/${game.oed_content_id}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-green-50 shrink-0">
        {game.thumbnail && !thumbError
          ? <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" onError={() => setThumbError(true)} />
          : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Gamepad2 className="h-12 w-12 text-green-300" />
              <span className="text-[10px] font-semibold text-slate-400 text-center px-2">{engineLabel}</span>
            </div>
          )
        }
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {diff && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.cls}`}>
              {diff.label}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            game.source_platform === 'evoluir_alunos'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {game.source_platform === 'evoluir_alunos' ? '🎒 Aluno' : '🧑‍🏫 Professor'}
          </span>
        </div>
        {playUrl && (
          <a
            href={playUrl} target="_blank" rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-green-600 fill-current ml-0.5" />
            </div>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Top: UID + rating + discipline */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {game.uid_external && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              #{game.uid_external}
            </span>
          )}
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-600">{avgRating.toFixed(1)}</span>
              <StarRating value={avgRating} />
            </div>
          )}
          {game.disciplina && (
            <span className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: discColor }}>
              {game.disciplina}
            </span>
          )}
        </div>

        {/* Serie */}
        {game.serie && <p className="text-[10px] text-slate-400 font-medium">{game.serie}</p>}

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{game.title}</h3>
        {game.course && (
          <div>
            <CourseExclusiveBadge course={game.course} />
          </div>
        )}

        {/* Objective / description */}
        {(game.objective || game.description) && (
          <div>
            <p className={`text-xs text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {game.objective || game.description}
            </p>
            {((game.objective || game.description) ?? '').length > 100 && (
              <button onClick={() => setExpanded(v => !v)} className="text-[10px] font-semibold text-green-600 hover:text-green-700">
                {expanded ? 'Ver menos ▴' : 'Ver mais ▾'}
              </button>
            )}
          </div>
        )}

        {/* Engine tag */}
        {engineLabel && (
          <div className="flex items-center gap-1 mt-auto pt-1">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-slate-400 font-medium">{engineLabel}</span>
            {game.pcd_sign  && <span title="Libras"  className="text-[10px]">🤟</span>}
            {game.pcd_voice && <span title="Narração" className="text-[10px]">🔊</span>}
          </div>
        )}
      </div>

      {/* Project badges */}
      {(game.game_projects ?? []).length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {(game.game_projects as any[]).map((gp: any) => gp.projects && (
            <span key={gp.project_id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              {gp.projects.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1">
          <button
            title={isFav ? 'Desfavoritar' : 'Favoritar'}
            onClick={onFavorite}
            className={`flex items-center justify-center h-7 w-7 rounded-lg border transition-colors ${
              isFav ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
          {projects.length > 0 && (
            <button
              title="Vincular a Projetos"
              onClick={() => onAssignProject(game)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            title="Definir público-alvo"
            onClick={() => onEditAudience(game)}
            className="flex items-center justify-center h-7 px-2 rounded-lg border border-slate-200 text-slate-400 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-colors text-[10px] font-bold gap-1"
          >
            {game.source_platform === 'evoluir_alunos' ? '🎒' : '🧑‍🏫'}
          </button>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-green-600 text-green-600 text-xs font-bold hover:bg-green-50 transition-colors"
          >
            DETALHES <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-9 z-30 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
              {playUrl && (
                <a href={playUrl} target="_blank" rel="noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <Play className="h-3.5 w-3.5" /> Jogar
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
export default function JogosPage() {
  const { favorites, toggle: toggleFavorite } = useGameFavorites();

  const LIMIT = 12;
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [filterDisc, setFilterDisc]   = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterEngine, setFilterEngine] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterPcd, setFilterPcd]     = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeTab, setActiveTab]     = useState<'todos' | 'favoritos'>('todos');
  const [assigningGame, setAssigningGame]     = useState<any | null>(null);
  const [audienceGame,  setAudienceGame]      = useState<any | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo<GameFilters>(() => ({
    search:        debouncedSearch || undefined,
    discipline_id: filterDisc     || undefined,
    grade_id:      filterGrade    || undefined,
    engine:        filterEngine   || undefined,
    difficulty:    filterDifficulty ? Number(filterDifficulty) : undefined,
    pcd_sign:      filterPcd === 'libras' ? true : undefined,
    pcd_voice:     filterPcd === 'audio'  ? true : undefined,
    project_id:    filterProject  || undefined,
  }), [debouncedSearch, filterDisc, filterGrade, filterEngine, filterDifficulty, filterPcd, filterProject]);

  const { data: gamesRes, isLoading } = useGames(filters, page, LIMIT);
  const games      = gamesRes?.data  ?? [];
  const totalCount = gamesRes?.count ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: gradesRes }      = useGrades(1, 100);
  const { data: projectsRes }    = useProjects(1, 100);
  const disciplines = disciplinesRes?.data ?? [];
  const grades      = gradesRes?.data      ?? [];
  const projects    = projectsRes?.data    ?? [];

  const { mutate: assignProject, isPending: assigning }    = useAssignGameToProject();
  const { mutate: updateGame,   isPending: updatingGame }  = useUpdateRecord('games');

  const visibleGames = activeTab === 'favoritos' ? games.filter(g => favorites.has(g.id)) : games;

  const hasFilters = Boolean(search || filterDisc || filterGrade || filterEngine || filterDifficulty || filterPcd || filterProject);
  const clearFilters = () => {
    setSearch(''); setFilterDisc(''); setFilterGrade('');
    setFilterEngine(''); setFilterDifficulty(''); setFilterPcd(''); setFilterProject('');
    setPage(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {assigningGame && (
        <ProjectAssignModal
          resourceId={assigningGame.id}
          resourceName={assigningGame.title}
          currentProjectIds={(assigningGame.game_projects ?? []).map((gp: any) => gp.project_id)}
          projects={projects}
          isLoading={assigning}
          onClose={() => setAssigningGame(null)}
          onSave={(ids) => {
            assignProject({ gameId: assigningGame.id, projectIds: ids });
            setAssigningGame(null);
          }}
        />
      )}
      {audienceGame && (
        <AudienceModal
          game={audienceGame}
          isLoading={updatingGame}
          onClose={() => setAudienceGame(null)}
          onSave={(audience) => {
            updateGame(
              { id: audienceGame.id, payload: { source_platform: audience === 'aluno' ? 'evoluir_alunos' : null } },
              { onSuccess: () => setAudienceGame(null) }
            );
          }}
        />
      )}
      <HeroSummary
        title="Jogos Educacionais"
        description="Explore e gerencie jogos interativos para aprendizagem"
        icon={<Gamepad2 className="w-8 h-8 text-white" />}
        themeClass="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
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
                    className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 placeholder-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

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

              <FilterSelect label="Tipo de Jogo" value={filterEngine} onChange={v => { setFilterEngine(v); setPage(1); }}>
                <option value="">Todos</option>
                {Object.entries(ENGINE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </FilterSelect>

              <FilterSelect label="Dificuldade" value={filterDifficulty} onChange={v => { setFilterDifficulty(v); setPage(1); }}>
                <option value="">Todas</option>
                <option value="1">Fácil</option>
                <option value="2">Médio</option>
                <option value="3">Difícil</option>
              </FilterSelect>

              <FilterSelect label="Acessibilidade" value={filterPcd} onChange={v => { setFilterPcd(v); setPage(1); }}>
                <option value="">Todas</option>
                <option value="libras">Com Libras</option>
                <option value="audio">Com Narração</option>
              </FilterSelect>

              {projects.length > 0 && (
                <FilterSelect label="Projeto" value={filterProject} onChange={v => { setFilterProject(v); setPage(1); }}>
                  <option value="">Todos</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              { id: 'todos',     label: 'Todos',     Icon: Gamepad2 },
              { id: 'favoritos', label: 'Favoritos', Icon: Star },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'favoritos' && favorites.size > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${
                    activeTab === 'favoritos' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                  }`}>{favorites.size}</span>
                )}
              </button>
            ))}
            <div className="ml-auto pr-2 text-xs text-slate-400 font-medium">
              {totalCount} {totalCount === 1 ? 'jogo' : 'jogos'}
            </div>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-40 bg-slate-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && visibleGames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 mb-4">
                <Gamepad2 className="h-7 w-7 text-green-400" />
              </div>
              <p className="text-base font-bold text-slate-700">
                {activeTab === 'favoritos' ? 'Nenhum favorito ainda' : hasFilters ? 'Nenhum resultado' : 'Nenhum jogo encontrado'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm font-medium text-green-600 hover:text-green-700">
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {!isLoading && visibleGames.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  disciplines={disciplines}
                  isFav={favorites.has(game.id)}
                  onFavorite={() => toggleFavorite(game.id)}
                  projects={projects}
                  onAssignProject={setAssigningGame}
                  onEditAudience={setAudienceGame}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 font-medium px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { HeroSummary } from '@/components/ui/HeroSummary';
import {
  useDisciplines, useGrades, useProjects,
  useAudioLessons, useCreateAudioLesson, useUpdateAudioLesson,
  useInactivateAudioLesson, useActivateAudioLesson,
  useAudioLessonTypes, useCreateAudioLessonType,
} from '@/hooks/useAdminData';
import type { AudioLesson, AudioLessonFilters, AudioLessonType, CreateAudioLessonPayload } from '@/types/audio.types';
import { EMPTY_AUDIO_FILTERS } from '@/types/audio.types';
import type { AudioStatus, AudioSourceType } from '@/types/audio.types';
import { createClient } from '@/lib/supabase/client';
import { CourseExclusiveBadge } from '@/components/admin/CourseExclusiveBadge';
import {
  Plus, Search, SlidersHorizontal, X, Edit2,
  Heart, List, BookMarked, Star,
  ChevronDown, Loader2, AlertTriangle, RefreshCw,
  Upload, Link2, Globe,
  Trash2, ImagePlus, BarChart2, Archive,
  Music2, Headphones, Pause, Play, Volume2, VolumeX,
  Tag, PlusCircle, Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AudioStatus, { label: string; cls: string }> = {
  active:   { label: 'Ativo',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inativo',    cls: 'bg-slate-50 text-slate-500 border-slate-200'       },
  pending:  { label: 'Em análise', cls: 'bg-amber-50 text-amber-700 border-amber-200'       },
};

const AUDIO_FAVORITES_KEY = 'kodar_audio_favorites';

const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/x-m4a',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseSupabaseSignedUrl(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(?:\?|$)/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────
const IMAGE_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

async function uploadThumbnail(supabase: ReturnType<typeof createClient>, file: File): Promise<string> {
  if (file.size > 6 * 1024 * 1024) throw new Error('A thumbnail deve ter no máximo 6MB.');
  const ext         = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const contentType = file.type || IMAGE_MIME[ext] || 'image/jpeg';
  if (!['image/jpeg', 'image/png'].includes(contentType)) throw new Error('Apenas JPG/PNG aceitos.');
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user?.id ?? 'public'}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('audios_thumbnails').upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(`Erro ao enviar thumbnail: ${error.message}`);
  const { data } = supabase.storage.from('audios_thumbnails').getPublicUrl(path);
  return data.publicUrl;
}

async function uploadAudio(
  supabase: ReturnType<typeof createClient>,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  if (file.size > 100 * 1024 * 1024) throw new Error('O áudio deve ter no máximo 100MB.');
  const ext         = (file.name.split('.').pop() ?? 'mp3').toLowerCase();
  const contentType = file.type || AUDIO_MIME[ext] || 'audio/mpeg';
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user?.id ?? 'public'}/${crypto.randomUUID()}.${ext}`;

  let done = false;
  const sim = setInterval(() => {
    if (done) return;
    onProgress(Math.min(90, Math.floor(Math.random() * 10 + 5)));
  }, 300);

  const { error } = await supabase.storage
    .from('audios_media')
    .upload(path, file, { contentType, upsert: false });
  done = true;
  clearInterval(sim);

  if (error) throw new Error(`Erro ao enviar áudio: ${error.message}`);
  onProgress(100);

  const { data } = await supabase.storage.from('audios_media').createSignedUrl(path, 3600);
  return data?.signedUrl ?? path;
}

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useAudioFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUDIO_FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(AUDIO_FAVORITES_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { favorites, toggle };
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'Todos os áudios', Icon: List       },
  { id: 'mine',      label: 'Meus áudios',     Icon: BookMarked },
  { id: 'favorites', label: 'Favoritos',        Icon: Star       },
] as const;
type TabId = typeof TABS[number]['id'];

// ─────────────────────────────────────────────────────────────
// Form State
// ─────────────────────────────────────────────────────────────
interface AudioFormState {
  title: string;
  description: string;
  discipline_id: string;
  grade_id: string;
  subject: string;
  status: AudioStatus;
  source_type: AudioSourceType;
  audio_url: string;
  audio_file: File | null;
  thumbnail_url: string | null;
  thumbnail_file: File | null;
  thumbnail_preview: string | null;
  project_ids: string[];
  type_ids: string[];
  audience: 'professor' | 'aluno';
}

function buildEmptyAudioForm(): AudioFormState {
  return {
    title: '', description: '', discipline_id: '', grade_id: '',
    subject: '', status: 'active', source_type: 'link',
    audio_url: '', audio_file: null,
    thumbnail_url: null, thumbnail_file: null, thumbnail_preview: null,
    project_ids: [], type_ids: [], audience: 'professor',
  };
}

function formFromAudio(v: AudioLesson): AudioFormState {
  return {
    title:             v.title,
    description:       v.description      ?? '',
    discipline_id:     v.discipline_id     ?? '',
    grade_id:          v.grade_id          ?? '',
    subject:           v.subject           ?? '',
    status:            v.status,
    source_type:       v.source_type,
    audio_url:         v.audio_url         ?? '',
    audio_file:        null,
    thumbnail_url:     v.thumbnail_url,
    thumbnail_file:    null,
    thumbnail_preview: v.thumbnail_url,
    project_ids:       (v.audio_lesson_projects ?? []).map((p) => p.project_id),
    type_ids:          (v.audio_lesson_type_links ?? []).map((t) => t.type_id),
    audience:          (v as any).source_platform === 'evoluir_alunos' ? 'aluno' : 'professor',
  };
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AudioaulasPage() {
  const [activeTab,    setActiveTab]    = useState<TabId>('all');
  const [filters,      setFilters]      = useState<AudioLessonFilters>(EMPTY_AUDIO_FILTERS);
  const [filtersOpen,  setFiltersOpen]  = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editingAudio, setEditingAudio] = useState<AudioLesson | null>(null);
  const [detailAudio,  setDetailAudio]  = useState<AudioLesson | null>(null);

  const { favorites, toggle: toggleFavorite } = useAudioFavorites();
  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: gradesRes }      = useGrades(1, 100);
  const { data: projectsRes }    = useProjects(1, 100);
  const { data: audioTypesData } = useAudioLessonTypes();
  const { mutate: inactivate }   = useInactivateAudioLesson();
  const { mutate: activate }     = useActivateAudioLesson();

  const disciplines = disciplinesRes?.data ?? [];
  const grades      = gradesRes?.data      ?? [];
  const projects    = projectsRes?.data    ?? [];
  const audioTypes  = audioTypesData       ?? [];

  const debouncedKeyword = useDebounce(filters.keyword, 400);

  const queryFilters = useMemo<Partial<AudioLessonFilters>>(() => {
    const f: Partial<AudioLessonFilters> = { ...filters, keyword: debouncedKeyword };
    if (activeTab === 'mine') f.origin = 'custom';
    return f;
  }, [filters, debouncedKeyword, activeTab]);

  const { data: response, isLoading, isError, refetch } = useAudioLessons(
    activeTab === 'favorites' ? { ...queryFilters, keyword: debouncedKeyword } : queryFilters,
    1, 100,
  );

  const allAudios = response?.data ?? [];

  const displayList = useMemo(() => {
    if (activeTab === 'favorites') return allAudios.filter((a) => favorites.has(a.id));
    return allAudios;
  }, [allAudios, activeTab, favorites]);

  const setFilter    = (key: keyof AudioLessonFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_AUDIO_FILTERS);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters  = activeFilterCount > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <HeroSummary
        title="Áudios e Podcasts"
        description="Gerencie sua biblioteca de conteúdos em áudio"
        icon={<Headphones className="w-8 h-8 text-white" />}
        themeClass="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
      >
        <button
          onClick={() => { setEditingAudio(null); setShowCreate(true); }}
          className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo áudio
        </button>
      </HeroSummary>

      {/* Layout */}
      <div className="flex flex-1 gap-5 p-5 min-h-0 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filtros</span>
            {filtersOpen && activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">{activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Título ou descrição..."
                    value={filters.keyword}
                    onChange={(e) => setFilter('keyword', e.target.value)}
                    className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
                  />
                  {filters.keyword && (
                    <button onClick={() => setFilter('keyword', '')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3 w-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <FilterSelect label="Disciplina" value={filters.discipline_id} onChange={(v) => setFilter('discipline_id', v)}>
                <option value="">Todas</option>
                {disciplines.map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </FilterSelect>

              <FilterSelect label="Série / Ano" value={filters.grade_id} onChange={(v) => setFilter('grade_id', v)}>
                <option value="">Todas</option>
                {grades.map((g: { id: string; name: string }) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </FilterSelect>

              {/* Status */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: '',         label: 'Todos'      },
                    { value: 'active',   label: 'Ativo'      },
                    { value: 'inactive', label: 'Inativo'    },
                    { value: 'pending',  label: 'Em análise' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter('status', opt.value)}
                      className={`text-left text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        filters.status === opt.value
                          ? 'bg-blue-100 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origem */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Origem</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: '',       label: 'Todas'        },
                    { value: 'system', label: 'Sistema'      },
                    { value: 'custom', label: 'Meu conteúdo' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter('origin', opt.value)}
                      className={`text-left text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        filters.origin === opt.value
                          ? 'bg-blue-100 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {audioTypes.length > 0 && (
                <FilterSelect label="Tipo" value={filters.type_id} onChange={(v) => setFilter('type_id', v)}>
                  <option value="">Todos</option>
                  {audioTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </FilterSelect>
              )}

              {projects.length > 0 && (
                <FilterSelect label="Projeto" value={filters.project_id} onChange={(v) => setFilter('project_id', v)}>
                  <option value="">Todos</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </FilterSelect>
              )}

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
        </aside>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'favorites' && favorites.size > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${
                    activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {favorites.size}
                  </span>
                )}
              </button>
            ))}
            <div className="ml-auto pr-1">
              {!isLoading && (
                <span className="text-xs text-slate-400 font-medium">
                  {displayList.length} {displayList.length === 1 ? 'áudio' : 'áudios'}
                </span>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-100">
              <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-base font-bold text-slate-700">Erro ao carregar áudios</p>
              <button onClick={() => refetch()} className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && displayList.length === 0 && (
            <EmptyState
              icon={<Music2 className="h-8 w-8 text-slate-400" />}
              title={activeTab === 'favorites' ? 'Nenhum áudio favoritado' : 'Nenhum áudio encontrado'}
              description={
                hasActiveFilters
                  ? 'Tente remover alguns filtros.'
                  : 'Crie seu primeiro áudio clicando em "+ Novo áudio".'
              }
              action={hasActiveFilters ? (
                <button onClick={clearFilters} className="mt-3 text-sm font-medium text-blue-600">Limpar filtros</button>
              ) : undefined}
            />
          )}

          {/* Grid */}
          {!isLoading && !isError && displayList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayList.map((audio) => {
                const isFav      = favorites.has(audio.id);
                const discColor  = audio.disciplines?.color_hex ?? '#94a3b8';
                const statusConf = STATUS_CONFIG[audio.status];

                return (
                  <div
                    key={audio.id}
                    onClick={() => setDetailAudio(audio)}
                    className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer
                      shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]
                      hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]
                      hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Cover art */}
                    <div className="relative h-36 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
                      {audio.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={audio.thumbnail_url}
                          alt={audio.title}
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="h-14 w-14 text-white/40" />
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <Play className="h-5 w-5 text-indigo-600 ml-0.5" />
                        </div>
                      </div>

                      {/* Source badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          audio.source_type === 'link' ? 'bg-purple-700/90 text-white' : 'bg-blue-700/90 text-white'
                        }`}>
                          {audio.source_type === 'link'
                            ? <Link2 className="h-2.5 w-2.5" />
                            : <Upload className="h-2.5 w-2.5" />
                          }
                          {audio.source_type === 'link' ? 'Link' : 'Upload'}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.cls}`}>
                          {statusConf.label}
                        </span>
                      </div>

                      {audio.duration && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded-md">
                          {audio.duration}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                        {audio.title}
                      </h3>
                      {audio.course && (
                        <div className="mb-1.5">
                          <CourseExclusiveBadge course={audio.course} />
                        </div>
                      )}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                        {audio.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {audio.disciplines?.name && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ backgroundColor: `${discColor}18`, color: discColor, borderColor: `${discColor}38` }}
                          >
                            {audio.disciplines.name}
                          </span>
                        )}
                        {audio.grades?.name && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {audio.grades.name}
                          </span>
                        )}
                        {(audio.audio_lesson_projects ?? []).map((ap) =>
                          ap.projects ? (
                            <span key={ap.project_id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                              {ap.projects.name}
                            </span>
                          ) : null,
                        )}
                        {(audio.audio_lesson_type_links ?? []).map((tl) =>
                          tl.audio_lesson_types ? (
                            <span key={tl.type_id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                              <Tag className="h-2.5 w-2.5" />
                              {tl.audio_lesson_types.name}
                            </span>
                          ) : null,
                        )}
                        {audio.subject && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                            {audio.subject}
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <BarChart2 className="h-3 w-3" />
                          <span>{audio.plays.toLocaleString('pt-BR')} plays</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFavorite(audio.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                          </button>
                          <button
                            onClick={() => { setEditingAudio(audio); setShowCreate(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          {audio.status === 'active' ? (
                            <button
                              onClick={() => inactivate(audio.id)}
                              title="Inativar"
                              className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Archive className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => activate(audio.id)}
                              title="Ativar"
                              className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Play className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailAudio && (
        <AudioDetailModal
          audio={detailAudio}
          isFav={favorites.has(detailAudio.id)}
          onFavorite={() => toggleFavorite(detailAudio.id)}
          onEdit={() => { setEditingAudio(detailAudio); setDetailAudio(null); setShowCreate(true); }}
          onClose={() => setDetailAudio(null)}
        />
      )}

      {/* Create / Edit Modal */}
      {showCreate && (
        <AudioFormModal
          editingAudio={editingAudio}
          disciplines={disciplines}
          grades={grades}
          projects={projects}
          audioTypes={audioTypes}
          onClose={() => { setShowCreate(false); setEditingAudio(null); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AudioDetailModal with inline player
// ─────────────────────────────────────────────────────────────
function AudioDetailModal({ audio, isFav, onFavorite, onEdit, onClose }: {
  audio: AudioLesson;
  isFav: boolean;
  onFavorite: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const supabase                           = useMemo(() => createClient(), []);
  const audioRef                           = useRef<HTMLAudioElement | null>(null);
  const [playerUrl,    setPlayerUrl]       = useState<string | null>(null);
  const [isPlaying,    setIsPlaying]       = useState(false);
  const [currentTime,  setCurrentTime]     = useState(0);
  const [duration,     setDuration]        = useState(0);
  const [volume,       setVolume]          = useState(1);
  const [muted,        setMuted]           = useState(false);
  const [loadingUrl,   setLoadingUrl]      = useState(false);
  const [urlError,     setUrlError]        = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Bind audio events when playerUrl is set
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !playerUrl) return;
    el.src = playerUrl;
    const onTime  = () => setCurrentTime(el.currentTime);
    const onMeta  = () => setDuration(el.duration);
    const onEnd   = () => setIsPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.play().then(() => setIsPlaying(true)).catch(() => {});
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, [playerUrl]);

  const handleLoadAndPlay = useCallback(async () => {
    if (playerUrl) {
      // Toggle play/pause
      const el = audioRef.current;
      if (!el) return;
      if (isPlaying) { el.pause(); setIsPlaying(false); }
      else           { el.play().then(() => setIsPlaying(true)).catch(() => {}); }
      return;
    }
    if (!audio.audio_url) return;
    setLoadingUrl(true);
    setUrlError(null);
    try {
      let url = audio.audio_url;
      if (audio.source_type === 'upload') {
        const parsed = parseSupabaseSignedUrl(audio.audio_url);
        if (parsed) {
          const { data, error } = await supabase.storage
            .from(parsed.bucket)
            .createSignedUrl(parsed.path, 3600);
          if (error || !data?.signedUrl) throw new Error('Não foi possível gerar o link de reprodução.');
          url = data.signedUrl;
        }
      }
      setPlayerUrl(url);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Erro ao carregar áudio.');
    } finally {
      setLoadingUrl(false);
    }
  }, [audio, playerUrl, isPlaying, supabase]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    setMuted(next);
  };

  const discColor  = audio.disciplines?.color_hex ?? '#94a3b8';
  const statusConf = STATUS_CONFIG[audio.status];
  const progress   = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      {/* Hidden audio element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Cover art header */}
        <div className="relative h-56 bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500">
          {audio.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={audio.thumbnail_url} alt={audio.title} className="w-full h-full object-cover opacity-70" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="h-24 w-24 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.cls}`}>
                {statusConf.label}
              </span>
              {audio.disciplines?.name && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: `${discColor}18`, color: discColor, borderColor: `${discColor}38` }}
                >
                  {audio.disciplines.name}
                </span>
              )}
              {(audio.audio_lesson_projects ?? []).map((ap) =>
                ap.projects ? (
                  <span key={ap.project_id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    {ap.projects.name}
                  </span>
                ) : null,
              )}
            </div>
            <h2 className="text-lg font-extrabold text-white leading-tight line-clamp-2">{audio.title}</h2>
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player */}
        <div className="px-5 pt-4 pb-2">
          {urlError && (
            <div className="flex items-center gap-2 mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {urlError}
            </div>
          )}

          {/* Seek bar */}
          <div className="relative h-2 bg-slate-100 rounded-full mb-2 group">
            <div
              className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!playerUrl}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
            />
          </div>

          {/* Time */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-4">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            {/* Volume */}
            <div className="flex items-center gap-1.5 w-28">
              <button onClick={toggleMute} className="text-slate-400 hover:text-slate-700 transition-colors">
                {muted || volume === 0
                  ? <VolumeX className="h-4 w-4" />
                  : <Volume2 className="h-4 w-4" />
                }
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="flex-1 accent-indigo-600 h-1"
              />
            </div>

            {/* Play / Pause */}
            <button
              onClick={handleLoadAndPlay}
              disabled={loadingUrl || !audio.audio_url}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingUrl
                ? <Loader2 className="h-6 w-6 animate-spin" />
                : isPlaying
                  ? <Pause className="h-6 w-6" />
                  : <Play className="h-6 w-6 ml-0.5" />
              }
            </button>

            {/* Plays count */}
            <div className="flex items-center gap-1.5 w-28 justify-end text-[11px] text-slate-400">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>{audio.plays.toLocaleString('pt-BR')} plays</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {audio.description && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{audio.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {(audio.audio_lesson_type_links ?? []).map((tl) =>
              tl.audio_lesson_types ? (
                <span key={tl.type_id} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Tag className="h-3 w-3" />
                  {tl.audio_lesson_types.name}
                </span>
              ) : null,
            )}
            {audio.disciplines?.name && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">
                {audio.disciplines.name}
              </span>
            )}
            {audio.grades?.name && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">
                {audio.grades.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onFavorite}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isFav
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
              {isFav ? 'Favoritado' : 'Favoritar'}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AudioFormModal
// ─────────────────────────────────────────────────────────────
function AudioFormModal({
  editingAudio, disciplines, grades, projects, audioTypes, onClose,
}: {
  editingAudio: AudioLesson | null;
  disciplines: { id: string; name: string }[];
  grades: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  audioTypes: AudioLessonType[];
  onClose: () => void;
}) {
  const isEdit = Boolean(editingAudio);
  const [form,           setFormState]    = useState<AudioFormState>(
    editingAudio ? formFromAudio(editingAudio) : buildEmptyAudioForm(),
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);
  const [newTypeName,    setNewTypeName]    = useState('');
  const [showNewType,    setShowNewType]    = useState(false);
  const [creatingType,   setCreatingType]   = useState(false);
  const [localTypes,     setLocalTypes]     = useState<AudioLessonType[]>(audioTypes);
  const [uploadDone,     setUploadDone]     = useState(false);
  const [isSaving,       setIsSaving]       = useState(false);
  const [errorMsg,       setErrorMsg]       = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const { mutateAsync: createAudio }    = useCreateAudioLesson();
  const { mutateAsync: updateAudio }    = useUpdateAudioLesson();
  const { mutateAsync: createTypeMutate } = useCreateAudioLessonType();

  const handleCreateType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    setCreatingType(true);
    try {
      const created = await createTypeMutate(trimmed);
      setLocalTypes((prev) => [...prev, created]);
      setField('type_ids', [...form.type_ids, created.id]);
      setNewTypeName('');
      setShowNewType(false);
    } catch { /* ignore */ }
    finally { setCreatingType(false); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const setField = <K extends keyof AudioFormState>(key: K, value: AudioFormState[K]) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const handleThumbnailChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormState((prev) => ({ ...prev, thumbnail_file: file, thumbnail_preview: url }));
  };

  const canSubmit = Boolean(form.title.trim()) && (
    form.source_type === 'link'
      ? Boolean(form.audio_url.trim())
      : (form.audio_file !== null || (isEdit && Boolean(editingAudio?.audio_url)))
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      let thumbnailUrl: string | null = form.thumbnail_url;
      let audioUrl: string | null     = form.source_type === 'link' ? form.audio_url : (editingAudio?.audio_url ?? null);

      if (form.thumbnail_file) {
        thumbnailUrl = await uploadThumbnail(supabase, form.thumbnail_file);
      }

      if (form.source_type === 'upload' && form.audio_file) {
        setIsUploading(true);
        let cumulative = 0;
        audioUrl = await uploadAudio(supabase, form.audio_file, (pct) => {
          cumulative = Math.max(cumulative, pct);
          setUploadProgress(cumulative);
        });
        setIsUploading(false);
        setUploadDone(true);
      }

      const payload: CreateAudioLessonPayload = {
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        thumbnail_url: thumbnailUrl,
        discipline_id: form.discipline_id  || null,
        grade_id:      form.grade_id       || null,
        subject:       form.subject.trim() || null,
        source_type:   form.source_type,
        audio_url:     audioUrl,
        status:        form.status,
        origin:          isEdit ? editingAudio!.origin : 'custom',
        source_platform: form.audience === 'aluno' ? 'evoluir_alunos' : null,
        type_ids:        form.type_ids,
        project_ids:     form.project_ids,
      };

      if (isEdit && editingAudio) {
        await updateAudio({ id: editingAudio.id, payload });
      } else {
        await createAudio(payload);
      }

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar áudio.');
      setIsUploading(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Music2 className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Editar Áudio' : 'Novo Áudio'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Título */}
          <div>
            <FormLabel required>Título</FormLabel>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Ex: Aula de Biologia — Célula Animal"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
            />
          </div>

          {/* Tipo (multi-seleção) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FormLabel>Tipo</FormLabel>
              <button
                type="button"
                onClick={() => setShowNewType((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Novo tipo
              </button>
            </div>

            {showNewType && (
              <div className="flex gap-2 mb-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <input
                  autoFocus
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreateType(); }
                    if (e.key === 'Escape') { setShowNewType(false); setNewTypeName(''); }
                  }}
                  placeholder="Ex: Meditação Infantil..."
                  className="flex-1 px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                />
                <button
                  onClick={handleCreateType}
                  disabled={!newTypeName.trim() || creatingType}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creatingType ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Salvar
                </button>
                <button
                  onClick={() => { setShowNewType(false); setNewTypeName(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl bg-slate-50 divide-y divide-slate-100 max-h-40 overflow-y-auto">
              {localTypes.map((t) => {
                const checked = form.type_ids.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.type_ids, t.id]
                          : form.type_ids.filter((id) => id !== t.id);
                        setField('type_ids', next);
                      }}
                      className="h-3.5 w-3.5 rounded accent-indigo-600 shrink-0"
                    />
                    <span className="text-sm text-slate-700">{t.name}</span>
                    {checked && (
                      <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </label>
                );
              })}
              {localTypes.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-3 text-center">Nenhum tipo cadastrado</p>
              )}
            </div>
            {form.type_ids.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                {form.type_ids.length} tipo{form.type_ids.length > 1 ? 's' : ''} selecionado{form.type_ids.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <FormLabel>Descrição</FormLabel>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Descreva o conteúdo do áudio..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Disciplina + Série */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Disciplina</FormLabel>
              <FormSelect value={form.discipline_id} onChange={(v) => setField('discipline_id', v)}>
                <option value="">Selecionar...</option>
                {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Série / Ano</FormLabel>
              <FormSelect value={form.grade_id} onChange={(v) => setField('grade_id', v)}>
                <option value="">Selecionar...</option>
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </FormSelect>
            </div>
          </div>

          {/* Assunto + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Assunto</FormLabel>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setField('subject', e.target.value)}
                placeholder="Ex: Biologia Celular..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(v) => setField('status', v as AudioStatus)}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Em análise</option>
              </FormSelect>
            </div>
          </div>

          {/* Destinado a */}
          <div>
            <FormLabel>Destinado a</FormLabel>
            <div className="flex gap-2">
              {([
                { value: 'professor', label: 'Professor', emoji: '🧑‍🏫', hint: 'Acervo do professor' },
                { value: 'aluno',     label: 'Aluno',     emoji: '🎒',    hint: 'Acervo do aluno'     },
              ] as { value: 'professor' | 'aluno'; label: string; emoji: string; hint: string }[]).map(({ value, label, emoji, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField('audience', value)}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.audience === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] opacity-70">{hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source type */}
          <div>
            <FormLabel required>Conteúdo do Áudio</FormLabel>
            <div className="flex gap-2 mb-3">
              {([
                { value: 'link',   label: 'Link externo',     Icon: Link2,   hint: 'SoundCloud, Spotify...' },
                { value: 'upload', label: 'Upload de arquivo', Icon: Upload,  hint: 'MP3, WAV, OGG'          },
              ] as { value: AudioSourceType; label: string; Icon: React.FC<{ className?: string }>; hint: string }[]).map(({ value, label, Icon, hint }) => (
                <button
                  key={value}
                  onClick={() => setField('source_type', value)}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.source_type === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
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

            {form.source_type === 'link' && (
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={form.audio_url}
                  onChange={(e) => setField('audio_url', e.target.value)}
                  placeholder="https://soundcloud.com/..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            )}

            {form.source_type === 'upload' && (
              <div>
                {!form.audio_file && !(isEdit && editingAudio?.audio_url) ? (
                  <label className="flex flex-col items-center justify-center gap-3 h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer">
                    <Music2 className="h-8 w-8 text-slate-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">Clique para fazer upload</p>
                      <p className="text-xs text-slate-400">MP3, WAV, OGG — máx. 100MB</p>
                    </div>
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setField('audio_file', e.target.files[0]); }}
                    />
                  </label>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Music2 className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                          {form.audio_file?.name ?? 'Arquivo já enviado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isUploading  && <Loader2 className="h-3.5 w-3.5 text-indigo-600 animate-spin" />}
                        {uploadDone   && <span className="text-[10px] font-bold text-emerald-600">Concluído!</span>}
                        {!isUploading && form.audio_file && (
                          <button
                            onClick={() => { setField('audio_file', null); setUploadProgress(0); setUploadDone(false); }}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {(isUploading || uploadDone) && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400">
                            {isUploading ? 'Enviando para o storage...' : 'Upload concluído'}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600">{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${uploadDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Projetos */}
          {projects.length > 0 && (
            <div>
              <FormLabel>Projetos</FormLabel>
              <div className="border border-slate-200 rounded-xl bg-slate-50 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {projects.map((p) => {
                  const checked = form.project_ids.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.project_ids, p.id]
                            : form.project_ids.filter((id) => id !== p.id);
                          setField('project_ids', next);
                        }}
                        className="h-3.5 w-3.5 rounded accent-indigo-600 shrink-0"
                      />
                      <span className="text-sm text-slate-700">{p.name}</span>
                      {checked && (
                        <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                          Selecionado
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {form.project_ids.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {form.project_ids.length} projeto{form.project_ids.length > 1 ? 's' : ''} selecionado{form.project_ids.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <FormLabel>Capa (imagem de capa)</FormLabel>
            {form.thumbnail_preview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.thumbnail_preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white text-sm font-semibold text-slate-700 rounded-xl cursor-pointer">
                    <ImagePlus className="h-4 w-4" /> Trocar
                    <input type="file" accept="image/png,image/jpeg" className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleThumbnailChange(e.target.files[0]); }} />
                  </label>
                  <button
                    onClick={() => setFormState((p) => ({ ...p, thumbnail_file: null, thumbnail_preview: null, thumbnail_url: null }))}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-sm font-semibold text-white rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer">
                <ImagePlus className="h-7 w-7 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">Adicionar capa</p>
                  <p className="text-xs text-slate-400">PNG, JPG — proporção 1:1 recomendada</p>
                </div>
                <input type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleThumbnailChange(e.target.files[0]); }} />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving || isUploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Publicar áudio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FormSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">{icon}</div>
      <p className="text-base font-bold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">{description}</p>
      {action}
    </div>
  );
}

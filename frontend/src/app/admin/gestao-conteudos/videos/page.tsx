'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { HeroSummary } from '@/components/ui/HeroSummary';
import {
  useDisciplines, useGrades, useProjects,
  useVideoLessons, useCreateVideoLesson, useUpdateVideoLesson,
  useInactivateVideoLesson, useActivateVideoLesson,
} from '@/hooks/useAdminData';
import type { VideoLesson, VideoLessonFilters, CreateVideoLessonPayload } from '@/types/video.types';
import { EMPTY_VIDEO_FILTERS } from '@/types/video.types';
import type { VideoStatus, VideoSourceType } from '@/types/video.types';
import { createClient } from '@/lib/supabase/client';
import { CourseExclusiveBadge } from '@/components/admin/CourseExclusiveBadge';
import {
  Plus, Search, SlidersHorizontal, X, Edit2,
  Heart, Video, Play, List, BookMarked, Star,
  ChevronDown, Filter, Loader2, AlertTriangle, RefreshCw,
  Upload, Link2, MonitorPlay, Globe,
  Trash2, ImagePlus, BarChart2, PlayCircle, Archive,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<VideoStatus, { label: string; cls: string }> = {
  active:   { label: 'Ativo',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inativo',    cls: 'bg-slate-50 text-slate-500 border-slate-200'       },
  pending:  { label: 'Em análise', cls: 'bg-amber-50 text-amber-700 border-amber-200'       },
};

const VIDEO_FAVORITES_KEY = 'kodar_video_favorites';

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

function useVideoFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIDEO_FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(VIDEO_FAVORITES_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { favorites, toggle };
}

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'Todos os vídeos', Icon: List       },
  { id: 'mine',      label: 'Meus vídeos',     Icon: BookMarked },
  { id: 'favorites', label: 'Favoritos',        Icon: Star       },
] as const;
type TabId = typeof TABS[number]['id'];

// ─────────────────────────────────────────────────────────────
// Form State
// ─────────────────────────────────────────────────────────────
interface VideoFormState {
  title: string;
  description: string;
  discipline_id: string;
  grade_id: string;
  subject: string;
  status: VideoStatus;
  source_type: VideoSourceType;
  audience: 'professor' | 'aluno';
  video_url: string;
  video_file: File | null;
  thumbnail_url: string | null;
  thumbnail_file: File | null;
  thumbnail_preview: string | null;
  project_ids: string[];
}

function buildEmptyVideoForm(): VideoFormState {
  return {
    title: '', description: '', discipline_id: '', grade_id: '',
    subject: '', status: 'active', source_type: 'link',
    audience: 'professor',
    video_url: '', video_file: null,
    thumbnail_url: null, thumbnail_file: null, thumbnail_preview: null,
    project_ids: [],
  };
}

function formFromVideo(v: VideoLesson): VideoFormState {
  return {
    title:             v.title,
    description:       v.description      ?? '',
    discipline_id:     v.discipline_id     ?? '',
    grade_id:          v.grade_id          ?? '',
    subject:           v.subject           ?? '',
    status:            v.status,
    source_type:       v.source_type,
    audience:          (v as any).source_platform === 'evoluir_alunos' ? 'aluno' : 'professor',
    video_url:         v.video_url         ?? '',
    video_file:        null,
    thumbnail_url:     v.thumbnail_url,
    thumbnail_file:    null,
    thumbnail_preview: v.thumbnail_url,
    project_ids:       (v.video_lesson_projects ?? []).map((p) => p.project_id),
  };
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
  const path     = `${user?.id ?? 'public'}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('videos_thumbnails')
    .upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(`Erro ao enviar thumbnail: ${error.message}`);

  const { data } = supabase.storage.from('videos_thumbnails').getPublicUrl(path);
  return data.publicUrl;
}

// Fallback MIME map — browsers (especially on macOS) sometimes leave file.type empty for .mov/.avi
const VIDEO_MIME: Record<string, string> = {
  mp4:  'video/mp4',
  mov:  'video/quicktime',
  avi:  'video/x-msvideo',
  webm: 'video/webm',
};

async function uploadVideo(
  supabase: ReturnType<typeof createClient>,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  if (file.size > 500 * 1024 * 1024) throw new Error('O vídeo deve ter no máximo 500MB.');

  const ext         = (file.name.split('.').pop() ?? 'mp4').toLowerCase();
  const contentType = file.type || VIDEO_MIME[ext] || 'video/mp4';
  const { data: { user } } = await supabase.auth.getUser();
  const path  = `${user?.id ?? 'public'}/${crypto.randomUUID()}.${ext}`;

  // Supabase JS client does not expose upload progress natively;
  // we simulate progress while the XHR upload runs.
  let done = false;
  const sim = setInterval(() => {
    if (done) return;
    onProgress(Math.min(90, Math.floor(Math.random() * 10 + 5)));
  }, 300);

  const { error } = await supabase.storage
    .from('videos_media')
    .upload(path, file, { contentType, upsert: false });
  done = true;
  clearInterval(sim);

  if (error) throw new Error(`Erro ao enviar vídeo: ${error.message}`);

  onProgress(100);

  // Return the storage path — the backend / frontend uses a signed URL to play it.
  const { data } = await supabase.storage.from('videos_media').createSignedUrl(path, 3600);
  return data?.signedUrl ?? path;
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function VideoaulasPage() {
  const [activeTab,    setActiveTab]    = useState<TabId>('all');
  const [filters,      setFilters]      = useState<VideoLessonFilters>(EMPTY_VIDEO_FILTERS);
  const [filtersOpen,  setFiltersOpen]  = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null);
  const [detailVideo,  setDetailVideo]  = useState<VideoLesson | null>(null);

  const { favorites, toggle: toggleFavorite } = useVideoFavorites();
  const { data: disciplinesRes } = useDisciplines(1, 100);
  const { data: gradesRes }      = useGrades(1, 100);
  const { data: projectsRes }    = useProjects(1, 100);
  const { mutate: inactivate }   = useInactivateVideoLesson();
  const { mutate: activate }     = useActivateVideoLesson();

  const disciplines = disciplinesRes?.data ?? [];
  const grades      = gradesRes?.data      ?? [];
  const projects    = projectsRes?.data    ?? [];

  const debouncedKeyword = useDebounce(filters.keyword, 400);

  // Build server-side filters (tab contributes origin filter)
  const queryFilters = useMemo<Partial<VideoLessonFilters>>(() => {
    const f: Partial<VideoLessonFilters> = { ...filters, keyword: debouncedKeyword };
    if (activeTab === 'mine') f.origin = 'custom';
    return f;
  }, [filters, debouncedKeyword, activeTab]);

  const { data: response, isLoading, isError, refetch } = useVideoLessons(
    activeTab === 'favorites' ? { ...queryFilters, keyword: debouncedKeyword } : queryFilters,
    1, 100,
  );

  const allVideos = response?.data ?? [];

  const displayList = useMemo(() => {
    if (activeTab === 'favorites') return allVideos.filter((v) => favorites.has(v.id));
    return allVideos;
  }, [allVideos, activeTab, favorites]);

  const setFilter    = (key: keyof VideoLessonFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_VIDEO_FILTERS);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters  = activeFilterCount > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* ── Hero ── */}
      <div className="px-8 pt-8">
        <HeroSummary
          title="Vídeos e Videoaulas"
          description="Gerencie conteúdos em vídeo para apoiar o aprendizado"
          icon={<Video className="w-8 h-8 text-white" />}
          themeClass="bg-gradient-to-br from-purple-700 via-blue-600 to-sky-500"
        >
          <button
            onClick={() => { setEditingVideo(null); setShowCreate(true); }}
            className="flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova videoaula
          </button>
        </HeroSummary>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-6 px-8 pb-16 items-start">

        {/* ═══════════ FILTER SIDEBAR ═══════════ */}
        <aside className={`shrink-0 sticky top-8 transition-all duration-300 ${filtersOpen ? 'w-64' : 'w-12'}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              {filtersOpen && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">Filtros</span>
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

                {/* Disciplina */}
                <FilterSelect label="Disciplina" value={filters.discipline_id} onChange={(v) => setFilter('discipline_id', v)}>
                  <option value="">Todas</option>
                  {disciplines.map((d: { id: string; name: string }) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </FilterSelect>

                {/* Série */}
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

                {/* Projeto */}
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
          </div>
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
                  {displayList.length} {displayList.length === 1 ? 'vídeo' : 'vídeos'}
                </span>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-100">
              <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-base font-bold text-slate-700">Erro ao carregar vídeos</p>
              <p className="text-sm text-slate-400 mt-1">Verifique a conexão e tente novamente.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && displayList.length === 0 && (
            <EmptyState
              icon={<Video className="h-8 w-8 text-slate-400" />}
              title={activeTab === 'favorites' ? 'Nenhum vídeo favoritado' : 'Nenhum vídeo encontrado'}
              description={
                hasActiveFilters
                  ? 'Tente remover alguns filtros.'
                  : 'Crie sua primeira videoaula clicando em "+ Nova videoaula".'
              }
              action={hasActiveFilters ? (
                <button onClick={clearFilters} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Limpar filtros
                </button>
              ) : undefined}
            />
          )}

          {/* ── Video Grid ── */}
          {!isLoading && !isError && displayList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayList.map((video) => {
                const isFav      = favorites.has(video.id);
                const discColor  = video.disciplines?.color_hex ?? '#94a3b8';
                const statusConf = STATUS_CONFIG[video.status];

                return (
                  <div
                    key={video.id}
                    onClick={() => setDetailVideo(video)}
                    className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer
                      shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]
                      hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)]
                      hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      {video.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MonitorPlay className="h-12 w-12 text-slate-300" />
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <Play className="h-5 w-5 text-blue-600 ml-0.5" />
                        </div>
                      </div>

                      {/* Source badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          video.source_type === 'link' ? 'bg-red-600/90 text-white' : 'bg-blue-700/90 text-white'
                        }`}>
                          {video.source_type === 'link'
                            ? <PlayCircle className="h-2.5 w-2.5" />
                            : <Upload className="h-2.5 w-2.5" />
                          }
                          {video.source_type === 'link' ? 'Link' : 'Upload'}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.cls}`}>
                          {statusConf.label}
                        </span>
                      </div>

                      {/* Duration */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[10px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded-md">
                            {video.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {video.title}
                      </h3>
                      {video.course && (
                        <div className="mb-1.5">
                          <CourseExclusiveBadge course={video.course} />
                        </div>
                      )}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                        {video.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {video.disciplines?.name && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: `${discColor}18`,
                              color:           discColor,
                              borderColor:     `${discColor}38`,
                            }}
                          >
                            {video.disciplines.name}
                          </span>
                        )}
                        {video.grades?.name && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {video.grades.name}
                          </span>
                        )}
                        {(video.video_lesson_projects ?? []).map((vp) =>
                          vp.projects ? (
                            <span
                              key={vp.project_id}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200"
                            >
                              {vp.projects.name}
                            </span>
                          ) : null,
                        )}
                        {video.subject && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                            {video.subject}
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div
                        className="flex items-center justify-between pt-3 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span>{video.views.toLocaleString('pt-BR')}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFavorite(video.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isFav
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title={isFav ? 'Desfavoritar' : 'Favoritar'}
                          >
                            <Heart className={`h-4 w-4 ${isFav ? 'fill-amber-500' : ''}`} />
                          </button>

                          {video.status === 'inactive' ? (
                            <button
                              onClick={() => activate(video.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Ativar"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => inactivate(video.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Inativar"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => { setEditingVideo(video); setShowCreate(true); }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDetailVideo(video)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Acessar
                          </button>
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

      {/* ── Detail Modal ── */}
      {detailVideo && (
        <VideoDetailModal
          video={detailVideo}
          isFav={favorites.has(detailVideo.id)}
          onFavorite={() => toggleFavorite(detailVideo.id)}
          onEdit={() => { setEditingVideo(detailVideo); setDetailVideo(null); setShowCreate(true); }}
          onClose={() => setDetailVideo(null)}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreate && (
        <VideoFormModal
          editingVideo={editingVideo}
          disciplines={disciplines}
          grades={grades}
          projects={projects}
          onClose={() => { setShowCreate(false); setEditingVideo(null); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Video URL helpers
// ─────────────────────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : null;
}

/** Extracts {bucket, path} from a Supabase signed URL so we can refresh it */
function parseSupabaseSignedUrl(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(?:\?|$)/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

// ─────────────────────────────────────────────────────────────
// VideoDetailModal
// ─────────────────────────────────────────────────────────────
function VideoDetailModal({ video, isFav, onFavorite, onEdit, onClose }: {
  video: VideoLesson;
  isFav: boolean;
  onFavorite: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const supabase                        = useMemo(() => createClient(), []);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playerUrl,    setPlayerUrl]    = useState<string | null>(null);
  const [playerType,   setPlayerType]   = useState<'iframe' | 'video' | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError,  setPlayerError]  = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handlePlay = useCallback(async () => {
    if (!video.video_url) return;
    setPlayerLoading(true);
    setPlayerError(null);

    try {
      if (video.source_type === 'link') {
        const yt = getYouTubeEmbedUrl(video.video_url);
        if (yt) { setPlayerUrl(yt); setPlayerType('iframe'); setIsPlaying(true); return; }
        const vi = getVimeoEmbedUrl(video.video_url);
        if (vi) { setPlayerUrl(vi); setPlayerType('iframe'); setIsPlaying(true); return; }
        // Generic link fallback — open in new tab
        window.open(video.video_url, '_blank', 'noopener,noreferrer');
        return;
      }

      // Upload — try to refresh signed URL (expires after 1h)
      const parsed = parseSupabaseSignedUrl(video.video_url);
      if (parsed) {
        const { data, error } = await supabase.storage
          .from(parsed.bucket)
          .createSignedUrl(parsed.path, 3600);
        if (error || !data?.signedUrl) throw new Error('Não foi possível gerar o link de reprodução.');
        setPlayerUrl(data.signedUrl);
      } else {
        setPlayerUrl(video.video_url);
      }
      setPlayerType('video');
      setIsPlaying(true);
    } catch (err) {
      setPlayerError(err instanceof Error ? err.message : 'Erro ao carregar vídeo.');
    } finally {
      setPlayerLoading(false);
    }
  }, [video, supabase]);

  const statusConf = STATUS_CONFIG[video.status];
  const discColor  = video.disciplines?.color_hex ?? '#94a3b8';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative z-10 w-full bg-white rounded-2xl shadow-2xl animate-bounce-in overflow-hidden transition-all duration-300 ${
        isPlaying ? 'max-w-3xl' : 'max-w-lg'
      }`}>

        {/* ── Player / Thumbnail area ── */}
        {isPlaying && playerType === 'iframe' && playerUrl ? (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={playerUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : isPlaying && playerType === 'video' && playerUrl ? (
          <div className="relative bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={playerUrl}
              controls
              autoPlay
              className="w-full max-h-[60vh]"
            />
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Thumbnail / Cover */
          <div className="relative h-52 bg-gradient-to-br from-slate-800 to-slate-900">
            {video.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MonitorPlay className="h-16 w-16 text-slate-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Play button */}
            {video.video_url && (
              <button
                onClick={handlePlay}
                disabled={playerLoading}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-200">
                  {playerLoading
                    ? <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                    : <Play className="h-7 w-7 text-blue-600 ml-1" />
                  }
                </div>
              </button>
            )}

            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-colors">
              <X className="h-4 w-4" />
            </button>
            {video.duration && (
              <span className="absolute bottom-3 right-3 text-xs font-bold bg-black/70 text-white px-2 py-0.5 rounded-md">
                {video.duration}
              </span>
            )}
          </div>
        )}

        {/* Player error */}
        {playerError && (
          <div className="px-5 pt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {playerError}
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConf.cls}`}>
              {statusConf.label}
            </span>
            {video.disciplines?.name && (
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                style={{ backgroundColor: `${discColor}18`, color: discColor, borderColor: `${discColor}38` }}
              >
                {video.disciplines.name}
              </span>
            )}
            {video.grades?.name && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {video.grades.name}
              </span>
            )}
            {(video.video_lesson_projects ?? []).map((vp) =>
              vp.projects ? (
                <span key={vp.project_id} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {vp.projects.name}
                </span>
              ) : null,
            )}
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
              video.origin === 'system'
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-violet-50 text-violet-600 border-violet-200'
            }`}>
              {video.origin === 'system' ? 'Sistema' : 'Meu conteúdo'}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-800 mb-2">{video.title}</h2>
          {video.description && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{video.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Visualizações</p>
              <p className="text-lg font-extrabold text-slate-700">{video.views.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                {video.subject ? 'Assunto' : 'Fonte'}
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {video.subject ?? (video.source_type === 'link' ? 'Link externo' : 'Upload')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
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
            {video.video_url && !isPlaying && (
              <button
                onClick={handlePlay}
                disabled={playerLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {playerLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Play className="h-3.5 w-3.5" />
                }
                {isPlaying ? 'Reproduzindo' : 'Assistir'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VideoFormModal
// ─────────────────────────────────────────────────────────────
function VideoFormModal({
  editingVideo, disciplines, grades, projects, onClose,
}: {
  editingVideo: VideoLesson | null;
  disciplines: { id: string; name: string }[];
  grades: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  onClose: () => void;
}) {
  const isEdit = Boolean(editingVideo);
  const [form,            setFormState]    = useState<VideoFormState>(
    editingVideo ? formFromVideo(editingVideo) : buildEmptyVideoForm(),
  );
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [isUploading,     setIsUploading]     = useState(false);
  const [uploadDone,      setUploadDone]      = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null);

  const videoInputRef     = useRef<HTMLInputElement>(null);
  const supabase          = useMemo(() => createClient(), []);

  const { mutateAsync: createVideo } = useCreateVideoLesson();
  const { mutateAsync: updateVideo } = useUpdateVideoLesson();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const setField = <K extends keyof VideoFormState>(key: K, value: VideoFormState[K]) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const handleThumbnailChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormState((prev) => ({ ...prev, thumbnail_file: file, thumbnail_preview: url }));
  };

  const handleVideoFileSelect = (file: File) => {
    setField('video_file', file);
    setUploadProgress(0);
    setUploadDone(false);
  };

  const canSubmit = Boolean(form.title.trim()) && (
    form.source_type === 'link'
      ? Boolean(form.video_url.trim())
      : (form.video_file !== null || (isEdit && Boolean(editingVideo?.video_url)))
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      let thumbnailUrl: string | null = form.thumbnail_url;
      let videoUrl: string | null     = form.source_type === 'link' ? form.video_url : (editingVideo?.video_url ?? null);

      // Upload thumbnail se um novo arquivo foi selecionado
      if (form.thumbnail_file) {
        thumbnailUrl = await uploadThumbnail(supabase, form.thumbnail_file);
      }

      // Upload vídeo se um arquivo foi selecionado (source_type = upload)
      if (form.source_type === 'upload' && form.video_file) {
        setIsUploading(true);
        let cumulative = 0;
        videoUrl = await uploadVideo(supabase, form.video_file, (pct) => {
          cumulative = Math.max(cumulative, pct);
          setUploadProgress(cumulative);
        });
        setIsUploading(false);
        setUploadDone(true);
      }

      const payload: CreateVideoLessonPayload = {
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        thumbnail_url: thumbnailUrl,
        discipline_id: form.discipline_id  || null,
        grade_id:      form.grade_id       || null,
        subject:       form.subject.trim() || null,
        source_type:   form.source_type,
        video_url:     videoUrl,
        status:        form.status,
        origin:          isEdit ? editingVideo!.origin : 'custom',
        source_platform: form.audience === 'aluno' ? 'evoluir_alunos' : null,
        project_ids:     form.project_ids,
      };

      if (isEdit && editingVideo) {
        await updateVideo({ id: editingVideo.id, payload });
      } else {
        await createVideo(payload);
      }

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar videoaula.');
      setIsUploading(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl animate-bounce-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              {isEdit ? <Edit2 className="h-4 w-4 text-blue-600" /> : <Video className="h-4 w-4 text-blue-600" />}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Editar Videoaula' : 'Nova Videoaula'}
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
              placeholder="Ex: Introdução à Álgebra Linear"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          {/* Descrição */}
          <div>
            <FormLabel>Descrição</FormLabel>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Descreva o conteúdo do vídeo..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 resize-none"
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
                placeholder="Ex: Álgebra, Funções..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
              />
            </div>
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(v) => setField('status', v as VideoStatus)}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Em análise</option>
              </FormSelect>
            </div>
          </div>

          {/* Audiência */}
          <div>
            <FormLabel required>Destinado a</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'professor', label: 'Professor', icon: '🧑‍🏫', hint: 'Uso pelo professor em aula' },
                { value: 'aluno',     label: 'Aluno',     icon: '🎒', hint: 'Acesso direto pelo aluno' },
              ] as const).map(({ value, label, icon, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField('audience', value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    form.audience === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px] opacity-70">{hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source type */}
          <div>
            <FormLabel required>Conteúdo do Vídeo</FormLabel>
            <div className="flex gap-2 mb-3">
              {([
                { value: 'link',   label: 'Link externo',     Icon: Link2,   hint: 'YouTube ou Vimeo' },
                { value: 'upload', label: 'Upload de arquivo', Icon: Upload,  hint: 'MP4, MOV, AVI'   },
              ] as { value: VideoSourceType; label: string; Icon: React.FC<{ className?: string }>; hint: string }[]).map(({ value, label, Icon, hint }) => (
                <button
                  key={value}
                  onClick={() => setField('source_type', value)}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.source_type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
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

            {/* Link input */}
            {form.source_type === 'link' && (
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) => setField('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
                />
              </div>
            )}

            {/* Upload */}
            {form.source_type === 'upload' && (
              <div>
                {!form.video_file && !(isEdit && editingVideo?.video_url) ? (
                  <label className="flex flex-col items-center justify-center gap-3 h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">Clique para fazer upload</p>
                      <p className="text-xs text-slate-400">MP4, MOV, AVI — máx. 500MB</p>
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleVideoFileSelect(e.target.files[0]); }}
                    />
                  </label>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                          {form.video_file?.name ?? 'Arquivo já enviado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isUploading  && <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />}
                        {uploadDone   && <span className="text-[10px] font-bold text-emerald-600">Concluído!</span>}
                        {!isUploading && form.video_file && (
                          <button
                            onClick={() => { setField('video_file', null); setUploadProgress(0); setUploadDone(false); }}
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
                          <span className="text-[10px] font-bold text-blue-600">{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${uploadDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
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
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.project_ids, p.id]
                            : form.project_ids.filter((id) => id !== p.id);
                          setField('project_ids', next);
                        }}
                        className="h-3.5 w-3.5 rounded accent-blue-600 shrink-0"
                      />
                      <span className="text-sm text-slate-700">{p.name}</span>
                      {checked && (
                        <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
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
            <FormLabel>Thumbnail (imagem de capa)</FormLabel>
            {form.thumbnail_preview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.thumbnail_preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white text-sm font-semibold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <ImagePlus className="h-4 w-4" /> Trocar
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleThumbnailChange(e.target.files[0]); }}
                    />
                  </label>
                  <button
                    onClick={() => setFormState((p) => ({ ...p, thumbnail_file: null, thumbnail_preview: null, thumbnail_url: null }))}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-sm font-semibold text-white rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors cursor-pointer">
                <ImagePlus className="h-7 w-7 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">Adicionar thumbnail</p>
                  <p className="text-xs text-slate-400">PNG, JPG — proporção 16:9 recomendada</p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleThumbnailChange(e.target.files[0]); }}
                />
              </label>
            )}
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
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving || isUploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Publicar videoaula'}
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
          className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
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
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
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
        className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">{icon}</div>
      <p className="text-base font-bold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

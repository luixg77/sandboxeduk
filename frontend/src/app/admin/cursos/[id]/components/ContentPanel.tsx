'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useVideoLessons, useAudioLessons, useQuestions, useBooks, useLessonPlans, useGames,
  useDisciplines, useGrades, useEducationStages, useProjects,
  useCreateVideoLesson, useCreateAudioLesson, useCreateQuestion, useCreateLessonPlan,
  useAudioLessonTypes, useBnccSkills,
} from '@/hooks/useAdminData';
import { createClient } from '@/lib/supabase/client';
import InputField from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import Button from '@/components/ui/Button';
import {
  Play, Headphones, HelpCircle, Book, FileText, Gamepad2, Plus, Search, Filter, X, Eye,
  Link as LinkIcon, UploadCloud, ChevronDown, Check, Image as ImageIcon,
} from 'lucide-react';
import { useItemContent, detectEmbed } from '@/hooks/useItemContent';

// ─── Types ───────────────────────────────────────────────────
type ContentType = 'video' | 'audio' | 'question' | 'book' | 'lesson_plan' | 'game';
type PanelMode = 'bank' | 'create';

interface ContentPanelProps {
  moduleId: string;
  courseId: string;
  onAdd: (item: { item_type: ContentType; item_id: string; title: string; thumbnail_url?: string }) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const TYPE_TABS: { key: ContentType; label: string; Icon: any }[] = [
  { key: 'video',       label: 'Vídeos',   Icon: Play },
  { key: 'audio',       label: 'Áudios',   Icon: Headphones },
  { key: 'question',    label: 'Questões', Icon: HelpCircle },
  { key: 'book',        label: 'Livros',   Icon: Book },
  { key: 'lesson_plan', label: 'Planos',   Icon: FileText },
  { key: 'game',        label: 'Jogos',    Icon: Gamepad2 },
];

function useDebounce(value: string, delay = 400) {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
}

// ─── Bank Panel ───────────────────────────────────────────────
function BankPanel({ contentType, onAdd }: { contentType: ContentType; onAdd: ContentPanelProps['onAdd'] }) {
  const [kw, setKw] = useState('');
  const [disciplineId, setDisciplineId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [stageId, setStageId] = useState('');
  const [status, setStatus] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [origin, setOrigin] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dkw = useDebounce(kw);
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: stagesResp } = useEducationStages(1, 100);
  const { data: typesResp } = useAudioLessonTypes();
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const stages = stagesResp?.data || [];
  const audioTypes = typesResp || [];

  const videoFilters = contentType === 'video' ? { keyword: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, status: status || undefined, origin: origin || undefined } : {};
  const audioFilters = contentType === 'audio' ? { keyword: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, status: status || undefined } : {};
  const qFilters = contentType === 'question' ? { keyword: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, stage_id: stageId || undefined, difficulty: difficulty || undefined, type: typeFilter || undefined, status: status || undefined } : {};
  const bookFilters = contentType === 'book' ? { search: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, status: status || undefined } as any : {};
  const planFilters = contentType === 'lesson_plan' ? { search: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, status: status || undefined } as any : {};
  const gameFilters = contentType === 'game' ? { search: dkw || undefined, discipline_id: disciplineId || undefined, grade_id: gradeId || undefined, status: status || undefined } as any : {};

  const { data: vResp, isLoading: vLoading } = useVideoLessons(videoFilters, 1, 20);
  const { data: aResp, isLoading: aLoading } = useAudioLessons(audioFilters, 1, 20);
  const { data: qResp, isLoading: qLoading } = useQuestions(qFilters, 1, 20);
  const { data: bResp, isLoading: bLoading } = useBooks(bookFilters, 1, 20);
  const { data: pResp, isLoading: pLoading } = useLessonPlans(planFilters, 1, 20);
  const { data: gResp, isLoading: gLoading } = useGames(gameFilters, 1, 20);

  const videos    = (vResp?.data || []) as any[];
  const audios    = (aResp?.data || []) as any[];
  const questions = (qResp?.data || []) as any[];
  const books     = (bResp?.data || []) as any[];
  const plans     = (pResp?.data || []) as any[];
  const games     = (gResp?.data || []) as any[];

  const ITEMS_BY_TYPE: Record<ContentType, any[]> = { video: videos, audio: audios, question: questions, book: books, lesson_plan: plans, game: games };
  const LOADING_BY_TYPE: Record<ContentType, boolean> = { video: vLoading, audio: aLoading, question: qLoading, book: bLoading, lesson_plan: pLoading, game: gLoading };
  const items     = ITEMS_BY_TYPE[contentType];
  const isLoading = LOADING_BY_TYPE[contentType];

  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const handleAdd = (item: any) => {
    if (contentType === 'question') {
      onAdd({ item_type: 'question', item_id: item.id, title: item.statement?.slice(0, 120) || 'Questão' });
    } else if (contentType === 'book' || contentType === 'game' || contentType === 'lesson_plan') {
      const thumb = item.thumbnail || item.thumbnail_url || item.image_url;
      onAdd({ item_type: contentType, item_id: item.id, title: item.title || 'Sem título', thumbnail_url: thumb });
    } else {
      onAdd({ item_type: contentType, item_id: item.id, title: item.title, thumbnail_url: item.thumbnail_url });
    }
  };

  const resetFilters = () => { setDisciplineId(''); setGradeId(''); setStageId(''); setStatus(''); setDifficulty(''); setOrigin(''); setTypeFilter(''); };
  const hasFilters = disciplineId || gradeId || stageId || status || difficulty || origin || typeFilter;

  return (
    <div className="space-y-3">
      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" value={kw} onChange={e => setKw(e.target.value)} placeholder={`Buscar ${({ video: 'vídeos', audio: 'áudios', question: 'questões', book: 'livros', lesson_plan: 'planos', game: 'jogos' } as const)[contentType]}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
        </div>
        <button onClick={() => setFiltersOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${filtersOpen || hasFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
          <Filter className="w-3.5 h-3.5" /> Filtros {hasFilters ? '●' : ''}
        </button>
        {hasFilters && <button onClick={resetFilters} className="px-2 py-2 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
          <select value={disciplineId} onChange={e => setDisciplineId(e.target.value)} className="col-span-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
            <option value="">Todas as disciplinas</option>
            {disciplines.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={gradeId} onChange={e => setGradeId(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
            <option value="">Todas as séries</option>
            {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {contentType === 'question' && (
            <select value={stageId} onChange={e => setStageId(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
              <option value="">Todas as etapas</option>
              {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {contentType === 'question' && (
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
              <option value="">Qualquer dificuldade</option>
              <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
            </select>
          )}
          {contentType === 'question' && (
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
              <option value="">Qualquer tipo</option>
              <option value="multiple_choice">Múltipla escolha</option><option value="true_false">Verdadeiro/Falso</option><option value="open">Aberta</option>
            </select>
          )}
          {(contentType === 'video' || contentType === 'audio') && (
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
              <option value="">Qualquer status</option>
              <option value="active">Ativo</option><option value="inactive">Inativo</option>
            </select>
          )}
          {contentType === 'video' && (
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
              <option value="">Qualquer origem</option>
              <option value="proprio">Próprio</option><option value="externo">Externo</option>
            </select>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-center text-slate-400 py-6">Nenhum conteúdo encontrado.</p>
        ) : items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-100 group transition-all">
            {(item.thumbnail_url || item.thumbnail || item.image_url)
              ? <img src={item.thumbnail_url || item.thumbnail || item.image_url} alt="" className="w-12 h-8 rounded object-cover shrink-0 border border-slate-200" />
              : <div className="w-12 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  {(() => {
                    const I = TYPE_TABS.find(t => t.key === contentType)?.Icon ?? HelpCircle;
                    return <I className="w-3.5 h-3.5 text-slate-400" />;
                  })()}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {contentType === 'question'
                  ? (item.statement?.slice(0, 90) + (item.statement?.length > 90 ? '...' : ''))
                  : (item.title || 'Sem título')}
              </p>
              <p className="text-xs text-slate-400">{item.disciplines?.name || item.disciplina || ''}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setPreviewItem(item)}
                title="Visualizar"
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleAdd(item)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewItem && (
        <BankPreviewModal
          item={previewItem}
          contentType={contentType}
          onClose={() => setPreviewItem(null)}
          onAdd={() => { handleAdd(previewItem); setPreviewItem(null); }}
        />
      )}
    </div>
  );
}

// Extrai bucket+path de uma URL de Supabase Storage (sign ou public). Mesmo padrão usado
// nos modais do professor (Modals.tsx) — quando passamos por aqui, geramos uma signed URL
// fresca de 1h, evitando o problema de token expirado.
function extractSupabasePath(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+?)(?:\?|$)/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

function useResolvedMediaUrl(rawUrl: string | null | undefined): string | null {
  const supabase = useRef(createClient()).current;
  const [url, setUrl] = useState<string | null>(rawUrl ?? null);

  useEffect(() => {
    if (!rawUrl) { setUrl(null); return; }
    const info = extractSupabasePath(rawUrl);
    if (!info) { setUrl(rawUrl); return; }
    let cancelled = false;
    supabase.storage.from(info.bucket).createSignedUrl(info.path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? rawUrl);
    });
    return () => { cancelled = true; };
  }, [rawUrl]);

  return url;
}

// ─── Bank Preview Modal ───────────────────────────────────────
function BankPreviewModal({
  item, contentType, onClose, onAdd,
}: {
  item: any;
  contentType: ContentType;
  onClose: () => void;
  onAdd: () => void;
}) {
  const { data: content, isLoading } = useItemContent(item.id, contentType);

  const typeLabel = TYPE_TABS.find(t => t.key === contentType)?.label ?? contentType;

  // URL de mídia bruta do conteúdo + URL resolvida (sempre fresca pra signed URLs)
  const rawMediaUrl =
    content?.audioUrl
    ?? content?.videoUrl
    ?? content?.fileUrl
    ?? (contentType === 'game' ? content?.imageUrl ?? null : null);
  const resolvedUrl = useResolvedMediaUrl(rawMediaUrl);

  // ESC fecha
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600">
            {typeLabel}
          </span>
          <h2 className="flex-1 font-extrabold text-slate-800 text-base truncate">
            {content?.title || item.title || 'Visualização'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          ) : !content ? (
            <p className="text-sm text-slate-500 italic">Não foi possível carregar o conteúdo.</p>
          ) : (
            <>
              {/* Mídia embutida — prioriza o tipo do item; cai em detectEmbed só pra escolher entre PDF/Office. */}
              {(() => {
                if (contentType === 'question') {
                  return (
                    <div className="space-y-3">
                      <div
                        className="text-slate-700 text-sm leading-relaxed [&_p]:my-2 [&_strong]:font-bold"
                        dangerouslySetInnerHTML={{ __html: content.statement ?? '' }}
                      />
                      {(content.alternatives?.length ?? 0) > 0 && (
                        <ul className="space-y-1.5">
                          {content.alternatives!.map(alt => (
                            <li key={alt.id}
                              className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                                alt.is_correct
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                              <strong className="shrink-0">{alt.letter}.</strong>
                              <span className="flex-1" dangerouslySetInnerHTML={{ __html: alt.text }} />
                              {alt.is_correct && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                // Áudio: SEMPRE renderiza <audio> com URL FRESCA do storage (regerada na hora)
                if (contentType === 'audio') {
                  if (!content.audioUrl) {
                    return <p className="text-sm text-slate-400 italic text-center py-8">Áudio sem URL cadastrada.</p>;
                  }
                  if (!resolvedUrl) {
                    return <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />;
                  }
                  return (
                    <div className="space-y-2">
                      <audio src={resolvedUrl} controls className="w-full" />
                      <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 font-semibold hover:underline">
                        Abrir áudio em nova aba
                      </a>
                    </div>
                  );
                }

                // Vídeo: iframe (YouTube/Vimeo/MP4) — usa detectEmbed para escolher
                if (contentType === 'video') {
                  if (!content.videoUrl) return <p className="text-sm text-slate-400 italic text-center py-8">Vídeo sem URL cadastrada.</p>;
                  if (!resolvedUrl) return <div className="aspect-video rounded-xl bg-slate-100 animate-pulse" />;
                  const ev = detectEmbed(resolvedUrl);
                  return (
                    <div className="space-y-2">
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe src={ev.src} className="w-full h-full border-0" allowFullScreen title="Vídeo" />
                      </div>
                      <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 font-semibold hover:underline">
                        Abrir em nova aba
                      </a>
                    </div>
                  );
                }

                // Livro / Plano de aula em modo "arquivo": tenta sempre o iframe quando houver fileUrl
                const planLikeFile = contentType === 'lesson_plan' && content.tipoConteudo === 'arquivo';
                if (contentType === 'book' || planLikeFile) {
                  if (!content.fileUrl) {
                    return (item.thumbnail_url || item.thumbnail || item.image_url) ? (
                      <div className="space-y-2">
                        <img src={item.thumbnail_url || item.thumbnail || item.image_url} alt="" className="w-full max-h-[40vh] object-contain rounded-xl" />
                        <p className="text-xs text-slate-400 italic">Sem arquivo cadastrado — exibindo apenas a capa.</p>
                      </div>
                    ) : <p className="text-sm text-slate-400 italic text-center py-8">Nenhum arquivo cadastrado.</p>;
                  }
                  if (!resolvedUrl) return <div className="h-[60vh] rounded-xl bg-slate-100 animate-pulse" />;
                  const ef = detectEmbed(resolvedUrl);
                  const src = ef.kind === 'office' ? ef.src : `${resolvedUrl}#view=FitH`;
                  return (
                    <div className="space-y-2">
                      <iframe
                        src={src}
                        className="w-full h-[60vh] rounded-xl border border-slate-200"
                        title="Documento"
                      />
                      <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 font-semibold hover:underline">
                        Abrir arquivo em nova aba
                      </a>
                    </div>
                  );
                }

                // Plano de aula em modo "texto"
                if (contentType === 'lesson_plan') {
                  return content.contentJson ? (
                    typeof content.contentJson === 'string' ? (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content.contentJson }} />
                    ) : (
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(content.contentJson, null, 2)}
                      </pre>
                    )
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center py-8">Plano sem conteúdo cadastrado.</p>
                  );
                }

                // Jogo: imagem ou iframe se for HTML/MP4
                if (contentType === 'game') {
                  const gUrl = resolvedUrl ?? content.imageUrl ?? null;
                  if (gUrl && /\.(html?|mp4|webm)(\?|$)/i.test(gUrl)) {
                    return (
                      <iframe src={gUrl} className="w-full h-[60vh] rounded-xl border-0" title="Jogo" />
                    );
                  }
                  return gUrl
                    ? <img src={gUrl} alt="" className="w-full max-h-[60vh] object-contain rounded-xl" />
                    : <p className="text-sm text-slate-400 italic text-center py-8">Jogo sem mídia para preview.</p>;
                }

                return null;
              })()}

              {/* Descrição (HTML) */}
              {content.description && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">Descrição</p>
                  <div
                    className="text-slate-600 text-sm leading-relaxed
                      [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-slate-800 [&_h2]:mt-3 [&_h2]:mb-1.5
                      [&_h3]:text-sm  [&_h3]:font-bold      [&_h3]:text-slate-800 [&_h3]:mt-2 [&_h3]:mb-1
                      [&>*:first-child]:mt-0
                      [&_p]:my-2
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                      [&_strong]:font-bold [&_strong]:text-slate-800
                      [&_em]:italic
                      [&_a]:text-emerald-600 [&_a]:font-semibold [&_a:hover]:underline
                    "
                    dangerouslySetInnerHTML={{ __html: content.description }}
                  />
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {item.disciplines?.name && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{item.disciplines.name}</span>
                )}
                {item.grades?.name && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{item.grades.name}</span>
                )}
                {content.duration && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">⏱ {content.duration}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Adicionar à Trilha
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Create Form ────────────────────────────────────────
function VideoCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const supabase = createClient();
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const projects = projsResp?.data || [];

  const { mutateAsync: createVideo, isPending } = useCreateVideoLesson();

  const [form, setForm] = useState({ title: '', description: '', discipline_id: '', grade_id: '', subject: '', source_type: 'link' as 'link' | 'upload', video_url: '', status: 'active' });
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let thumbnailUrl = '';
    let videoUrl = form.video_url;

    try {
      if (thumbFile) {
        const ext = thumbFile.name.split('.').pop();
        const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(
          (await supabase.storage.from('logoclient').upload(`videos/${Date.now()}.${ext}`, thumbFile, { upsert: false })).data?.path || ''
        );
        thumbnailUrl = publicUrl;
      }
      if (form.source_type === 'upload' && videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `uploads/${Date.now()}.${ext}`;
        await supabase.storage.from('logoclient').upload(path, videoFile, { upsert: false });
        const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(path);
        videoUrl = publicUrl;
      }
      const result = await createVideo({
        title: form.title.trim(),
        description: form.description,
        discipline_id: form.discipline_id || undefined,
        grade_id: form.grade_id || undefined,
        subject: form.subject,
        source_type: form.source_type,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || undefined,
        status: form.status as any,
        project_ids: projectIds,
        course_id: courseId,
      });
      onCreated(result);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar vídeo.');
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField label="Título *" placeholder="Título do vídeo" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Status" options={[{ value: 'active', label: 'Ativo' }, { value: 'review', label: 'Em análise' }, { value: 'inactive', label: 'Inativo' }]} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} />
        <InputField label="Assunto/Fonte" placeholder="ex: SAEB 2023" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
      </div>

      {/* Source type */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Fonte *</label>
        <div className="flex gap-2">
          {(['link', 'upload'] as const).map(t => (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, source_type: t }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${form.source_type === t ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {t === 'link' ? <LinkIcon className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {t === 'link' ? 'Link Externo' : 'Upload'}
            </button>
          ))}
        </div>
      </div>
      {form.source_type === 'link'
        ? <InputField label="URL do Vídeo *" placeholder="https://youtube.com/..." value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} required />
        : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Arquivo de Vídeo *</label>
            <div onClick={() => videoRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{videoFile ? videoFile.name : 'Clique para selecionar MP4/MOV (máx. 500MB)'}</p>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        )
      }

      {/* Thumbnail */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail</label>
        <div className="flex items-center gap-3">
          <div onClick={() => thumbRef.current?.click()} className="w-24 h-14 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-slate-100 transition-colors shrink-0">
            {thumbPreview ? <img src={thumbPreview} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
          </div>
          <p className="text-xs text-slate-500">Recomendado 16:9. PNG ou JPG.</p>
          <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); } }} />
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Projetos</label>
          <div className="flex flex-wrap gap-2">
            {projects.map((p: any) => {
              const sel = projectIds.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setProjectIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button type="submit" loading={isLoading} disabled={!form.title.trim() || (form.source_type === 'link' && !form.video_url) || (form.source_type === 'upload' && !videoFile) || isLoading}>
          Criar Vídeo e Adicionar
        </Button>
      </div>
    </form>
  );
}

// ─── Audio Create Form ────────────────────────────────────────
function AudioCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const supabase = createClient();
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: typesResp } = useAudioLessonTypes();
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const audioTypes = typesResp || [];
  const projects = projsResp?.data || [];

  const { mutateAsync: createAudio, isPending } = useCreateAudioLesson();
  const [form, setForm] = useState({ title: '', description: '', discipline_id: '', grade_id: '', source_type: 'link' as 'link' | 'upload', audio_url: '', status: 'active' });
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let thumbnailUrl = '';
    let audioUrl = form.audio_url;
    try {
      if (thumbFile) {
        const ext = thumbFile.name.split('.').pop();
        const path = `audios-thumb/${Date.now()}.${ext}`;
        await supabase.storage.from('logoclient').upload(path, thumbFile, { upsert: false });
        const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(path);
        thumbnailUrl = publicUrl;
      }
      if (form.source_type === 'upload' && audioFile) {
        const ext = audioFile.name.split('.').pop();
        const path = `audios/${Date.now()}.${ext}`;
        await supabase.storage.from('logoclient').upload(path, audioFile, { upsert: false });
        const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(path);
        audioUrl = publicUrl;
      }
      const result = await createAudio({
        title: form.title.trim(), description: form.description,
        discipline_id: form.discipline_id || undefined, grade_id: form.grade_id || undefined,
        source_type: form.source_type, audio_url: audioUrl,
        thumbnail_url: thumbnailUrl || undefined, status: form.status as any,
        type_ids: typeIds, project_ids: projectIds,
        course_id: courseId,
      });
      onCreated(result);
    } catch (err) { console.error(err); alert('Erro ao criar áudio.'); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField label="Título *" placeholder="Título do áudio" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      <SelectField label="Status" options={[{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }]} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} />

      {audioTypes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Áudio</label>
          <div className="flex flex-wrap gap-1.5">
            {audioTypes.map((t: any) => {
              const sel = typeIds.includes(t.id);
              return <button key={t.id} type="button" onClick={() => setTypeIds(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{t.name}</button>;
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fonte *</label>
        <div className="flex gap-2 mb-2">
          {(['link', 'upload'] as const).map(t => (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, source_type: t }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${form.source_type === t ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {t === 'link' ? <LinkIcon className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {t === 'link' ? 'Link' : 'Upload'}
            </button>
          ))}
        </div>
        {form.source_type === 'link'
          ? <InputField label="" placeholder="https://..." value={form.audio_url} onChange={e => setForm(p => ({ ...p, audio_url: e.target.value }))} required />
          : <div onClick={() => audioRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50">
              <Headphones className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{audioFile ? audioFile.name : 'Clique para selecionar MP3/WAV'}</p>
              <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
            </div>
        }
      </div>

      <div className="flex items-center gap-3">
        <div onClick={() => thumbRef.current?.click()} className="w-20 h-12 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0">
          {thumbPreview ? <img src={thumbPreview} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
        </div>
        <p className="text-xs text-slate-500">Thumbnail opcional</p>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); } }} />
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" loading={isPending || uploading} disabled={!form.title.trim() || (form.source_type === 'link' && !form.audio_url) || (form.source_type === 'upload' && !audioFile)}>
          Criar Áudio e Adicionar
        </Button>
      </div>
    </form>
  );
}

// ─── Question Create Form ─────────────────────────────────────
function QuestionCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: stagesResp } = useEducationStages(1, 100);
  const { data: bnccResp } = useBnccSkills();
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const stages = stagesResp?.data || [];
  const bnccSkills = bnccResp || [];

  const { mutateAsync: createQuestion, isPending } = useCreateQuestion();

  const [form, setForm] = useState({ statement: '', type: 'multiple_choice', difficulty: 'medium', origin: 'proprio', year: new Date().getFullYear().toString(), discipline_id: '', stage_id: '', grade_id: '', bncc_skill_id: '', status: 'active' });
  const [alternatives, setAlternatives] = useState([
    { letter: 'A', text: '', is_correct: false },
    { letter: 'B', text: '', is_correct: false },
    { letter: 'C', text: '', is_correct: false },
    { letter: 'D', text: '', is_correct: false },
  ]);
  const [bnccSearch, setBnccSearch] = useState('');

  const setCorrect = (idx: number) => {
    setAlternatives(prev => prev.map((a, i) => ({ ...a, is_correct: i === idx })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createQuestion({
        question: {
          statement: form.statement.trim(),
          type: form.type as any,
          difficulty: (form.difficulty || null) as any,
          origin: form.origin as any,
          year: parseInt(form.year) || null,
          discipline_id: form.discipline_id || null,
          subject_id: null,
          stage_id: form.stage_id || null,
          grade_id: form.grade_id || null,
          bncc_skill_id: form.bncc_skill_id || null,
          status: form.status as any,
          comment: null,
          answer_key: null,
          image_url: null,
          source: null,
          course_id: courseId,
        },
        alternatives: form.type === 'multiple_choice' || form.type === 'true_false'
          ? alternatives.filter(a => a.text.trim()).map(a => ({ ...a, image_url: null }))
          : undefined,
      });
      onCreated(result);
    } catch (err) { console.error(err); alert('Erro ao criar questão.'); }
  };

  const filteredBncc = bnccSkills.filter((s: any) => s.code.toLowerCase().includes(bnccSearch.toLowerCase()) || s.description.toLowerCase().includes(bnccSearch.toLowerCase())).slice(0, 20);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Enunciado *</label>
        <textarea value={form.statement} onChange={e => setForm(p => ({ ...p, statement: e.target.value }))} rows={3} required
          placeholder="Digite o enunciado da questão..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Tipo" options={[{ value: 'multiple_choice', label: 'Múltipla escolha' }, { value: 'true_false', label: 'Verdadeiro/Falso' }, { value: 'open', label: 'Aberta' }]} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
        <SelectField label="Dificuldade" options={[{ value: 'easy', label: 'Fácil' }, { value: 'medium', label: 'Médio' }, { value: 'hard', label: 'Difícil' }]} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Etapa" options={[{ value: '', label: '— nenhuma —' }, ...stages.map((s: any) => ({ value: s.id, label: s.name }))]} value={form.stage_id} onChange={e => setForm(p => ({ ...p, stage_id: e.target.value }))} />
        <SelectField label="Origem" options={[{ value: 'proprio', label: 'Próprio' }, { value: 'enem', label: 'ENEM' }, { value: 'saeb', label: 'SAEB' }, { value: 'outro', label: 'Outro' }]} value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Ano" type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
        <SelectField label="Status" options={[{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }]} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} />
      </div>

      {/* BNCC search */}
      {bnccSkills.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Habilidade BNCC</label>
          <input type="text" value={bnccSearch} onChange={e => setBnccSearch(e.target.value)} placeholder="Pesquisar código ou descrição..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-1" />
          {bnccSearch && (
            <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-lg bg-white">
              {filteredBncc.map((s: any) => (
                <button key={s.id} type="button" onClick={() => { setForm(p => ({ ...p, bncc_skill_id: s.id })); setBnccSearch(s.code); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${form.bncc_skill_id === s.id ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  <span className="font-bold">{s.code}</span> — {s.description.slice(0, 60)}
                </button>
              ))}
            </div>
          )}
          {form.bncc_skill_id && !bnccSearch && <p className="text-xs text-emerald-600 mt-1">✓ Habilidade selecionada</p>}
        </div>
      )}

      {/* Alternatives */}
      {(form.type === 'multiple_choice' || form.type === 'true_false') && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Alternativas *</label>
          <div className="space-y-2">
            {(form.type === 'true_false' ? alternatives.slice(0, 2).map((a, i) => i === 0 ? { ...a, text: a.text || 'Verdadeiro' } : { ...a, text: a.text || 'Falso' }) : alternatives).map((alt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button type="button" onClick={() => setCorrect(idx)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${alt.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}>
                  {alt.is_correct && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs font-bold text-slate-500 w-5 shrink-0">{alt.letter}</span>
                {form.type === 'true_false'
                  ? <span className="flex-1 text-sm text-slate-700">{idx === 0 ? 'Verdadeiro' : 'Falso'}</span>
                  : <input type="text" value={alt.text} onChange={e => setAlternatives(prev => prev.map((a, i) => i === idx ? { ...a, text: e.target.value } : a))}
                      placeholder={`Alternativa ${alt.letter}`}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button type="submit" loading={isPending} disabled={!form.statement.trim() || isPending}>
          Criar Questão e Adicionar
        </Button>
      </div>
    </form>
  );
}

// ─── Book Create Form ────────────────────────────────────────
function BookCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const supabase = createClient();
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const projects = projsResp?.data || [];

  const [form, setForm] = useState({ title: '', description: '', discipline_id: '', grade_id: '', file_url: '', thumbnail: '' });
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orgId = (await supabase.from('users').select('organization_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()).data?.organization_id;
      const disciplina = disciplines.find((d: any) => d.id === form.discipline_id)?.name || '';
      const serie      = grades.find((g: any) => g.id === form.grade_id)?.name || '';
      const { data, error } = await supabase
        .from('books')
        .insert({
          title: form.title.trim(),
          description: form.description,
          file_url: form.file_url || null,
          thumbnail: form.thumbnail || null,
          discipline_id: form.discipline_id || null,
          grade_id: form.grade_id || null,
          disciplina, serie,
          status: 'publicado',
          organization_id: orgId,
          course_id: courseId,
        }).select().single();
      if (error) throw error;
      if (projectIds.length > 0) {
        await supabase.from('book_projects').insert(projectIds.map(pid => ({ book_id: (data as any).id, project_id: pid })));
      }
      onCreated(data);
    } catch (err) { console.error(err); alert('Erro ao criar livro.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField label="Título *" placeholder="Título do livro" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      <InputField label="URL do arquivo (PDF/EPUB)" placeholder="https://..." value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} />
      <InputField label="Capa (URL da imagem)" placeholder="https://..." value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Projetos</label>
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p: any) => {
            const sel = projectIds.includes(p.id);
            return <button key={p.id} type="button" onClick={() => setProjectIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{p.name}</button>;
          })}
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" loading={loading} disabled={!form.title.trim() || loading}>Criar Livro e Adicionar</Button>
      </div>
    </form>
  );
}

// ─── Lesson Plan Create Form ──────────────────────────────────
function LessonPlanCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const projects = projsResp?.data || [];
  const supabase = createClient();

  const { mutateAsync: createPlan, isPending } = useCreateLessonPlan();
  const [form, setForm] = useState({
    title: '', description: '', tipo_documento: 'plano_aula' as 'plano_aula' | 'sequencia_didatica' | 'material_diverso',
    tipo_conteudo: 'texto' as 'texto' | 'arquivo', file_url: '', thumbnail: '', discipline_id: '', grade_id: '',
  });
  const [projectIds, setProjectIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const disciplina = disciplines.find((d: any) => d.id === form.discipline_id)?.name || '';
      const serie      = grades.find((g: any) => g.id === form.grade_id)?.name || '';
      const result = await createPlan({
        title: form.title.trim(),
        description: form.description,
        tipo_documento: form.tipo_documento,
        tipo_conteudo: form.tipo_conteudo,
        file_url: form.file_url || null,
        thumbnail: form.thumbnail || null,
        discipline_id: form.discipline_id || null,
        grade_id: form.grade_id || null,
        disciplina, serie,
        status: 'publicado',
        course_id: courseId,
      } as any);
      if (projectIds.length > 0 && result?.id) {
        await supabase.from('lesson_plan_projects').insert(projectIds.map(pid => ({ lesson_plan_id: (result as any).id, project_id: pid })));
      }
      onCreated(result);
    } catch (err) { console.error(err); alert('Erro ao criar plano.'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField label="Título *" placeholder="Título do plano" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Tipo de documento *" options={[
          { value: 'plano_aula', label: 'Plano de Aula' },
          { value: 'sequencia_didatica', label: 'Sequência Didática' },
          { value: 'material_diverso', label: 'Material Diverso' },
        ]} value={form.tipo_documento} onChange={e => setForm(p => ({ ...p, tipo_documento: e.target.value as any }))} />
        <SelectField label="Conteúdo *" options={[
          { value: 'texto', label: 'Texto' },
          { value: 'arquivo', label: 'Arquivo' },
        ]} value={form.tipo_conteudo} onChange={e => setForm(p => ({ ...p, tipo_conteudo: e.target.value as any }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      {form.tipo_conteudo === 'arquivo' && (
        <InputField label="URL do arquivo (PDF/DOCX/PPTX)" placeholder="https://..." value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} />
      )}
      <InputField label="Thumbnail (URL)" placeholder="https://..." value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Projetos</label>
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p: any) => {
            const sel = projectIds.includes(p.id);
            return <button key={p.id} type="button" onClick={() => setProjectIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{p.name}</button>;
          })}
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" loading={isPending} disabled={!form.title.trim() || isPending}>Criar Plano e Adicionar</Button>
      </div>
    </form>
  );
}

// ─── Game Create Form ─────────────────────────────────────────
function GameCreateForm({ onCreated, courseId }: { onCreated: (item: any) => void; courseId: string | null }) {
  const supabase = createClient();
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const projects = projsResp?.data || [];

  const [form, setForm] = useState({ title: '', description: '', objective: '', engine: 'unity', layout: '', difficulty: 1, discipline_id: '', grade_id: '', image_url: '', thumbnail: '' });
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orgId = (await supabase.from('users').select('organization_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()).data?.organization_id;
      const disciplina = disciplines.find((d: any) => d.id === form.discipline_id)?.name || '';
      const serie      = grades.find((g: any) => g.id === form.grade_id)?.name || '';
      const { data, error } = await supabase
        .from('games')
        .insert({
          title: form.title.trim(),
          description: form.description,
          objective: form.objective || null,
          engine: form.engine || null,
          layout: form.layout || null,
          difficulty: form.difficulty || null,
          image_url: form.image_url || null,
          thumbnail: form.thumbnail || null,
          discipline_id: form.discipline_id || null,
          grade_id: form.grade_id || null,
          disciplina, serie,
          status: 'publicado',
          organization_id: orgId,
          course_id: courseId,
        }).select().single();
      if (error) throw error;
      if (projectIds.length > 0) {
        await supabase.from('game_projects').insert(projectIds.map(pid => ({ game_id: (data as any).id, project_id: pid })));
      }
      onCreated(data);
    } catch (err) { console.error(err); alert('Erro ao criar jogo.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField label="Título *" placeholder="Título do jogo" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivo</label>
        <textarea value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" options={[{ value: '', label: '— nenhuma —' }, ...disciplines.map((d: any) => ({ value: d.id, label: d.name }))]} value={form.discipline_id} onChange={e => setForm(p => ({ ...p, discipline_id: e.target.value }))} />
        <SelectField label="Série" options={[{ value: '', label: '— nenhuma —' }, ...grades.map((g: any) => ({ value: g.id, label: g.name }))]} value={form.grade_id} onChange={e => setForm(p => ({ ...p, grade_id: e.target.value }))} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <InputField label="Engine" placeholder="unity, html5..." value={form.engine} onChange={e => setForm(p => ({ ...p, engine: e.target.value }))} />
        <InputField label="Layout" placeholder="quiz_show..." value={form.layout} onChange={e => setForm(p => ({ ...p, layout: e.target.value }))} />
        <InputField label="Dificuldade" type="number" value={String(form.difficulty)} onChange={e => setForm(p => ({ ...p, difficulty: Number(e.target.value) || 1 }))} />
      </div>
      <InputField label="URL do jogo (HTML/MP4)" placeholder="https://..." value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} />
      <InputField label="Thumbnail (URL)" placeholder="https://..." value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} />
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Projetos</label>
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p: any) => {
            const sel = projectIds.includes(p.id);
            return <button key={p.id} type="button" onClick={() => setProjectIds(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{p.name}</button>;
          })}
        </div>
      </div>
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" loading={loading} disabled={!form.title.trim() || loading}>Criar Jogo e Adicionar</Button>
      </div>
    </form>
  );
}

// ─── Main ContentPanel Export ─────────────────────────────────
export default function ContentPanel({ moduleId, courseId, onAdd }: ContentPanelProps) {
  const [mode, setMode] = useState<PanelMode>('create');
  const [contentType, setContentType] = useState<ContentType>('video');
  // true = exclusivo do curso (default); false = adiciona também ao acervo geral
  const [courseOnly, setCourseOnly] = useState<boolean>(true);

  const handleCreated = (result: any) => {
    if (!result) return;
    onAdd({
      item_type: contentType,
      item_id: result.id,
      title: result.title || result.statement?.slice(0, 120) || 'Conteúdo',
      thumbnail_url: result.thumbnail_url,
    });
  };

  // Quando exclusivo=true, repassa courseId para os forms; caso contrário, null.
  const targetCourseId = courseOnly ? courseId : null;

  return (
    <div className="border-t-2 border-dashed border-emerald-200 bg-emerald-50/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Adicionar à Trilha</span>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          <button onClick={() => setMode('create')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'create' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            Criar Novo
          </button>
          <button onClick={() => setMode('bank')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'bank' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            Do Banco
          </button>
        </div>
      </div>

      {/* Content type tabs */}
      <div className="flex gap-0 border-b border-slate-200 bg-white/50 px-4">
        {TYPE_TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setContentType(key)}
            className={`flex items-center gap-1.5 px-3 pb-2 pt-2 text-xs font-semibold border-b-2 transition-colors ${contentType === key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Toggle: exclusivo do curso (visível só no modo Criar) */}
      {mode === 'create' && (
        <div className="px-4 pt-3 pb-1">
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
            <input
              type="checkbox"
              checked={courseOnly}
              onChange={e => setCourseOnly(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
            />
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-700">Material exclusivo deste curso</p>
              <p className="text-slate-500">
                {courseOnly
                  ? 'Não aparece no acervo geral — fica visível apenas dentro deste curso.'
                  : 'Também ficará disponível no acervo para outros cursos reutilizarem.'}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Panel content */}
      <div className="p-4">
        {mode === 'bank' && <BankPanel contentType={contentType} onAdd={onAdd} />}
        {mode === 'create' && contentType === 'video'       && <VideoCreateForm      onCreated={handleCreated} courseId={targetCourseId} />}
        {mode === 'create' && contentType === 'audio'       && <AudioCreateForm      onCreated={handleCreated} courseId={targetCourseId} />}
        {mode === 'create' && contentType === 'question'    && <QuestionCreateForm   onCreated={handleCreated} courseId={targetCourseId} />}
        {mode === 'create' && contentType === 'book'        && <BookCreateForm       onCreated={handleCreated} courseId={targetCourseId} />}
        {mode === 'create' && contentType === 'lesson_plan' && <LessonPlanCreateForm onCreated={handleCreated} courseId={targetCourseId} />}
        {mode === 'create' && contentType === 'game'        && <GameCreateForm       onCreated={handleCreated} courseId={targetCourseId} />}
      </div>
    </div>
  );
}

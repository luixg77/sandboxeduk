'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ProfBadge,
  ProgressBar,
  CircularProgress,
  ProfessorButton,
  FilterSelect,
  FinalizeCourseModal,
} from '@/components/professor-ui';
import {
  useTrilhaById,
  applyTrilhaProgress,
  getModuleStatus,
  fmtDate,
  type Trilha,
  type TrilhaModule,
  type TrilhaModuleItem,
} from '@/hooks/useTrilhas';
import { useTrilhaProgress } from '@/hooks/useTrilhaProgress';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';
import { useItemContent, detectEmbed } from '@/hooks/useItemContent';

/* ─────────────── Item type configs ─────────────── */

const ITEM_TYPE_LABEL: Record<TrilhaModuleItem['item_type'], string> = {
  video:       'Vídeo',
  audio:       'Áudio',
  question:    'Questão',
  book:        'Livro',
  lesson_plan: 'Plano de Aula',
  game:        'Jogo',
};

const ITEM_TYPE_BADGE: Record<TrilhaModuleItem['item_type'], any> = {
  video:       'orange',
  audio:       'teal',
  question:    'amber',
  book:        'green',
  lesson_plan: 'blue',
  game:        'pink',
};

const ITEM_TYPE_ICON_CLS: Record<TrilhaModuleItem['item_type'], string> = {
  video:       'bg-orange-50 text-orange-600',
  audio:       'bg-teal-50    text-teal-600',
  question:    'bg-amber-50   text-amber-600',
  book:        'bg-green-50   text-green-700',
  lesson_plan: 'bg-blue-50    text-blue-600',
  game:        'bg-pink-50    text-pink-600',
};

/* ─────────────── Tipos / helpers ─────────────── */

interface FlatItem {
  moduleIndex: number;
  moduleId:    string;
  moduleTitle: string;
  itemIndex:   number;
  globalIndex: number;
  item:        TrilhaModuleItem;
}

function flatten(trilha: Trilha): FlatItem[] {
  const out: FlatItem[] = [];
  let g = 0;
  trilha.modules.forEach((m, mi) => {
    m.items.forEach((it, ii) => {
      out.push({
        moduleIndex: mi,
        moduleId:    m.id,
        moduleTitle: m.title,
        itemIndex:   ii,
        globalIndex: g++,
        item:        it,
      });
    });
  });
  return out;
}

/* ─────────────── Sidebar ─────────────── */

interface SidebarProps {
  trilha:               Trilha;
  trilhaId:             string;
  currentId:            string;
  isComplete:           (id: string, mock: boolean) => boolean;
  selectedModuleIndex:  number;
  onSelectModule:       (index: number) => void;
  isOpen:               boolean;
  onClose:              () => void;
}

function Sidebar({
  trilha, trilhaId, currentId, isComplete,
  selectedModuleIndex, onSelectModule,
  isOpen, onClose,
}: SidebarProps) {
  const total      = trilha.modules.length;
  const safeIndex  = Math.min(Math.max(0, selectedModuleIndex), total - 1);
  const selected   = trilha.modules[safeIndex];
  const items      = selected?.items ?? [];
  const doneCount  = items.filter(it => isComplete(it.id, it.completed)).length;
  const pct        = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const moduleOptions = trilha.modules.map((m, i) => ({
    value: String(i),
    label: `Módulo ${i + 1} de ${total}${getModuleStatus(m) === 'bloqueado' ? ' · bloqueado' : ''}`,
  }));

  const selectedTitle  = selected?.title.replace(/^\d+\.\s*/, '') ?? '';
  const selectedLocked = selected ? getModuleStatus(selected) === 'bloqueado' : false;

  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < total - 1;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[88vw] max-w-[360px] bg-white border-r border-slate-100 flex flex-col
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:w-[360px] md:translate-x-0 md:transition-none md:shrink-0
        `}
      >
        {/* Header do drawer (mobile) com botão fechar */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-100 shrink-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Módulos</p>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Seletor de módulo */}
      <div className="p-4 border-b border-slate-100 shrink-0 space-y-3">
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
            Módulo
          </label>
          <FilterSelect
            accentColor="orange"
            value={String(safeIndex)}
            onChange={e => onSelectModule(Number(e.target.value))}
            options={moduleOptions}
            placeholder="Selecionar módulo"
          />
          {selectedTitle && (
            <p className="text-sm font-extrabold text-slate-700 leading-snug px-1">
              {selectedTitle}
            </p>
          )}
        </div>

        {/* Mini progresso do módulo selecionado */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar value={pct} color={pct === 100 ? 'green' : 'orange'} size="xs" />
          </div>
          <span className="text-[11px] font-extrabold text-slate-600">{doneCount}/{items.length}</span>
        </div>
      </div>

      {/* Itens do módulo selecionado */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedLocked && selected && (
          <div className="rounded-2xl bg-slate-100 border border-slate-200 p-3 flex items-start gap-2.5 text-slate-600 text-xs">
            <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>
              Módulo bloqueado.<br/>
              Disponível em <strong className="text-slate-800">{fmtDate(selected.start_date)}</strong>.
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <p className="px-2 py-4 text-sm text-slate-400 italic">Este módulo não tem itens.</p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((it, ii) => {
              const completed = isComplete(it.id, it.completed);
              const isCurrent = it.id === currentId;
              const baseCls = `flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm`;
              const inner = (
                <>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors
                      ${selectedLocked
                        ? 'bg-slate-100 border-2 border-slate-300 text-slate-400'
                        : completed
                          ? 'bg-green-500 border-2 border-green-500 text-white'
                          : isCurrent
                            ? 'bg-white border-2 border-orange-400'
                            : 'bg-white border-2 border-slate-300'}
                    `}
                  >
                    {selectedLocked ? (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M5.25 21h13.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5z" />
                      </svg>
                    ) : completed && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`truncate font-bold leading-tight
                        ${selectedLocked ? 'text-slate-400'
                          : isCurrent     ? 'text-orange-700'
                          : completed     ? 'text-slate-500'
                          :                 'text-slate-700'}
                      `}
                    >
                      {it.title}
                    </p>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mt-0.5">
                      {ii + 1}. {selectedLocked ? 'Bloqueado' : ITEM_TYPE_LABEL[it.item_type]}
                    </p>
                  </div>
                </>
              );
              return (
                <li key={it.id}>
                  {selectedLocked ? (
                    <div
                      aria-disabled="true"
                      title="Disponível na data de início do módulo"
                      className={`${baseCls} cursor-not-allowed select-none border border-transparent`}
                    >
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={`/professor/trilhas/${trilhaId}/conteudo/${it.id}`}
                      className={`${baseCls} transition-colors
                        ${isCurrent
                          ? 'bg-orange-50 border border-orange-200'
                          : 'border border-transparent hover:bg-slate-50'}
                      `}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Rodapé: navegação entre módulos */}
      <div className="p-3 border-t border-slate-100 shrink-0 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => hasPrev && onSelectModule(safeIndex - 1)}
          disabled={!hasPrev}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-colors
            ${hasPrev
              ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'}
          `}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Módulo anterior
        </button>
        <button
          type="button"
          onClick={() => hasNext && onSelectModule(safeIndex + 1)}
          disabled={!hasNext}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-colors
            ${hasNext
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'}
          `}
        >
          Próximo módulo
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </aside>
    </>
  );
}

/* ─────────────── Content viewer ─────────────── */

const PROSE_CLS = `text-slate-600 text-[15px] leading-relaxed
  [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-800 [&_h1]:mt-6 [&_h1]:mb-3
  [&_h2]:text-xl  [&_h2]:font-extrabold [&_h2]:text-slate-800 [&_h2]:mt-5 [&_h2]:mb-2
  [&_h3]:text-lg  [&_h3]:font-bold      [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2
  [&_h4]:text-base [&_h4]:font-bold     [&_h4]:text-slate-800 [&_h4]:mt-3 [&_h4]:mb-1.5
  [&>*:first-child]:mt-0
  [&_p]:my-3
  [&_ul]:list-disc    [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
  [&_li]:leading-relaxed
  [&_a]:text-orange-600 [&_a]:font-semibold [&_a:hover]:underline
  [&_strong]:font-bold  [&_strong]:text-slate-800
  [&_em]:italic
  [&_blockquote]:border-l-4 [&_blockquote]:border-orange-400 [&_blockquote]:pl-4
  [&_blockquote]:italic     [&_blockquote]:text-slate-600 [&_blockquote]:my-4
  [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
  [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_pre]:my-4
  [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
  [&_img]:rounded-2xl [&_img]:my-4
  [&_hr]:my-6 [&_hr]:border-slate-200
  [&_table]:w-full [&_table]:my-4 [&_table]:text-sm
  [&_th]:bg-slate-50 [&_th]:font-bold [&_th]:text-left [&_th]:p-2 [&_th]:border [&_th]:border-slate-200
  [&_td]:p-2 [&_td]:border [&_td]:border-slate-200
`;

/** Renderiza o campo description (HTML) ou plain text com line-breaks. */
function DescriptionBlock({ html }: { html: string | null | undefined }) {
  if (!html?.trim()) return null;
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8">
      <h3 className="font-extrabold text-slate-800 text-base mb-3">Descrição</h3>
      <div className={PROSE_CLS} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

/** iframe/img genérico para PDFs, Office files e imagens. */
function FileEmbed({ url }: { url: string }) {
  const { kind, src } = detectEmbed(url);

  if (kind === 'image') {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <img src={src} alt="" className="w-full h-auto block" />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <iframe
          src={`${src}#view=FitH`}
          className="w-full h-[60vh] md:h-[80vh] border-0"
          title="Visualização do arquivo"
        />
      </div>
    );
  }

  if (kind === 'office') {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <iframe
          src={src}
          className="w-full h-[60vh] md:h-[80vh] border-0"
          title="Visualização do documento"
        />
      </div>
    );
  }

  if (kind === 'video-iframe') {
    return (
      <div className="rounded-3xl bg-black border border-slate-100 shadow-sm overflow-hidden aspect-video">
        <iframe
          src={src}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="Reprodutor de vídeo"
        />
      </div>
    );
  }

  if (kind === 'audio') {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
        <audio src={src} controls className="w-full" />
      </div>
    );
  }

  // Tipo desconhecido — tenta iframe genérico
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <iframe
        src={src}
        className="w-full h-[80vh] border-0"
        title="Conteúdo"
      />
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-100 animate-pulse h-[60vh]" />
  );
}

function ContentViewer({ item }: { item: TrilhaModuleItem }) {
  const { data: content, isLoading, isError } = useItemContent(item.item_id, item.item_type);

  if (isLoading) return <ViewerSkeleton />;
  if (isError || !content) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 text-center text-slate-500 text-sm">
        Não foi possível carregar o conteúdo deste item.
      </div>
    );
  }

  switch (content.type) {
    case 'video': {
      const url = content.videoUrl;
      return (
        <div className="space-y-5">
          {url ? (
            <FileEmbed url={url} />
          ) : (
            <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-500 text-sm">
              Nenhum vídeo cadastrado para este item.
            </div>
          )}
          <DescriptionBlock html={content.description} />
        </div>
      );
    }

    case 'audio': {
      const url = content.audioUrl;
      return (
        <div className="space-y-5">
          {url ? (
            <FileEmbed url={url} />
          ) : (
            <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-500 text-sm">
              Nenhum áudio cadastrado para este item.
            </div>
          )}
          <DescriptionBlock html={content.description} />
        </div>
      );
    }

    case 'book': {
      const url = content.fileUrl;
      return (
        <div className="space-y-5">
          {url ? (
            <FileEmbed url={url} />
          ) : (
            <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-500 text-sm">
              Nenhum arquivo cadastrado para este livro.
            </div>
          )}
          <DescriptionBlock html={content.description} />
        </div>
      );
    }

    case 'lesson_plan': {
      const url = content.fileUrl;
      const json = content.contentJson;
      const isFile = content.tipoConteudo === 'arquivo';

      return (
        <div className="space-y-5">
          {isFile && url ? (
            <FileEmbed url={url} />
          ) : json ? (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8">
              <h3 className="font-extrabold text-slate-800 text-base mb-3">Conteúdo do plano</h3>
              {typeof json === 'string' ? (
                <div className={PROSE_CLS} dangerouslySetInnerHTML={{ __html: json }} />
              ) : (
                <pre className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(json, null, 2)}
                </pre>
              )}
            </div>
          ) : url ? (
            <FileEmbed url={url} />
          ) : null}
          <DescriptionBlock html={content.description} />
        </div>
      );
    }

    case 'game': {
      const url = content.fileUrl ?? content.imageUrl ?? null;
      return (
        <div className="space-y-5">
          {url && /\.(mp4|webm|html)$/.test(url.toLowerCase()) ? (
            <FileEmbed url={url} />
          ) : content.imageUrl ? (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <img src={content.imageUrl} alt={content.title} className="w-full h-auto block" />
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-500 text-sm">
              Jogo sem mídia para preview.
            </div>
          )}
          <DescriptionBlock html={content.description} />
        </div>
      );
    }

    case 'question': {
      return (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
            {/* Enunciado pode conter HTML (ex.: imagens, fórmulas) */}
            <div className={PROSE_CLS} dangerouslySetInnerHTML={{ __html: content.statement ?? '' }} />
            {content.thumbnailUrl && (
              <img src={content.thumbnailUrl} alt="" className="rounded-2xl max-h-80 mx-auto" />
            )}
            {content.questionType === 'multiple_choice' && (content.alternatives?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {content.alternatives!.map(alt => (
                  <label
                    key={alt.id}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 cursor-pointer transition-colors"
                  >
                    <input type="radio" name="answer" className="mt-1 accent-orange-500" />
                    <span className="text-sm text-slate-700 flex-1">
                      <strong className="mr-2">{alt.letter}.</strong>
                      <span dangerouslySetInnerHTML={{ __html: alt.text }} />
                    </span>
                  </label>
                ))}
              </div>
            )}
            {content.questionType === 'discursive' && (
              <textarea
                rows={4}
                placeholder="Digite sua resposta..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              />
            )}
            {content.comment && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700 mb-1">
                  Comentário do professor
                </p>
                <div className={PROSE_CLS} dangerouslySetInnerHTML={{ __html: content.comment }} />
              </div>
            )}
          </div>
        </div>
      );
    }
  }
}

/* ─────────────── Page ─────────────── */

export default function ConteudoPage() {
  const params  = useParams<{ id: string; itemId: string }>();
  const router  = useRouter();
  const id      = params?.id     ?? '';
  const itemId  = params?.itemId ?? '';

  const { data: rawData, isLoading } = useTrilhaById(id);
  const { isOverridden, markComplete, toggleComplete } = useTrilhaProgress(id);
  const { completion, isFinalized, finalize } = useCourseCompletion(id);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  // Aplica overrides → trilha já vem com `completed` e `progress` corretos.
  const rawTrilha = useMemo(
    () => rawData ? applyTrilhaProgress(rawData, isOverridden) : undefined,
    [rawData, isOverridden],
  );

  const flat = useMemo(() => rawTrilha ? flatten(rawTrilha) : [], [rawTrilha]);

  const isComplete = (_itId: string, completed: boolean) => completed;

  const currentIdx = flat.findIndex(f => f.item.id === itemId);
  const current    = currentIdx >= 0 ? flat[currentIdx] : null;
  const prev       = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next       = currentIdx >= 0 && currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;

  // Progresso geral (com overrides)
  const total     = flat.length;
  const completed = flat.filter(f => isComplete(f.item.id, f.item.completed)).length;
  const overall   = total ? Math.round((completed / total) * 100) : 0;

  const goTo = (id: string) =>
    router.push(`/professor/trilhas/${params?.id}/conteudo/${id}`);

  const handleToggle = () => {
    if (current) toggleComplete(current.item.id);
  };

  const handleProximo = () => {
    if (current) markComplete(current.item.id);
    if (next) goTo(next.item.id);
  };

  if (isLoading || !rawTrilha) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-semibold">Carregando trilha…</div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-700 font-bold">Conteúdo não encontrado nesta trilha.</p>
        <Link href={`/professor/trilhas/${id}`} className="text-orange-600 font-bold underline">
          Voltar para a trilha
        </Link>
      </div>
    );
  }

  const currentlyComplete = isComplete(current.item.id, current.item.completed);
  const currentModuleLocked = getModuleStatus(rawTrilha.modules[current.moduleIndex]) === 'bloqueado';
  const canFinalize         = !isFinalized && overall >= 80;

  return (
    <ConteudoPageView
      rawTrilha={rawTrilha}
      id={id}
      current={current}
      currentModuleLocked={currentModuleLocked}
      isFinalized={isFinalized}
      canFinalize={canFinalize}
      completionRating={completion?.rating}
      finalizeOpen={finalizeOpen}
      onOpenFinalize={() => setFinalizeOpen(true)}
      onCloseFinalize={() => setFinalizeOpen(false)}
      onFinalize={async ({ rating, feedback }) => { await finalize({ rating, feedback }); }}
      prev={prev}
      next={next}
      currentlyComplete={currentlyComplete}
      isComplete={isComplete}
      overall={overall}
      completed={completed}
      total={total}
      handleToggle={handleToggle}
      handleProximo={handleProximo}
      goTo={goTo}
    />
  );
}

interface ViewProps {
  rawTrilha:           Trilha;
  id:                  string;
  current:             FlatItem;
  prev:                FlatItem | null;
  next:                FlatItem | null;
  currentlyComplete:   boolean;
  currentModuleLocked: boolean;
  isComplete:          (id: string, mock: boolean) => boolean;
  overall:             number;
  completed:           number;
  total:               number;
  handleToggle:        () => void;
  handleProximo:       () => void;
  goTo:                (id: string) => void;
  isFinalized:         boolean;
  canFinalize:         boolean;
  completionRating?:   number;
  finalizeOpen:        boolean;
  onOpenFinalize:      () => void;
  onCloseFinalize:     () => void;
  onFinalize:          (data: { rating: number; feedback?: string }) => Promise<void>;
}

function ConteudoPageView({
  rawTrilha, id, current, prev, next, currentlyComplete, currentModuleLocked, isComplete,
  overall, completed, total, handleToggle, handleProximo, goTo,
  isFinalized, canFinalize, completionRating,
  finalizeOpen, onOpenFinalize, onCloseFinalize, onFinalize,
}: ViewProps) {
  // Sidebar: módulo selecionado segue o item atual, mas pode ser sobrescrito pelo dropdown.
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(current.moduleIndex);
  // Drawer da sidebar no mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    setSelectedModuleIndex(current.moduleIndex);
    setSidebarOpen(false); // fecha drawer ao navegar entre itens
  }, [current.moduleIndex, current.item.id]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top bar — fixo dentro da área de conteúdo da plataforma */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center px-3 md:px-6 gap-2 md:gap-5 shrink-0">
        {/* Hamburger — só mobile */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
          aria-label="Abrir lista de módulos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Link
          href={`/professor/trilhas/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors shrink-0"
          aria-label="Voltar para a trilha"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:inline">Trilha</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="hidden md:block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">Trilha</p>
          <h1 className="font-extrabold text-slate-800 text-sm md:text-[17px] leading-tight truncate">
            {rawTrilha.title}
          </h1>
        </div>

        {/* Progress (mobile compact) */}
        <div className="md:hidden shrink-0">
          {isFinalized ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 border border-green-200 text-[11px] font-extrabold text-green-700">
              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {completionRating}/5
            </span>
          ) : (
            <CircularProgress value={overall} color="orange" size={36} strokeWidth={4}>
              <span className="text-[10px] font-extrabold text-slate-700">{overall}%</span>
            </CircularProgress>
          )}
        </div>
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isFinalized ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-200">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <div className="leading-tight">
                <p className="text-[11px] font-extrabold uppercase text-green-700 tracking-wide">Finalizado</p>
                {completionRating && (
                  <p className="text-[11px] font-bold text-green-700">{completionRating}/5 estrelas</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <CircularProgress value={overall} color="orange" size={44} strokeWidth={5}>
                <span className="text-[11px] font-extrabold text-slate-700">{overall}%</span>
              </CircularProgress>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Progresso</p>
                <p className="text-sm font-extrabold text-slate-700">{completed} de {total}</p>
              </div>
              {canFinalize && (
                <ProfessorButton variant="primary" size="sm" onClick={onOpenFinalize}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  Finalizar curso
                </ProfessorButton>
              )}
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          trilha={rawTrilha}
          trilhaId={id}
          currentId={current.item.id}
          isComplete={isComplete}
          selectedModuleIndex={selectedModuleIndex}
          onSelectModule={setSelectedModuleIndex}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
            {/* Header do item */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {currentModuleLocked ? (
                  <ProfBadge variant="slate" dot>Bloqueado</ProfBadge>
                ) : (
                  <>
                    <ProfBadge variant={ITEM_TYPE_BADGE[current.item.item_type]} dot>
                      {ITEM_TYPE_LABEL[current.item.item_type]}
                    </ProfBadge>
                    {currentlyComplete && (
                      <ProfBadge variant="concluido" dot>Concluído</ProfBadge>
                    )}
                  </>
                )}
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Módulo {current.moduleIndex + 1} · {current.itemIndex + 1} de {rawTrilha.modules[current.moduleIndex].items.length}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                {current.item.title}
              </h2>
              <p className="text-sm text-slate-500 font-semibold">
                {current.moduleTitle}
              </p>
            </div>

            {currentModuleLocked ? (
              <>
                {/* Aviso de bloqueio */}
                <div className="rounded-3xl bg-slate-50 border border-slate-200 p-10 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-lg">Conteúdo bloqueado</h3>
                    <p className="text-slate-500 text-sm max-w-md">
                      Este módulo será liberado em <strong className="text-slate-700">{fmtDate(rawTrilha.modules[current.moduleIndex].start_date)}</strong>. Volte nessa data para acessar o conteúdo.
                    </p>
                  </div>
                </div>

                {/* Apenas voltar */}
                <div className="flex justify-center pt-4 border-t border-slate-100">
                  <Link
                    href={`/professor/trilhas/${id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Voltar para a trilha
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Viewer */}
                <ContentViewer item={current.item} />

                {/* Navegação */}
                <div className="flex items-stretch gap-2 pt-6 border-t border-slate-100">
                  <ProfessorButton
                    variant="ghost"
                    size="md"
                    disabled={!prev}
                    onClick={() => prev && goTo(prev.item.id)}
                    className={`shrink-0 px-3 ${!prev ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label="Anterior"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span className="hidden sm:inline ml-1.5">Anterior</span>
                  </ProfessorButton>

                  <ProfessorButton
                    variant={currentlyComplete ? 'success' : 'primary'}
                    size="md"
                    onClick={handleToggle}
                    title={currentlyComplete ? 'Clique para desmarcar' : 'Clique para marcar como concluído'}
                    className="flex-1 min-w-0"
                  >
                    {currentlyComplete ? (
                      <>
                        <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="truncate"><span className="sm:hidden">Concluído</span><span className="hidden sm:inline">Concluído — desmarcar</span></span>
                      </>
                    ) : (
                      <span className="truncate"><span className="sm:hidden">Concluir</span><span className="hidden sm:inline">Marcar como concluído</span></span>
                    )}
                  </ProfessorButton>

                  {!next && canFinalize ? (
                    <ProfessorButton variant="primary" size="md" onClick={onOpenFinalize} className="shrink-0 px-3" aria-label="Finalizar curso">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span className="hidden sm:inline ml-1.5">Finalizar curso</span>
                    </ProfessorButton>
                  ) : !next && isFinalized ? (
                    <ProfessorButton variant="success" size="md" disabled className="shrink-0 px-3" aria-label="Curso finalizado">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span className="hidden sm:inline ml-1.5">Finalizado</span>
                    </ProfessorButton>
                  ) : (
                    <ProfessorButton
                      variant="primary"
                      size="md"
                      disabled={!next}
                      onClick={handleProximo}
                      className={`shrink-0 px-3 ${!next ? 'opacity-40 cursor-not-allowed' : ''}`}
                      aria-label="Próximo"
                    >
                      <span className="hidden sm:inline mr-1.5">Próximo</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </ProfessorButton>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <FinalizeCourseModal
        open={finalizeOpen}
        courseTitle={rawTrilha.title}
        progress={overall}
        onClose={onCloseFinalize}
        onSubmit={onFinalize}
      />
    </div>
  );
}

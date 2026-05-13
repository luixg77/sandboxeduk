'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  HeroBanner,
  ProfBadge,
  ProgressBar,
  CircularProgress,
  ProfessorButton,
  FinalizeCourseModal,
} from '@/components/professor-ui';
import {
  useTrilhaById,
  getTrilhaStatus,
  getModuleStatus,
  getCourseProgress,
  applyTrilhaProgress,
  fmtDate,
  type Trilha,
  type TrilhaModule,
  type TrilhaModuleItem,
} from '@/hooks/useTrilhas';
import { useTrilhaProgress } from '@/hooks/useTrilhaProgress';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';

/* ─────────────── Status helpers ─────────────── */

const TRILHA_STATUS_BADGE: Record<ReturnType<typeof getTrilhaStatus>, { variant: any; label: string }> = {
  em_andamento: { variant: 'em_progresso', label: 'Em andamento' },
  em_breve:     { variant: 'blue',         label: 'Em breve' },
  encerrada:    { variant: 'slate',        label: 'Encerrada' },
  disponivel:   { variant: 'orange',       label: 'Disponível' },
};

function moduleBadge(module: TrilhaModule): { variant: any; label: string } {
  if (module.progress >= 100)              return { variant: 'concluido',    label: 'Concluído'    };
  const s = getModuleStatus(module);
  if (s === 'bloqueado')                   return { variant: 'slate',        label: 'Bloqueado'    };
  if (s === 'encerrado')                   return { variant: 'red',          label: 'Encerrado'    };
  if (module.progress > 0)                 return { variant: 'em_progresso', label: 'Em andamento' };
  return { variant: 'orange', label: 'Disponível' };
}

/* ─────────────── Item icons (DS tokens) ─────────────── */

const ITEM_ICON: Record<TrilhaModuleItem['item_type'], { icon: JSX.Element; label: string; cls: string }> = {
  video: {
    label: 'Vídeo',
    cls:   'bg-orange-50 text-orange-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  audio: {
    label: 'Áudio',
    cls:   'bg-teal-50 text-teal-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  question: {
    label: 'Questão',
    cls:   'bg-amber-50 text-amber-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  book: {
    label: 'Livro',
    cls:   'bg-green-50 text-green-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  lesson_plan: {
    label: 'Plano de Aula',
    cls:   'bg-blue-50 text-blue-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  game: {
    label: 'Jogo',
    cls:   'bg-pink-50 text-pink-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

/* ─────────────── Sobre o curso (com ver mais/menos) ─────────────── */

const ABOUT_COLLAPSED_HEIGHT = 280; // px — altura visível enquanto recolhido

function AboutSection({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded]   = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Mede o conteúdo após render para decidir se mostra "ver mais"
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > ABOUT_COLLAPSED_HEIGHT + 8);
  }, [html]);

  // Re-mede em redimensionamento (textos longos com imagens podem mudar)
  useEffect(() => {
    const onResize = () => {
      const el = contentRef.current;
      if (!el) return;
      setOverflows(el.scrollHeight > ABOUT_COLLAPSED_HEIGHT + 8);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <h2 className="font-extrabold text-slate-800 text-lg">Sobre o curso</h2>
      </div>

      {/* Container com altura controlada e fade quando recolhido */}
      <div className="relative">
        <div
          ref={contentRef}
          style={{
            maxHeight: expanded || !overflows ? 'none' : ABOUT_COLLAPSED_HEIGHT,
          }}
          className={`text-slate-600 text-[15px] leading-relaxed overflow-hidden transition-[max-height] duration-300
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
          `}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Fade overlay enquanto recolhido */}
        {overflows && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-orange-600 hover:text-orange-700 transition-colors"
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
    </section>
  );
}

/* ─────────────── Estrelas (display) ─────────────── */

function StarsDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n}
          className={`${cls} ${n <= value ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor" viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}

/* ─────────────── Bloco de finalização ─────────────── */

const FINALIZE_THRESHOLD = 80;

interface FinalizationBlockProps {
  overall:     number;
  completion:  { rating: number; feedback: string | null; finished_at: string } | null;
  isFinalized: boolean;
  onOpen:      () => void;
}

function FinalizationBlock({ overall, completion, isFinalized, onOpen }: FinalizationBlockProps) {
  if (isFinalized && completion) {
    const date = new Date(completion.finished_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <p className="font-extrabold text-green-800 text-sm">Curso finalizado em {date}</p>
        </div>
        <div className="flex items-center gap-2">
          <StarsDisplay value={completion.rating} />
          <span className="text-sm font-bold text-slate-700">{completion.rating} de 5</span>
        </div>
        {completion.feedback && (
          <p className="text-sm text-slate-600 italic leading-relaxed border-l-2 border-green-300 pl-3 mt-2">
            &ldquo;{completion.feedback}&rdquo;
          </p>
        )}
      </div>
    );
  }

  if (overall >= FINALIZE_THRESHOLD) {
    return (
      <ProfessorButton variant="primary" size="md" onClick={onOpen} className="w-full">
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        Finalizar curso
      </ProfessorButton>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-[13px] text-slate-600 font-semibold">
      Atinja <strong className="text-slate-800">{FINALIZE_THRESHOLD}%</strong> de progresso para finalizar este curso.
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function ItemList({ items, trilhaId, isLocked }: { items: TrilhaModuleItem[]; trilhaId: string; isLocked: boolean }) {
  return (
    <ul className="rounded-2xl bg-slate-50/60 px-3 py-1">
      {items.map((it, i) => (
        <ItemRow
          key={it.id}
          item={it}
          trilhaId={trilhaId}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          prevCompleted={i > 0 ? items[i - 1].completed : false}
          isLocked={isLocked}
        />
      ))}
    </ul>
  );
}

interface ItemRowProps {
  item:          TrilhaModuleItem;
  trilhaId:      string;
  isFirst:       boolean;
  isLast:        boolean;
  prevCompleted: boolean;
  isLocked:      boolean;
}

function ItemRow({ item, trilhaId, isFirst, isLast, prevCompleted, isLocked }: ItemRowProps) {
  const cfg = ITEM_ICON[item.item_type];

  const inner = (
    <>
      {/* Ícone do tipo (ou cadeado quando bloqueado) */}
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isLocked ? 'bg-slate-100 text-slate-400' : cfg.cls
      }`}>
        {isLocked ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ) : cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${
          isLocked ? 'text-slate-400' : item.completed ? 'text-slate-500' : 'text-slate-700'
        }`}>
          {item.title}
        </p>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {isLocked ? 'Bloqueado' : cfg.label}
        </p>
      </div>
      {!isLocked && (
        <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </>
  );

  return (
    <li className="relative border-b border-slate-100 last:border-0">
      {/* Segmento da trilha ACIMA da bolinha */}
      {!isFirst && (
        <span
          className={`pointer-events-none absolute left-[9px] top-0 h-1/2 w-0.5 ${
            prevCompleted ? 'bg-green-500' : 'bg-slate-200'
          }`}
        />
      )}
      {/* Segmento da trilha ABAIXO da bolinha */}
      {!isLast && (
        <span
          className={`pointer-events-none absolute left-[9px] top-1/2 bottom-0 w-0.5 ${
            item.completed ? 'bg-green-500' : 'bg-slate-200'
          }`}
        />
      )}

      {/* Bolinha de status */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors
          ${item.completed
            ? 'bg-green-500 border-2 border-green-500 text-white'
            : 'bg-white border-2 border-slate-300'}
        `}
        aria-label={item.completed ? 'Concluído' : 'Não concluído'}
      >
        {item.completed && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </span>

      {isLocked ? (
        <div
          aria-disabled="true"
          title="Disponível na data de início do módulo"
          className="flex items-center gap-3 py-3 pl-9 pr-2 cursor-not-allowed select-none"
        >
          {inner}
        </div>
      ) : (
        <Link
          href={`/professor/trilhas/${trilhaId}/conteudo/${item.id}`}
          className="flex items-center gap-3 py-3 pl-9 pr-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {inner}
        </Link>
      )}
    </li>
  );
}

interface ModuleAccordionProps {
  module:    TrilhaModule;
  index:     number;
  isOpen:    boolean;
  onToggle:  () => void;
  trilhaId:  string;
}

function ModuleAccordion({ module: mod, index, isOpen, onToggle, trilhaId }: ModuleAccordionProps) {
  const isComplete = mod.progress >= 100;
  const isLocked   = getModuleStatus(mod) === 'bloqueado';
  const badge      = moduleBadge(mod);

  return (
    <article
      className={`rounded-3xl border bg-white overflow-hidden shadow-sm transition-all
        ${isComplete ? 'border-green-200' : 'border-slate-100'}
        ${isLocked && !isComplete ? 'opacity-75' : ''}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start md:items-center gap-3 md:gap-4 p-4 md:p-5 hover:bg-slate-50 transition-colors"
      >
        {/* Index / check */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold shrink-0
            ${isComplete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
          `}
        >
          {isComplete ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <span className="text-base">{index + 1}</span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug">
              {mod.title}
            </h3>
            <ProfBadge variant={badge.variant} dot>{badge.label}</ProfBadge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500 font-semibold">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878" />
              </svg>
              {mod.items.length} {mod.items.length === 1 ? 'item' : 'itens'}
            </span>
            {(mod.start_date || mod.end_date) && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
                {fmtDate(mod.start_date)} → {fmtDate(mod.end_date)}
              </span>
            )}
            <div className="flex items-center gap-2 min-w-[140px] flex-1 max-w-[220px]">
              <ProgressBar value={mod.progress} size="xs" color={isComplete ? 'green' : 'orange'} animate />
              <span className="text-[11px] font-extrabold text-slate-600 w-9 text-right">{mod.progress}%</span>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
          {isLocked && (
            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-3 flex items-center gap-2.5 text-slate-600 text-sm">
              <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>
                Este módulo será liberado em <strong className="text-slate-800">{fmtDate(mod.start_date)}</strong>.
              </span>
            </div>
          )}
          {mod.description && (
            <p className="text-slate-600 text-sm leading-relaxed">{mod.description}</p>
          )}
          {mod.items.length > 0 ? (
            <ItemList items={mod.items} trilhaId={trilhaId} isLocked={isLocked} />
          ) : (
            <p className="text-[12px] text-slate-400 italic">Nenhum item neste módulo.</p>
          )}
        </div>
      )}
    </article>
  );
}

/* ─────────────── Skeleton ─────────────── */

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-3xl bg-white border border-slate-100 h-44" />
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-3xl bg-white border border-slate-100 h-20" />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Page ─────────────── */

export default function TrilhaDetailPage() {
  const params = useParams<{ id: string }>();
  const id     = params?.id ?? '';
  const { data: rawTrilha, isLoading, isError } = useTrilhaById(id);
  const { isOverridden } = useTrilhaProgress(id);
  const { completion, isFinalized, finalize } = useCourseCompletion(id);
  const trilha = rawTrilha ? applyTrilhaProgress(rawTrilha, isOverridden) : undefined;
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  // Acordeão: primeiro módulo aberto por padrão até o usuário interagir
  const [openModules, setOpenModules] = useState<Set<string> | null>(null);

  const isOpen = (modId: string): boolean => {
    if (openModules) return openModules.has(modId);
    return trilha?.modules[0]?.id === modId;
  };

  const toggleModule = (modId: string) => {
    setOpenModules(prev => {
      const base = prev
        ?? new Set(trilha?.modules.length ? [trilha.modules[0].id] : []);
      const next = new Set(base);
      if (next.has(modId)) next.delete(modId); else next.add(modId);
      return next;
    });
  };

  const overall        = trilha ? getCourseProgress(trilha) : 0;
  const completedCount = trilha?.modules.filter(m => m.progress >= 100).length ?? 0;
  const totalCount     = trilha?.modules.length ?? 0;
  const trilhaBadge    = trilha ? TRILHA_STATUS_BADGE[getTrilhaStatus(trilha)] : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero — mesmo padrão do design system */}
      <HeroBanner
        label="Trilha de Aprendizagem"
        title={trilha?.title ?? 'Carregando trilha...'}
        subtitle="Percurso estruturado para sua formação docente."
        illustration="charts"
      />

      <div className="px-4 md:px-10 py-6 max-w-5xl mx-auto space-y-6">
        {/* Voltar */}
        <Link
          href="/professor/trilhas"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para trilhas
        </Link>

        {isLoading ? (
          <Skeleton />
        ) : isError || !trilha ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Trilha não encontrada ou erro ao carregar.
          </div>
        ) : (
          <>
            {/* Card de informações do curso */}
            <section className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                {/* Thumbnail */}
                <div className="relative aspect-video md:aspect-auto bg-orange-100 min-h-[180px]">
                  {trilha.thumbnail_url ? (
                    <img
                      src={trilha.thumbnail_url}
                      alt={trilha.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-orange-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 md:p-6 space-y-4">
                  {/* Status + disciplinas */}
                  <div className="flex flex-wrap items-center gap-2">
                    {trilhaBadge && (
                      <ProfBadge variant={trilhaBadge.variant} dot>{trilhaBadge.label}</ProfBadge>
                    )}
                    {trilha.disciplines.map(d => (
                      <span
                        key={d.name}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white"
                        style={{ backgroundColor: d.color_hex }}
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-slate-500">
                    {(trilha.start_date || trilha.end_date) && (
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                        </svg>
                        {fmtDate(trilha.start_date)} → {fmtDate(trilha.end_date)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878" />
                      </svg>
                      {totalCount} {totalCount === 1 ? 'módulo' : 'módulos'}
                    </span>
                    {trilha.grades.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814" />
                        </svg>
                        {trilha.grades.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Progresso geral */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    <CircularProgress
                      value={isFinalized ? 100 : overall}
                      color={isFinalized ? 'green' : 'orange'}
                      size={76}
                      strokeWidth={7}
                    >
                      <span className="text-base font-extrabold text-slate-800">
                        {isFinalized ? '100%' : `${overall}%`}
                      </span>
                    </CircularProgress>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-800 text-[15px]">
                        {isFinalized ? 'Curso finalizado' : 'Progresso geral'}
                      </p>
                      <p className="text-[13px] text-slate-500 font-semibold">
                        {completedCount} de {totalCount} {totalCount === 1 ? 'módulo concluído' : 'módulos concluídos'}
                      </p>
                      <ProgressBar
                        value={isFinalized ? 100 : overall}
                        color={isFinalized ? 'green' : 'orange'}
                        size="sm" animate className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Bloco de finalização */}
                  <FinalizationBlock
                    overall={overall}
                    completion={completion}
                    isFinalized={isFinalized}
                    onOpen={() => setFinalizeOpen(true)}
                  />
                </div>
              </div>
            </section>

            {/* Sobre o curso — descrição rica em HTML (campo "descrição" do criar curso) */}
            {trilha.description?.trim() && (
              <AboutSection html={trilha.description} />
            )}

            {/* Módulos */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-800 text-lg">Módulos</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {totalCount} {totalCount === 1 ? 'módulo' : 'módulos'}
                </span>
              </div>

              {trilha.modules.length === 0 ? (
                <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center text-slate-500 text-sm">
                  Esta trilha ainda não tem módulos publicados.
                </div>
              ) : (
                <div className="space-y-3">
                  {trilha.modules.map((m, i) => (
                    <ModuleAccordion
                      key={m.id}
                      module={m}
                      index={i}
                      isOpen={isOpen(m.id)}
                      onToggle={() => toggleModule(m.id)}
                      trilhaId={id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {trilha && (
        <FinalizeCourseModal
          open={finalizeOpen}
          courseTitle={trilha.title}
          progress={overall}
          onClose={() => setFinalizeOpen(false)}
          onSubmit={async ({ rating, feedback }) => {
            await finalize({ rating, feedback });
          }}
        />
      )}
    </div>
  );
}

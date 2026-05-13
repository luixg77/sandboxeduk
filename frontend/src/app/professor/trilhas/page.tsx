'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeroBanner, SearchInput } from '@/components/professor-ui';
import { useTrilhas, getTrilhaUserStatus, applyTrilhaProgress, fmtDate, type Trilha } from '@/hooks/useTrilhas';
import { useAllUserProgress } from '@/hooks/useTrilhaProgress';

/* Remove tags HTML para preview de texto. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')        // remove tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Status badge (status do USUÁRIO: combina período + progresso real) ── */
const STATUS_CFG = {
  concluida:    { label: 'Concluída',    cls: 'bg-green-100  text-green-700'  },
  em_andamento: { label: 'Em andamento', cls: 'bg-amber-100  text-amber-700'  },
  nao_iniciada: { label: 'Disponível',   cls: 'bg-orange-100 text-orange-700' },
  em_breve:     { label: 'Em breve',     cls: 'bg-blue-100   text-blue-700'   },
  encerrada:    { label: 'Encerrada',    cls: 'bg-slate-100  text-slate-500'  },
};

function StatusBadge({ trilha }: { trilha: Trilha }) {
  const s = getTrilhaUserStatus(trilha);
  const { label, cls } = STATUS_CFG[s];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

/* ── Progress bar ── */
function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
        <span>{value} de {total} módulos</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-white border border-slate-100 overflow-hidden animate-pulse">
          <div className="aspect-video bg-slate-100" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
            <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
            <div className="h-1.5 bg-slate-100 rounded-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      </div>
      <p className="font-extrabold text-slate-700 text-lg">
        {hasSearch ? 'Nenhuma trilha encontrada' : 'Nenhuma trilha disponível'}
      </p>
      <p className="text-slate-400 text-sm mt-1">
        {hasSearch ? 'Tente ajustar a busca' : 'Aguarde novas trilhas serem publicadas'}
      </p>
    </div>
  );
}

/* ── Trilha Card ── */
function TrilhaCard({
  trilha: rawTrilha,
  completedItems,
}: {
  trilha:         Trilha;
  completedItems: Set<string>;
}) {
  // Aplica progresso real do usuário → módulo.progress correto.
  const trilha = useMemo(
    () => applyTrilhaProgress(rawTrilha, id => completedItems.has(id)),
    [rawTrilha, completedItems],
  );
  const completedModules = trilha.modules.filter(m => m.progress === 100).length;
  const totalModules     = trilha.modules.length;

  return (
    <Link
      href={`/professor/trilhas/${trilha.id}`}
      className="group flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-orange-300 to-orange-500">
        {trilha.thumbnail_url ? (
          <img
            src={trilha.thumbnail_url}
            alt={trilha.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-14 h-14 text-white/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
        )}
        {/* Overlay gradient bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Status badge over image */}
        <div className="absolute top-3 left-3">
          <StatusBadge trilha={trilha} />
        </div>
        {/* Module count badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
          </svg>
          {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* Disciplines */}
        {trilha.disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trilha.disciplines.slice(0, 3).map(d => (
              <span
                key={d.name}
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                style={{ backgroundColor: d.color_hex }}
              >
                {d.name}
              </span>
            ))}
            {trilha.disciplines.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                +{trilha.disciplines.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {trilha.title}
        </h3>

        {/* Description (texto puro — HTML é renderizado só na tela de detalhe) */}
        {trilha.description && (
          <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-2">
            {stripHtml(trilha.description)}
          </p>
        )}

        {/* Dates */}
        {(trilha.start_date || trilha.end_date) && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-semibold">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            {fmtDate(trilha.start_date)} → {fmtDate(trilha.end_date)}
          </div>
        )}

        {/* Progress — pushed to bottom */}
        <div className="mt-auto pt-2">
          <ProgressBar value={completedModules} total={totalModules} />
        </div>

        {/* CTA */}
        <div className="flex justify-end mt-1">
          <span className="text-[12px] font-extrabold text-orange-600 group-hover:underline flex items-center gap-1">
            Ver trilha
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ── */
export default function TrilhasPage() {
  const [search, setSearch] = useState('');
  const { data: trilhas = [], isLoading, isError } = useTrilhas();
  const { data: progressMap } = useAllUserProgress();

  const filtered = useMemo(() =>
    search.trim()
      ? trilhas.filter(t =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          t.disciplines.some(d => d.name.toLowerCase().includes(search.toLowerCase()))
        )
      : trilhas,
    [trilhas, search],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroBanner
        label="Conteúdos"
        title="Trilhas de Aprendizagem"
        subtitle="Percursos estruturados com módulos sequenciais para suas turmas."
        illustration="charts"
      />

      <div className="px-4 md:px-10 py-6 space-y-6">

        {/* Busca */}
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar trilha por título ou disciplina..."
            className="max-w-sm"
          />
          {!isLoading && (
            <span className="text-sm text-slate-400 font-semibold">
              {filtered.length} {filtered.length === 1 ? 'trilha' : 'trilhas'}
            </span>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Erro ao carregar trilhas. Tente recarregar a página.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search.trim()} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(t => (
              <TrilhaCard
                key={t.id}
                trilha={t}
                completedItems={progressMap?.get(t.id) ?? new Set<string>()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

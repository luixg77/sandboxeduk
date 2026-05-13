'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  HeroBanner, TabNavigation, SectionTitle, FilterSelect, SearchInput,
  ProfessorButton, ProfIcons, ProfBadge,
  GameCard, VideoCard, AudioCard, LivroCard, PlanoCard,
  PdfModal, VideoModal, AudioModal, SaveToEstojoModal,
} from '@/components/professor-ui';
import { useEstojo, EstojoItem } from '@/hooks/useEstojo';
import { useEstojoNotes } from '@/hooks/useEstojoNotes';
import { useAcervoData, useAcervoCounts, useAcervoOptions, AcervoItem, AcervoContentType, AcervoTab } from '@/hooks/useAcervoData';

const TODOS_SECTIONS: { id: AcervoContentType; label: string; isPlano: boolean }[] = [
  { id: 'plano_aula', label: 'Acervo Pedagógico',  isPlano: true },
  { id: 'livro',      label: 'Biblioteca',          isPlano: false },
  { id: 'video',      label: 'Vídeos e Videoaulas', isPlano: false },
  { id: 'audio',      label: 'Áudios e Podcast',    isPlano: false },
  { id: 'jogo',       label: 'Jogos',               isPlano: false },
];

/* ── Botão Salvar ── */
function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={saved}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
        saved ? 'bg-orange-50 text-orange-500 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
      }`}
      title={saved ? 'Já salvo no Estojo' : 'Salvar no Estojo'}
    >
      {saved ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )}
      {saved ? 'Salvo' : 'Salvar'}
    </button>
  );
}


/* ── Card específico (abas individuais) ── */
function TypeCard({ item, saved, onSave, onViewPdf, onWatchVideo, onPlayAudio, disciplineColor }: { item: AcervoItem; saved: boolean; onSave: () => void; onViewPdf?: () => void; onWatchVideo?: () => void; onPlayAudio?: () => void; disciplineColor?: string }) {
  switch (item.type) {
    case 'livro':
      return <LivroCard title={item.title} discipline={item.discipline} disciplineColor={disciplineColor} grade={item.grade} description={item.description} isNew={item.isNew} canDownload={item.canDownload} thumbnailUrl={item.thumbnailUrl} fileUrl={item.fileUrl} saved={saved} onSave={onSave} onView={onViewPdf} onDownload={item.fileUrl ? () => window.open(item.fileUrl, '_blank') : undefined} />;
    case 'video':
      return <VideoCard title={item.title} discipline={item.discipline} disciplineColor={disciplineColor} grade={item.grade} duration={item.duration} thumbnailUrl={item.thumbnailUrl} sourceType={item.sourceType} description={item.description} saved={saved} onSave={onSave} onWatch={onWatchVideo} />;
    case 'jogo':
      return <GameCard title={item.title} discipline={item.discipline} grade={item.grade} difficulty={item.difficulty} engine={item.engine} pcdSign={item.pcdSign} pcdVoice={item.pcdVoice} saved={saved} onSave={onSave} />;
    case 'audio':
      return <AudioCard title={item.title} discipline={item.discipline} disciplineColor={disciplineColor} grade={item.grade} duration={item.duration} tipo={item.tipo} description={item.description} saved={saved} onSave={onSave} onPlay={onPlayAudio} />;
    case 'plano_aula':
      return <PlanoCard title={item.title} description={item.description} discipline={item.discipline} disciplineColor={disciplineColor} grade={item.grade} tipodoc={item.tipodoc ?? 'plano_aula'} bnccSkill={item.bnccSkill} canDownload={item.canDownload} interactive={item.interactive} pcdSign={item.pcdSign} pcdVoice={item.pcdVoice} thumbnailUrl={item.thumbnailUrl} saved={saved} onSave={onSave} onView={item.fileUrl ? onViewPdf : undefined} onDownload={item.fileUrl && item.canDownload ? () => window.open(item.fileUrl, '_blank') : undefined} />;
  }
}

/* ── Loading skeleton ── */
function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-slate-100 animate-pulse" style={{ height: 200 }} />
      ))}
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
        <svg className="w-9 h-9 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <p className="font-extrabold text-slate-700 text-lg">Nenhum resultado encontrado</p>
      <p className="text-slate-400 text-sm mt-1 mb-4">
        {hasFilters ? 'Tente ajustar os filtros ou busca' : 'Nenhum conteúdo disponível para sua escola'}
      </p>
      {hasFilters && (
        <ProfessorButton variant="ghost" size="sm" onClick={onClear}>Limpar filtros</ProfessorButton>
      )}
    </div>
  );
}

/* ── Pagination ── */
function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>
      <span className="text-sm font-semibold text-slate-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
}

/* ── Page ── */
const TAB_DEFS: { id: AcervoTab; label: string }[] = [
  { id: 'todos',      label: 'Todos' },
  { id: 'plano_aula', label: 'Acervo Pedagógico' },
  { id: 'livro',      label: 'Biblioteca' },
  { id: 'video',      label: 'Vídeos e Videoaulas' },
  { id: 'audio',      label: 'Áudios e Podcast' },
  { id: 'jogo',       label: 'Jogos' },
];

const PAGE_SIZE = 50;

export default function AcervoPage() {
  const [activeTab,   setActiveTab]   = useState<AcervoTab>('todos');
  const [search,      setSearch]      = useState('');
  const [discipline,  setDiscipline]  = useState('');
  const [grade,       setGrade]       = useState('');
  const [audience,    setAudience]    = useState('');
  const [page,        setPage]        = useState(1);
  const [pendingItem,  setPendingItem]  = useState<AcervoItem | null>(null);
  const [pendingPdf,   setPendingPdf]   = useState<{ title: string; description?: string; url: string; discipline?: string; grade?: string } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<AcervoItem | null>(null);
  const [pendingAudio, setPendingAudio] = useState<AcervoItem | null>(null);

  const { folders, isSaved, saveItem, createFolderWithItem, totalItems } = useEstojo();
  const { setNote } = useEstojoNotes();

  // Reset page on any filter/tab change
  useEffect(() => { setPage(1); }, [activeTab, search, discipline, grade, audience]);

  const { data, isLoading, isError } = useAcervoData({ activeTab, search, discipline, grade, audience, page });
  const { data: allCounts }          = useAcervoCounts(search, discipline, grade, audience);
  const { data: options }            = useAcervoOptions();

  const rawItems: AcervoItem[] = data?.items ?? [];
  const counts = allCounts ?? { livro: 0, video: 0, jogo: 0, audio: 0, plano_aula: 0 };
  const filtered = rawItems;

  const disciplineOptions = options?.disciplines ?? [];
  const gradeOptions      = options?.grades      ?? [];

  const discColorMap = useMemo(() =>
    Object.fromEntries((options?.disciplines ?? []).map(d => [d.name, d.color])),
    [options?.disciplines],
  );

  const tabTotals = useMemo(() => {
    const livro      = counts.livro      ?? 0;
    const jogo       = counts.jogo       ?? 0;
    const video      = counts.video      ?? 0;
    const audio      = counts.audio      ?? 0;
    const plano_aula = counts.plano_aula ?? 0;
    return { todos: livro + jogo + video + audio + plano_aula, livro, jogo, video, audio, plano_aula };
  }, [counts]);

  const tabsWithBadge = useMemo(() =>
    TAB_DEFS.map(tab => ({ ...tab, badge: tabTotals[tab.id as keyof typeof tabTotals] ?? 0 })),
    [tabTotals],
  );

  function handleSaveRequest(item: AcervoItem) {
    if (!isSaved(item.id)) setPendingItem(item);
  }

  function makeEstojoItem(item: AcervoItem): EstojoItem {
    return {
      id:           item.id,
      type:         item.type,
      title:        item.title,
      discipline:   item.discipline,
      grade:        item.grade,
      color:        item.color,
      savedAt:      new Date().toISOString(),
      thumbnailUrl: item.thumbnailUrl,
      fileUrl:      item.fileUrl ?? item.videoUrl ?? item.audioUrl,
      canDownload:  item.canDownload,
    };
  }

  function handleConfirmSave(folderId: string, note: string) {
    if (!pendingItem) return;
    saveItem(makeEstojoItem(pendingItem), folderId);
    if (note.trim()) setNote(pendingItem.id, note.trim());
    setPendingItem(null);
  }

  function handleCreateAndSave(name: string, note: string) {
    if (!pendingItem) return;
    createFolderWithItem(name, makeEstojoItem(pendingItem));
    if (note.trim()) setNote(pendingItem.id, note.trim());
    setPendingItem(null);
  }

  function clearFilters() { setSearch(''); setDiscipline(''); setGrade(''); setAudience(''); setActiveTab('todos'); }
  const hasFilters = !!(search || discipline || grade || audience);
  const isTodos    = activeTab === 'todos';
  const isPlanoTab = activeTab === 'plano_aula';

  return (
    <div className="min-h-screen bg-slate-50">
      {pendingItem && (
        <SaveToEstojoModal
          itemTitle={pendingItem.title}
          folders={folders}
          onClose={() => setPendingItem(null)}
          onSave={handleConfirmSave}
          onCreateAndSave={handleCreateAndSave}
        />
      )}

      {pendingPdf && (
        <PdfModal
          title={pendingPdf.title}
          description={pendingPdf.description}
          url={pendingPdf.url}
          discipline={pendingPdf.discipline}
          grade={pendingPdf.grade}
          onClose={() => setPendingPdf(null)}
        />
      )}

      {pendingVideo && (
        <VideoModal
          title={pendingVideo.title}
          fileUrl={pendingVideo.videoUrl ?? ''}
          discipline={pendingVideo.discipline}
          grade={pendingVideo.grade}
          duration={pendingVideo.duration}
          description={pendingVideo.description}
          onClose={() => setPendingVideo(null)}
        />
      )}

      {pendingAudio && (
        <AudioModal
          title={pendingAudio.title}
          fileUrl={pendingAudio.audioUrl ?? ''}
          discipline={pendingAudio.discipline}
          grade={pendingAudio.grade}
          duration={pendingAudio.duration}
          description={pendingAudio.description}
          onClose={() => setPendingAudio(null)}
        />
      )}

      <HeroBanner
        label="Biblioteca"
        title="Acervo de Recursos Educacionais"
        subtitle="Explore livros, vídeos, jogos, áudios e planos de aula para suas turmas."
        illustration="books"
      />

      <div className="px-4 md:px-10 py-6 space-y-5">

        {/* Filtros + link Estojo */}
        <div className="flex flex-col gap-2">

          {/* Linha 1: busca + atalho estojo */}
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título..." className="flex-1" />

            <Link
              href="/professor/estojo"
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors text-orange-600 text-xs font-bold shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-80">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              <span className="hidden sm:inline">Meu Estojo</span>
              {totalItems > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Linha 2: filtros em scroll horizontal no mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {disciplineOptions.length > 0 && (
              <FilterSelect
                icon={<ProfIcons.Book />}
                placeholder="Disciplina"
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                options={disciplineOptions.map(d => ({ value: d.name, label: d.name }))}
                accentColor="blue"
                className="shrink-0 min-w-[160px]"
              />
            )}

            {gradeOptions.length > 0 && (
              <FilterSelect
                icon={<ProfIcons.Turma />}
                placeholder="Ano / Série"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                options={gradeOptions.map(g => ({ value: g, label: g }))}
                accentColor="blue"
                className="shrink-0 min-w-[140px]"
              />
            )}

            <FilterSelect
              icon={<ProfIcons.Turma />}
              placeholder="Público"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              options={[
                { value: 'professor', label: 'Professor' },
                { value: 'aluno',     label: 'Aluno'     },
              ]}
              accentColor="blue"
              className="shrink-0 min-w-[130px]"
            />

            {hasFilters && (
              <button onClick={clearFilters} className="shrink-0 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50 whitespace-nowrap">
                Limpar ×
              </button>
            )}
          </div>
        </div>

        {/* Tabs + Conteúdo */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <TabNavigation tabs={tabsWithBadge} active={activeTab} onChange={v => setActiveTab(v as AcervoTab)} accentColor="orange" className="px-4" />

          <div className="p-3 md:p-6">
            {isLoading ? (
              <SkeletonGrid />
            ) : isError ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Erro ao carregar conteúdo. Tente recarregar a página.
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onClear={clearFilters} hasFilters={hasFilters} />
            ) : (
              <div className="space-y-6">
                <SectionTitle
                  title={isTodos ? 'Todos os Recursos' : TAB_DEFS.find(t => t.id === activeTab)?.label ?? ''}
                  subtitle={isTodos ? `${tabTotals.todos} recursos no total` : `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}${tabTotals[activeTab] > filtered.length ? ` de ${tabTotals[activeTab]}` : ''}`}
                />

                {isTodos && TODOS_SECTIONS.map(({ id, label, isPlano }) => {
                  const sectionItems = filtered.filter(i => i.type === id);
                  if (sectionItems.length === 0) return null;
                  const total = tabTotals[id as keyof typeof tabTotals] ?? 0;
                  return (
                    <div key={id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-700 text-sm uppercase tracking-wide">{label}</h3>
                          <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{total}</span>
                        </div>
                        {total > sectionItems.length && (
                          <button
                            onClick={() => setActiveTab(id as AcervoTab)}
                            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                          >
                            Ver todos →
                          </button>
                        )}
                      </div>

                      {isPlano ? (
                        <div className="space-y-3">
                          {sectionItems.map(item => (
                            <TypeCard key={item.id} item={item} saved={isSaved(item.id)} onSave={() => handleSaveRequest(item)}
                              disciplineColor={discColorMap[item.discipline ?? '']}
                              onViewPdf={item.fileUrl ? () => setPendingPdf({ title: item.title, description: item.description, url: item.fileUrl!, discipline: item.discipline, grade: item.grade }) : undefined}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {sectionItems.map(item => (
                            <TypeCard key={item.id} item={item} saved={isSaved(item.id)} onSave={() => handleSaveRequest(item)}
                              disciplineColor={discColorMap[item.discipline ?? '']}
                              onViewPdf={item.fileUrl ? () => setPendingPdf({ title: item.title, description: item.description, url: item.fileUrl!, discipline: item.discipline, grade: item.grade }) : undefined}
                              onWatchVideo={item.type === 'video' ? () => setPendingVideo(item) : undefined}
                              onPlayAudio={item.type === 'audio'  ? () => setPendingAudio(item) : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isTodos && !isPlanoTab && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map(item => (
                      <TypeCard key={item.id} item={item} saved={isSaved(item.id)} onSave={() => handleSaveRequest(item)}
                        disciplineColor={discColorMap[item.discipline ?? '']}
                        onViewPdf={item.fileUrl ? () => setPendingPdf({ title: item.title, description: item.description, url: item.fileUrl!, discipline: item.discipline, grade: item.grade }) : undefined}
                        onWatchVideo={item.type === 'video' ? () => setPendingVideo(item) : undefined}
                        onPlayAudio={item.type === 'audio' ? () => setPendingAudio(item) : undefined}
                      />
                    ))}
                  </div>
                )}

                {isPlanoTab && (
                  <div className="space-y-3">
                    {filtered.map(item => (
                      <TypeCard key={item.id} item={item} saved={isSaved(item.id)} onSave={() => handleSaveRequest(item)}
                        disciplineColor={discColorMap[item.discipline ?? '']}
                        onViewPdf={item.fileUrl ? () => setPendingPdf({ title: item.title, description: item.description, url: item.fileUrl!, discipline: item.discipline, grade: item.grade }) : undefined}
                        onWatchVideo={item.type === 'video' ? () => setPendingVideo(item) : undefined}
                        onPlayAudio={item.type === 'audio' ? () => setPendingAudio(item) : undefined}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination (only on specific tabs) */}
                {!isTodos && (
                  <Pagination
                    page={page}
                    total={tabTotals[activeTab] ?? 0}
                    limit={PAGE_SIZE}
                    onChange={setPage}
                  />
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

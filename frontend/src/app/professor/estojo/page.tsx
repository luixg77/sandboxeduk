'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  HeroBanner, ProfessorButton, ProfIcons, SectionTitle,
  PdfModal, VideoModal, AudioModal,
  SavedItemRow, FolderCard,
  ModoAulaModal,
} from '@/components/professor-ui';
import { useEstojo } from '@/hooks/useEstojo';
import { useEstojoNotes } from '@/hooks/useEstojoNotes';
import { useEstojoOrder } from '@/hooks/useEstojoOrder';
import type { EstojoItem, EstojoFolder } from '@/hooks/useEstojo';

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto gap-6">
      <div className="w-24 h-24 rounded-3xl bg-orange-100 flex items-center justify-center shadow-[0_6px_0_rgba(0,0,0,0.06)]">
        <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 14.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Seu estojo está vazio</h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          No Acervo, clique em <span className="font-bold text-orange-500">Salvar</span> em qualquer recurso — ele aparecerá aqui organizado em pastas.
        </p>
      </div>
      <Link href="/professor/acervo">
        <ProfessorButton variant="primary" size="lg" iconLeft={<ProfIcons.Book />}>
          Explorar o Acervo
        </ProfessorButton>
      </Link>
    </div>
  );
}

/* ── Page ── */
export default function EstojoPage() {
  const { folders, removeItem, renameFolder, deleteFolder, totalItems } = useEstojo();
  const { notes, setNote }           = useEstojoNotes();
  const { getOrderedItems, moveItem } = useEstojoOrder();
  const supabase = useRef(createClient()).current;

  const [openFolders,  setOpenFolders]  = useState<Set<string>>(new Set());
  const [pendingPdf,   setPendingPdf]   = useState<{ title: string; url: string; discipline?: string; grade?: string } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ title: string; fileUrl: string; discipline?: string; grade?: string } | null>(null);
  const [pendingAudio, setPendingAudio] = useState<{ title: string; fileUrl: string; discipline?: string; grade?: string } | null>(null);
  const [modoAula,     setModoAula]     = useState<{ items: EstojoItem[]; folderName: string } | null>(null);

  function toggleFolder(id: string) {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleView(item: EstojoItem) {
    if (item.fileUrl) setPendingPdf({ title: item.title, url: item.fileUrl, discipline: item.discipline, grade: item.grade });
  }

  async function handleWatch(item: EstojoItem) {
    let url = item.fileUrl;
    if (!url) {
      const { data } = await supabase.from('video_lessons').select('video_url').eq('id', item.id).maybeSingle();
      url = data?.video_url ?? undefined;
    }
    if (url) setPendingVideo({ title: item.title, fileUrl: url, discipline: item.discipline, grade: item.grade });
  }

  async function handlePlay(item: EstojoItem) {
    let url = item.fileUrl;
    if (!url) {
      const { data } = await supabase.from('audio_lessons').select('audio_url').eq('id', item.id).maybeSingle();
      url = data?.audio_url ?? undefined;
    }
    if (url) setPendingAudio({ title: item.title, fileUrl: url, discipline: item.discipline, grade: item.grade });
  }

  /* Retorna folder com itens já na ordem definida pelo professor */
  function orderedFolder(folder: EstojoFolder): EstojoFolder {
    return { ...folder, items: getOrderedItems(folder) };
  }

  const hasFolders = folders.length > 0;

  const recentItems = useMemo(() =>
    folders
      .flatMap(f => f.items.map(i => ({ ...i, folderId: f.id })))
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, 5),
    [folders],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroBanner
        label="Meu Espaço"
        title="Meu Estojo"
        subtitle="Recursos salvos e organizados por pasta para usar nas suas aulas."
        illustration="default"
      />

      {!hasFolders ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-150px)] md:min-h-[calc(100vh-220px)]">
          <EmptyState />
        </div>
      ) : (
        <div className="px-4 md:px-10 py-6 max-w-7xl">

          <p className="text-sm font-bold text-slate-400 mb-6">
            {folders.length} {folders.length === 1 ? 'pasta' : 'pastas'} · {totalItems} {totalItems === 1 ? 'item salvo' : 'itens salvos'}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* Suas Pastas */}
            <div className="space-y-3">
              <SectionTitle title="Suas Pastas" accent="orange" />
              {folders.map(folder => {
                const ordered = orderedFolder(folder);
                return (
                  <FolderCard
                    key={folder.id}
                    folder={ordered}
                    isOpen={openFolders.has(folder.id)}
                    onToggle={() => toggleFolder(folder.id)}
                    onDelete={() => { deleteFolder(folder.id); setOpenFolders(prev => { const s = new Set(prev); s.delete(folder.id); return s; }); }}
                    onRename={name => renameFolder(folder.id, name)}
                    onRemoveItem={itemId => removeItem(itemId, folder.id)}
                    onView={handleView}
                    onWatch={handleWatch}
                    onPlay={handlePlay}
                    onMoveItem={(itemId, dir) => moveItem(folder.id, ordered.items, itemId, dir)}
                    onModoAula={ordered.items.length > 0 ? () => setModoAula({ items: ordered.items, folderName: folder.name }) : undefined}
                    notes={notes}
                    onNoteChange={(itemId, note) => setNote(itemId, note)}
                  />
                );
              })}
            </div>

            {/* Adicionados Recentemente */}
            {recentItems.length > 0 && (
              <div className="hidden lg:block space-y-3 lg:sticky lg:top-6">
                <SectionTitle title="Adicionados Recentemente" accent="orange" />
                <div className="space-y-2">
                  {recentItems.map(item => (
                    <SavedItemRow
                      key={`recent-${item.id}-${item.folderId}`}
                      item={item}
                      onRemove={() => removeItem(item.id, item.folderId)}
                      onView={handleView}
                      onWatch={handleWatch}
                      onPlay={handlePlay}
                      note={notes[item.id] ?? ''}
                      onNoteChange={note => setNote(item.id, note)}
                      hideDownload
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais de mídia */}
      {pendingPdf && (
        <PdfModal
          title={pendingPdf.title}
          url={pendingPdf.url}
          discipline={pendingPdf.discipline}
          grade={pendingPdf.grade}
          onClose={() => setPendingPdf(null)}
        />
      )}
      {pendingVideo && (
        <VideoModal
          title={pendingVideo.title}
          fileUrl={pendingVideo.fileUrl}
          discipline={pendingVideo.discipline}
          grade={pendingVideo.grade}
          onClose={() => setPendingVideo(null)}
        />
      )}
      {pendingAudio && (
        <AudioModal
          title={pendingAudio.title}
          fileUrl={pendingAudio.fileUrl}
          discipline={pendingAudio.discipline}
          grade={pendingAudio.grade}
          onClose={() => setPendingAudio(null)}
        />
      )}

      {/* Modo Aula */}
      {modoAula && (
        <ModoAulaModal
          items={modoAula.items}
          folderName={modoAula.folderName}
          onClose={() => setModoAula(null)}
        />
      )}
    </div>
  );
}

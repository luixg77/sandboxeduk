'use client';

import { useState } from 'react';
import { ProfBadge } from './Badge';
import { ProfessorButton } from './Button';
import type { EstojoItem, EstojoFolder } from '@/hooks/useEstojo';

export type { EstojoItem, EstojoFolder };

/* ── Tipo → config visual ── */
const TYPE_CFG: Record<string, { label: string; variant: any }> = {
  livro:      { label: 'Livro',  variant: 'blue'   },
  video:      { label: 'Vídeo',  variant: 'purple' },
  jogo:       { label: 'Jogo',   variant: 'orange' },
  audio:      { label: 'Áudio',  variant: 'teal'   },
  plano_aula: { label: 'Plano',  variant: 'green'  },
};

const COLOR_BG: Record<string, string> = {
  blue:   'from-blue-400 to-blue-600',
  pink:   'from-pink-400 to-pink-600',
  green:  'from-green-400 to-green-600',
  amber:  'from-amber-400 to-amber-600',
  purple: 'from-purple-400 to-purple-600',
  teal:   'from-teal-400 to-teal-600',
  orange: 'from-orange-400 to-orange-600',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/* ─────────────────────────────────────────────────────────────
   SavedItemRow — com anotações inline
───────────────────────────────────────────────────────────── */

export interface SavedItemRowProps {
  item:           EstojoItem;
  onRemove:       () => void;
  onView:         (item: EstojoItem) => void;
  onWatch:        (item: EstojoItem) => void;
  onPlay:         (item: EstojoItem) => void;
  hideDownload?:  boolean;
  note?:          string;
  onNoteChange?:  (note: string) => void;
}

export function SavedItemRow({
  item, onRemove, onView, onWatch, onPlay,
  hideDownload = false, note = '', onNoteChange,
}: SavedItemRowProps) {
  const cfg      = TYPE_CFG[item.type] ?? TYPE_CFG.livro;
  const gradient = COLOR_BG[item.color] ?? 'from-slate-400 to-slate-600';

  const [showNote, setShowNote]   = useState(false);
  const [noteText, setNoteText]   = useState(note);

  function saveNote() {
    onNoteChange?.(noteText);
    setShowNote(false);
  }
  function cancelNote() {
    setNoteText(note);
    setShowNote(false);
  }
  function openNote() {
    setNoteText(note);
    setShowNote(true);
  }

  function ActionButton() {
    switch (item.type) {
      case 'livro':
        return item.fileUrl
          ? <ProfessorButton size="xs" variant="ghost" onClick={() => onView(item)}>Visualizar</ProfessorButton>
          : null;
      case 'video':
        return <ProfessorButton size="xs" variant="ghost" onClick={() => onWatch(item)}>Assistir</ProfessorButton>;
      case 'audio':
        return <ProfessorButton size="xs" variant="ghost" onClick={() => onPlay(item)}>Ouvir</ProfessorButton>;
      case 'jogo':
        return item.fileUrl
          ? <ProfessorButton size="xs" variant="ghost" onClick={() => window.open(item.fileUrl, '_blank')}>Jogar</ProfessorButton>
          : null;
      case 'plano_aula':
        return item.fileUrl
          ? <ProfessorButton size="xs" variant="ghost" onClick={() => onView(item)}>Visualizar</ProfessorButton>
          : null;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className={`w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <ProfBadge variant={cfg.variant} size="sm">{cfg.label}</ProfBadge>
            {item.discipline && <span className="text-[11px] text-slate-400">{item.discipline}</span>}
            {item.grade      && <span className="text-[11px] text-slate-400">· {item.grade}</span>}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Salvo em {fmtDate(item.savedAt)}</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          <ActionButton />

          {!hideDownload && item.fileUrl && item.canDownload && (
            <a
              href={item.fileUrl}
              download
              className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-500 transition-colors"
              title="Baixar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </a>
          )}

          {/* Anotação */}
          {onNoteChange && (
            <button
              onClick={openNote}
              className={`p-1.5 rounded-xl transition-colors ${
                note
                  ? 'bg-amber-50 text-amber-400 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-300 hover:bg-amber-50 hover:text-amber-400'
              }`}
              title={note ? 'Ver / editar anotação' : 'Adicionar anotação'}
            >
              <svg className="w-4 h-4" fill={note ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}

          <button
            onClick={onRemove}
            className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors"
            title="Remover do Estojo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Área de anotação ── */}
      {onNoteChange && (showNote ? (
        <div className="px-3 pb-3 pl-[68px] space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveNote(); if (e.key === 'Escape') cancelNote(); }}
            placeholder="Adicione uma anotação para este recurso..."
            className="w-full px-3 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-xs text-slate-700 resize-none bg-amber-50 placeholder-slate-300 leading-relaxed"
          />
          <div className="flex items-center gap-1.5">
            <button onClick={saveNote} className="px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors">
              Salvar
            </button>
            <button onClick={cancelNote} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            {note && (
              <button onClick={() => { onNoteChange(''); setShowNote(false); }} className="ml-auto text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                Remover nota
              </button>
            )}
          </div>
        </div>
      ) : note ? (
        <div className="px-3 pb-3 pl-[68px]">
          <button onClick={openNote} className="w-full text-left px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
            <p className="text-[11px] text-amber-700 italic leading-relaxed">{note}</p>
          </button>
        </div>
      ) : null)}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FolderCard — com reordenação e Modo Aula
───────────────────────────────────────────────────────────── */

export interface FolderCardProps {
  folder:        EstojoFolder;
  isOpen:        boolean;
  onToggle:      () => void;
  onDelete:      () => void;
  onRename:      (newName: string) => void;
  onRemoveItem:  (itemId: string) => void;
  onView:        (item: EstojoItem) => void;
  onWatch:       (item: EstojoItem) => void;
  onPlay:        (item: EstojoItem) => void;
  onMoveItem?:   (itemId: string, dir: 'up' | 'down') => void;
  onModoAula?:   () => void;
  notes?:        Record<string, string>;
  onNoteChange?: (itemId: string, note: string) => void;
}

export function FolderCard({
  folder, isOpen, onToggle, onDelete, onRename, onRemoveItem,
  onView, onWatch, onPlay, onMoveItem, onModoAula, notes, onNoteChange,
}: FolderCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [editName,      setEditName]      = useState(folder.name);

  function saveRename() {
    if (editName.trim()) { onRename(editName.trim()); setEditing(false); }
  }
  function cancelRename() { setEditName(folder.name); setEditing(false); }

  return (
    <div className={`bg-white rounded-3xl border transition-all overflow-hidden ${isOpen ? 'border-orange-200 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4">

        {/* Toggle — ocupa todo o header */}
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-orange-100' : 'bg-slate-100'}`}>
            <svg className={`w-5 h-5 ${isOpen ? 'text-orange-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              {isOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              }
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-slate-800 text-sm truncate">{folder.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {folder.items.length === 0 ? 'Vazia' : `${folder.items.length} ${folder.items.length === 1 ? 'item' : 'itens'}`}
              {' · '}
              <span className="text-slate-300">criada em {fmtDate(folder.createdAt)}</span>
            </p>
          </div>
          <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* ── Conteúdo expandido ── */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-3">
          <div className="h-px bg-slate-100" />

          {/* ── Barra de ações: Modo Aula · Editar · Excluir ── */}
          {editing ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); }}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border-2 border-orange-300 focus:outline-none text-xs font-semibold text-slate-700"
              />
              <button onClick={saveRename} className="px-2.5 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">Salvar</button>
              <button onClick={cancelRename} className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
            </div>
          ) : confirmDelete ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Excluir esta pasta?</span>
              <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Não</button>
              <button onClick={onDelete} className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Sim</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {onModoAula && folder.items.length > 0 && (
                <button
                  onClick={onModoAula}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Modo Aula
                </button>
              )}
              <button onClick={() => { setEditing(true); setEditName(folder.name); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                Editar
              </button>
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Excluir
              </button>
            </div>
          )}

          {folder.items.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-sm font-bold text-slate-400">Pasta vazia</p>
              <p className="text-xs text-slate-300 mt-1">Salve recursos do Acervo para esta pasta</p>
            </div>
          ) : (
            <>

              {/* Lista de itens com reordenação */}
              <div
                className="space-y-2 max-h-96 overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
              >
                {folder.items.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2">

                    {/* Setas de reordenação */}
                    {onMoveItem && folder.items.length > 1 && (
                      <div className="flex flex-col gap-0.5 pt-3 shrink-0">
                        <button
                          onClick={() => onMoveItem(item.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 disabled:opacity-0 transition-all"
                          title="Mover para cima"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onMoveItem(item.id, 'down')}
                          disabled={idx === folder.items.length - 1}
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 disabled:opacity-0 transition-all"
                          title="Mover para baixo"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <SavedItemRow
                        item={item}
                        onRemove={() => onRemoveItem(item.id)}
                        onView={onView}
                        onWatch={onWatch}
                        onPlay={onPlay}
                        hideDownload
                        note={notes?.[item.id] ?? ''}
                        onNoteChange={onNoteChange ? n => onNoteChange(item.id, n) : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

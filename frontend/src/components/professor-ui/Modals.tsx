'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/* ── helpers internos ── */

function toYoutubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const vid = u.searchParams.get('v');
    if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1`;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
  } catch { /* url inválida */ }
  return null;
}

function extractSupabasePath(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+?)(?:\?|$)/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   PdfModal — visualizador de PDF em tela cheia
───────────────────────────────────────────────────────────── */

export interface PdfModalProps {
  title:        string;
  url:          string;
  discipline?:  string;
  grade?:       string;
  description?: string;
  onClose:      () => void;
}

function FileViewer({ url, title }: { url: string; title: string }) {
  const [mode, setMode] = useState<'img' | 'iframe'>('img');
  if (mode === 'iframe') {
    return <iframe src={url} title={title} className="w-full h-full border-none" />;
  }
  return (
    <div className="flex items-center justify-center w-full h-full p-6">
      <img
        src={url}
        alt={title}
        className="max-w-full max-h-full object-contain"
        onError={() => setMode('iframe')}
      />
    </div>
  );
}

export function PdfModal({ title, url, discipline, grade, description, onClose }: PdfModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex items-start justify-between px-5 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-extrabold text-slate-800 text-base leading-snug">{title}</p>
          {(discipline || grade) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {discipline && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{discipline}</span>}
              {grade      && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{grade}</span>}
            </div>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0 mt-0.5">
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 bg-slate-900 min-h-0">
        <FileViewer url={url} title={title} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VideoModal — player YouTube ou upload Supabase
───────────────────────────────────────────────────────────── */

export interface VideoModalProps {
  title:        string;
  fileUrl:      string;
  discipline?:  string;
  grade?:       string;
  duration?:    string;
  description?: string;
  onClose:      () => void;
}

export function VideoModal({ title, fileUrl, discipline, grade, duration, description, onClose }: VideoModalProps) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const supabase  = useRef(createClient()).current;
  const embedUrl  = toYoutubeEmbed(fileUrl);
  const isUpload  = !embedUrl;

  useEffect(() => {
    if (!isUpload) { setPlayUrl(embedUrl); return; }
    const info = extractSupabasePath(fileUrl);
    if (!info) { setPlayUrl(fileUrl); return; }
    supabase.storage.from(info.bucket).createSignedUrl(info.path, 3600).then(({ data }) => {
      setPlayUrl(data?.signedUrl ?? fileUrl);
    });
  }, [fileUrl]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-start justify-between px-5 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-extrabold text-slate-800 text-base leading-snug">{title}</p>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-slate-500">
            {discipline && <span>{discipline}</span>}
            {grade      && <span>· {grade}</span>}
            {duration   && <span>· {duration}</span>}
          </div>
          {description && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0 mt-0.5">
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 bg-slate-950 min-h-0 flex items-center justify-center">
        {!playUrl ? (
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        ) : isUpload ? (
          <video src={playUrl} controls autoPlay className="w-full h-full max-h-full" />
        ) : (
          <iframe
            src={playUrl}
            title={title}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AudioModal — player de áudio estilo bottom-sheet
───────────────────────────────────────────────────────────── */

export interface AudioModalProps {
  title:        string;
  fileUrl:      string;
  discipline?:  string;
  grade?:       string;
  duration?:    string;
  description?: string;
  onClose:      () => void;
}

export function AudioModal({ title, fileUrl, discipline, grade, duration, description, onClose }: AudioModalProps) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const supabase   = useRef(createClient()).current;
  const discColor  = discipline ? `hsl(${stringToHue(discipline)}, 65%, 50%)` : '#6366f1';

  useEffect(() => {
    const info = extractSupabasePath(fileUrl);
    if (!info) { setPlayUrl(fileUrl); return; }
    supabase.storage.from(info.bucket).createSignedUrl(info.path, 3600).then(({ data }) => {
      setPlayUrl(data?.signedUrl ?? fileUrl);
    });
  }, [fileUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="h-48 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${discColor}33, ${discColor}99)` }}>
          <svg className="w-20 h-20 text-white/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
          </svg>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 pt-5 pb-3">
          <p className="font-extrabold text-slate-800 text-lg leading-snug">{title}</p>
          <div className="flex flex-wrap gap-2 mt-1 items-center">
            {discipline && (
              <span className="font-semibold px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: discColor }}>
                {discipline}
              </span>
            )}
            {grade    && <span className="text-xs font-medium text-slate-500">{grade}</span>}
            {duration && <span className="text-xs font-medium text-slate-400">· {duration}</span>}
          </div>
          {description && <p className="text-sm text-slate-500 mt-3 leading-relaxed">{description}</p>}
        </div>
        <div className="px-6 pb-8 pt-2">
          {!playUrl ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <audio controls autoPlay src={playUrl} className="w-full accent-indigo-600" style={{ colorScheme: 'light' }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SaveToEstojoModal — seleção de pasta ao salvar conteúdo
───────────────────────────────────────────────────────────── */

export interface EstojoModalFolder {
  id:    string;
  name:  string;
  items: { id: string }[];
}

export interface SaveToEstojoModalProps {
  itemTitle:       string;
  folders:         EstojoModalFolder[];
  onClose:         () => void;
  onSave:          (folderId: string, note: string) => void;
  onCreateAndSave: (folderName: string, note: string) => void;
}

export function SaveToEstojoModal({ itemTitle, folders, onClose, onSave, onCreateAndSave }: SaveToEstojoModalProps) {
  const [selected, setSelected] = useState<string>(folders[0]?.id ?? '');
  const [creating, setCreating] = useState(folders.length === 0);
  const [newName,  setNewName]  = useState('');
  const [note,     setNoteVal]  = useState('');

  const canConfirm = creating ? newName.trim().length > 0 : !!selected;

  function handleSave() {
    if (!canConfirm) return;
    if (creating) onCreateAndSave(newName.trim(), note);
    else          onSave(selected, note);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="#F97316" className="w-5 h-5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">Salvar no Estojo</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">{itemTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de pastas */}
        {!creating && folders.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Escolha uma pasta</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {folders.map(f => (
                <button key={f.id} onClick={() => setSelected(f.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${selected === f.id ? 'border-orange-400 bg-orange-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                >
                  <span className="text-xl">📁</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{f.items.length} {f.items.length === 1 ? 'item' : 'itens'}</p>
                  </div>
                  {selected === f.id && (
                    <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => { setCreating(true); setNewName(''); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-slate-400 hover:text-orange-500 text-xs font-bold"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nova pasta
            </button>
          </div>
        )}

        {/* Criar pasta */}
        {creating && (
          <div className="mb-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nome da pasta</p>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder='Ex: "Semana 3 — Frações"'
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-sm font-medium text-slate-700 placeholder-slate-300 transition-colors"
            />
            {folders.length > 0 && (
              <button onClick={() => { setCreating(false); setSelected(folders[0].id); }}
                className="text-xs font-semibold text-slate-400 hover:text-orange-500 transition-colors"
              >
                ← Escolher pasta existente
              </button>
            )}
          </div>
        )}

        {/* Anotação opcional */}
        <div className="mb-4 space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Anotação <span className="normal-case font-medium text-slate-300">(opcional)</span></p>
          <textarea
            value={note}
            onChange={e => setNoteVal(e.target.value)}
            placeholder="Ex: usar na aula de revisão da semana 5..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm text-slate-700 placeholder-slate-300 resize-none transition-colors"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

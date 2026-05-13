'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EstojoItem } from '@/hooks/useEstojo';

/* ── helpers ── */

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

const TYPE_LABEL: Record<string, string> = {
  livro: 'Livro', video: 'Vídeo', audio: 'Áudio', jogo: 'Jogo', plano_aula: 'Plano de Aula',
};

const TYPE_COLOR: Record<string, string> = {
  livro: 'text-blue-400', video: 'text-purple-400', audio: 'text-indigo-400',
  jogo: 'text-orange-400', plano_aula: 'text-green-400',
};

/* ── Tool types ── */

type ActiveTool = 'none' | 'pen' | 'spotlight';

const PEN_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#FFFFFF'];
const PEN_SIZES  = [3, 6, 12, 20];

/* ── Annotation Canvas ── */

interface CanvasHandle { clear: () => void }

const AnnotationCanvas = forwardRef<CanvasHandle, { active: boolean; color: string; size: number }>(
  ({ active, color, size }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastXY    = useRef({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      clear: () => {
        const c = canvasRef.current;
        if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
      },
    }));

    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const sync = () => {
        c.width  = c.offsetWidth;
        c.height = c.offsetHeight;
      };
      sync();
      const ro = new ResizeObserver(sync);
      ro.observe(c);
      return () => ro.disconnect();
    }, []);

    function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
      const r = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!active) return;
      isDrawing.current = true;
      canvasRef.current?.setPointerCapture(e.pointerId);
      const p = getPos(e);
      lastXY.current = p;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!active || !isDrawing.current) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastXY.current.x, lastXY.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      lastXY.current = p;
    }

    function onUp() { isDrawing.current = false; }

    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-20 ${active ? 'cursor-crosshair' : 'pointer-events-none'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
    );
  }
);
AnnotationCanvas.displayName = 'AnnotationCanvas';

/* ── Toolbar flutuante ── */

function ToolBar({
  activeTool, onSetTool,
  penColor, onSetColor,
  penSize,  onSetSize,
  onClear,
}: {
  activeTool: ActiveTool;
  onSetTool:  (t: ActiveTool) => void;
  penColor:   string;
  onSetColor: (c: string) => void;
  penSize:    number;
  onSetSize:  (s: number) => void;
  onClear:    () => void;
}) {
  const [colorsExpanded, setColorsExpanded] = useState(false);
  const penActive  = activeTool === 'pen';
  const spotActive = activeTool === 'spotlight';

  const COLLAPSED_COUNT = 3;
  const visibleColors   = colorsExpanded ? PEN_COLORS : PEN_COLORS.slice(0, COLLAPSED_COUNT);

  return (
    <>
    {/* Painel principal — sempre centralizado verticalmente, nunca se move */}
    <div
      className="absolute right-3 z-30 select-none"
      style={{ top: '50%', transform: 'translateY(-50%)' }}
    >
      {/* Chip "ferramenta ativa" — flutua à esquerda do painel */}
      {activeTool !== 'none' && (
        <div className="absolute right-full mr-2 top-1 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 whitespace-nowrap">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: penActive ? penColor : '#FDE047' }} />
          <span className="text-xs font-semibold text-white/80">
            {penActive ? 'Caneta ativa' : 'Spotlight ativo'}
          </span>
          <button
            onClick={() => onSetTool('none')}
            className="text-[11px] font-bold text-white/40 hover:text-white/90 transition-colors ml-0.5 px-1.5 py-0.5 rounded-lg hover:bg-white/10"
          >
            sair ×
          </button>
        </div>
      )}

      {/* Botões principais */}
      <div className="bg-black/65 backdrop-blur-sm rounded-2xl p-1.5 flex flex-col gap-1 border border-white/10">

        {/* Caneta */}
        <button
          onClick={() => onSetTool(penActive ? 'none' : 'pen')}
          title={penActive ? 'Clique para desativar (P ou Esc)' : 'Caneta (P)'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            penActive
              ? 'bg-white text-slate-900 shadow-md ring-2 ring-white/50 ring-offset-1 ring-offset-black/70'
              : 'text-white/60 hover:bg-white/15 hover:text-white'
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </button>

        {/* Spotlight */}
        <button
          onClick={() => onSetTool(spotActive ? 'none' : 'spotlight')}
          title={spotActive ? 'Clique para desativar (S ou Esc)' : 'Spotlight (S)'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            spotActive
              ? 'bg-white text-slate-900 shadow-md ring-2 ring-white/50 ring-offset-1 ring-offset-black/70'
              : 'text-white/60 hover:bg-white/15 hover:text-white'
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </button>

        {/* Borracha — só quando caneta ativa */}
        {penActive && (
          <>
            <div className="h-px bg-white/15 mx-1 my-0.5" />
            <button
              onClick={onClear}
              title="Apagar todos os desenhos"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 20H7L3 16l9.5-9.5m2.5-2.5L20 9.5 14.5 4 5 13.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 20l7-7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>

    {/* Painel de cores/tamanhos — posicionado independentemente, nunca move os botões acima */}
    {penActive && (
      <div
        className="absolute right-3 z-30 select-none"
        style={{ top: 'calc(50% + 80px)' }}
      >
        <div className="bg-black/65 backdrop-blur-sm rounded-2xl p-1.5 flex flex-col gap-1.5 border border-white/10">

          {/* Cores visíveis (3 ou todas) */}
          {visibleColors.map(c => (
            <button
              key={c}
              onClick={() => onSetColor(c)}
              className={`w-9 h-9 rounded-xl border-2 transition-all ${
                penColor === c
                  ? 'border-white scale-90 shadow-lg'
                  : 'border-transparent hover:scale-95 hover:border-white/30'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Seta expandir/recolher */}
          <button
            onClick={() => setColorsExpanded(v => !v)}
            title={colorsExpanded ? 'Ver menos cores' : 'Ver mais cores'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${colorsExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className="h-px bg-white/15 mx-1 my-0.5" />

          {/* Tamanhos de ponta */}
          {PEN_SIZES.map(s => (
            <button
              key={s}
              onClick={() => onSetSize(s)}
              title={`Espessura ${s}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                penSize === s ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <div
                className="rounded-full"
                style={{
                  width:           Math.max(3, s * 0.8),
                  height:          Math.max(3, s * 0.8),
                  backgroundColor: penColor,
                  opacity:         0.9,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    )}
    </>
  );
}

/* ── Renderizador por tipo ── */

function FileViewer({ url, title }: { url: string; title: string }) {
  const [mode, setMode] = useState<'img' | 'iframe'>('img');
  if (mode === 'iframe') {
    return <iframe src={url} title={title} className="w-full h-full border-none" />;
  }
  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-900 p-8">
      <img
        src={url}
        alt={title}
        className="max-w-full max-h-full object-contain"
        onError={() => setMode('iframe')}
      />
    </div>
  );
}

function NoContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-white/50 font-semibold">Conteúdo não disponível</p>
      <p className="text-white/30 text-sm">Este recurso não possui arquivo vinculado.</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function ResourceViewer({ item }: { item: EstojoItem }) {
  const [url,        setUrl]        = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [isYoutube,  setIsYoutube]  = useState(false);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    async function resolve() {
      let fileUrl = item.fileUrl ?? null;

      if (!fileUrl && item.type === 'video') {
        const { data } = await supabase.from('video_lessons').select('video_url').eq('id', item.id).maybeSingle();
        fileUrl = data?.video_url ?? null;
      }
      if (!fileUrl && item.type === 'audio') {
        const { data } = await supabase.from('audio_lessons').select('audio_url').eq('id', item.id).maybeSingle();
        fileUrl = data?.audio_url ?? null;
      }

      if (!fileUrl) { setLoading(false); return; }

      if (item.type === 'video') {
        const embed = toYoutubeEmbed(fileUrl);
        if (embed) { setIsYoutube(true); setUrl(embed); setLoading(false); return; }
      }

      if (item.type === 'jogo') { setUrl(fileUrl); setLoading(false); return; }

      const info = extractSupabasePath(fileUrl);
      if (!info) { setUrl(fileUrl); setLoading(false); return; }
      const { data } = await supabase.storage.from(info.bucket).createSignedUrl(info.path, 3600);
      setUrl(data?.signedUrl ?? fileUrl);
      setLoading(false);
    }

    resolve();
  }, []);

  if (loading) return <Spinner />;

  switch (item.type) {
    case 'livro':
    case 'plano_aula':
      return url ? <FileViewer url={url} title={item.title} /> : <NoContent />;

    case 'video':
      if (!url) return <NoContent />;
      return isYoutube
        ? <iframe src={url} title={item.title} className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        : <video src={url} controls autoPlay className="w-full h-full max-h-full object-contain" />;

    case 'audio':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
          <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-900/50">
            <svg className="w-18 h-18 text-white/70" fill="currentColor" viewBox="0 0 24 24" style={{ width: 64, height: 64 }}>
              <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-extrabold text-white text-2xl leading-snug">{item.title}</p>
            {(item.discipline || item.grade) && (
              <p className="text-white/50 text-sm mt-2">
                {item.discipline}{item.discipline && item.grade ? ' · ' : ''}{item.grade}
              </p>
            )}
          </div>
          {url
            ? <audio controls autoPlay src={url} className="w-full max-w-md" style={{ colorScheme: 'dark' }} />
            : <NoContent />
          }
        </div>
      );

    case 'jogo':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
          <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-900/50">
            <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.536.57a48.204 48.204 0 01-.3 4.163c-.022.252.17.472.423.49 1.657.114 3.336.171 5.03.171 1.694 0 3.373-.057 5.03-.17.252-.018.444-.239.423-.49a48.204 48.204 0 01-.3-4.164v0c-.019-.31.226-.57.536-.57.355 0 .676.186.959.401.29.221.634.349 1.003.349 1.036 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25c-.369 0-.713.128-1.003.349-.283.215-.604.401-.959.401v0a.656.656 0 01-.658-.663 48.422 48.422 0 00.315-4.907c.018-.252-.17-.472-.423-.49-.408-.029-.817-.056-1.225-.083a.64.64 0 01-.657-.643v0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-extrabold text-white text-2xl leading-snug">{item.title}</p>
            {(item.discipline || item.grade) && (
              <p className="text-white/50 text-sm mt-2">
                {item.discipline}{item.discipline && item.grade ? ' · ' : ''}{item.grade}
              </p>
            )}
          </div>
          {url
            ? <button
                onClick={() => window.open(url, '_blank')}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-lg transition-colors shadow-lg shadow-orange-900/40"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                Jogar agora
              </button>
            : <NoContent />
          }
        </div>
      );

    default:
      return <NoContent />;
  }
}

/* ── Modal principal ── */

export interface ModoAulaModalProps {
  items:       EstojoItem[];
  folderName:  string;
  startIndex?: number;
  onClose:     () => void;
}

export function ModoAulaModal({ items, folderName, startIndex = 0, onClose }: ModoAulaModalProps) {
  const [idx,        setIdx]       = useState(Math.max(0, Math.min(startIndex, items.length - 1)));
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [penColor,   setPenColor]  = useState(PEN_COLORS[0]);
  const [penSize,    setPenSize]   = useState(PEN_SIZES[1]);
  const [spotPos,    setSpotPos]   = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);

  const item     = items[idx];
  const isFirst  = idx === 0;
  const isLast   = idx === items.length - 1;
  const showDots = items.length <= 12;

  function prev() { if (!isFirst) setIdx(i => i - 1); }
  function next() { if (!isLast)  setIdx(i => i + 1); }

  function toggleTool(tool: ActiveTool) {
    setActiveTool(prev => prev === tool ? 'none' : tool);
  }

  // Limpa o canvas ao trocar de slide
  useEffect(() => {
    canvasRef.current?.clear();
    setSpotPos(null);
  }, [idx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Quando a caneta está ativa, setas não mudam slide
      if (activeTool === 'pen' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') {
        if (activeTool !== 'none') setActiveTool('none');
        else onClose();
      }
      else if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey) toggleTool('pen');
      else if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) toggleTool('spotlight');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, activeTool]);

  if (!item) return null;

  const spotGradient = spotPos
    ? `radial-gradient(circle 170px at ${spotPos.x}px ${spotPos.y}px, transparent 0%, rgba(0,0,0,0.9) 68%)`
    : `radial-gradient(circle 170px at 50% 50%, transparent 0%, rgba(0,0,0,0.9) 68%)`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-black/50 backdrop-blur-sm shrink-0 border-b border-white/10">

        <button
          onClick={prev}
          disabled={isFirst}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-white shrink-0"
          title="Anterior (←)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="font-extrabold text-white text-sm truncate">{item.title}</p>
          <p className="text-[11px] mt-0.5 truncate">
            <span className={`font-bold ${TYPE_COLOR[item.type] ?? 'text-white/60'}`}>
              {TYPE_LABEL[item.type] ?? item.type}
            </span>
            <span className="text-white/40"> · {folderName} · </span>
            <span className="text-white/70 font-semibold">{idx + 1} de {items.length}</span>
          </p>
        </div>

        <button
          onClick={next}
          disabled={isLast}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-white shrink-0"
          title="Próximo (→)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/20 shrink-0" />

        {/* Indicadores de ferramenta ativa */}
        {activeTool !== 'none' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 shrink-0">
            {activeTool === 'pen' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: penColor }} />
                <span className="text-[11px] font-bold text-white/60">Caneta</span>
              </>
            )}
            {activeTool === 'spotlight' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <span className="text-[11px] font-bold text-white/60">Spotlight</span>
              </>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-red-500/50 transition-colors text-white shrink-0"
          title="Fechar (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Content ── */}
      <div
        className="flex-1 min-h-0 relative"
        onMouseMove={e => {
          if (activeTool !== 'spotlight') return;
          const r = e.currentTarget.getBoundingClientRect();
          setSpotPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
      >
        <ResourceViewer key={idx} item={item} />

        {/* Canvas de anotação */}
        <AnnotationCanvas
          ref={canvasRef}
          active={activeTool === 'pen'}
          color={penColor}
          size={penSize}
        />

        {/* Spotlight overlay */}
        {activeTool === 'spotlight' && (
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-none"
            style={{ background: spotGradient }}
          />
        )}

        {/* Toolbar */}
        <ToolBar
          activeTool={activeTool}
          onSetTool={toggleTool}
          penColor={penColor}
          onSetColor={setPenColor}
          penSize={penSize}
          onSetSize={setPenSize}
          onClear={() => canvasRef.current?.clear()}
        />
      </div>

      {/* ── Progress ── */}
      <div className="flex items-center justify-center gap-2 py-3 shrink-0 bg-black/30">
        {showDots ? (
          items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-200 ${
                i === idx ? 'w-6 h-2 bg-orange-400' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-300"
                style={{ width: `${((idx + 1) / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white/40">{idx + 1}/{items.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

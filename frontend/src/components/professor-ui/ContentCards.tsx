'use client';

import { ReactNode } from 'react';
import { ProfBadge } from './Badge';
import { ProfessorButton } from './Button';

/* ─────────────────────────────────────────
   Shared internals
───────────────────────────────────────── */

const DISC_VARIANT: Record<string, string> = {
  'Matemática': 'matematica',
  'Português':  'portugues',
  'Ciências':   'ciencias',
  'História':   'historia',
  'Geografia':  'geografia',
  'Artes':      'artes',
};

function DisciplineBadge({ discipline, color }: { discipline?: string; color?: string }) {
  if (!discipline) return null;
  if (color) {
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
        {discipline}
      </span>
    );
  }
  const v = DISC_VARIANT[discipline] ?? 'slate';
  return <ProfBadge variant={v as any} size="sm">{discipline}</ProfBadge>;
}

function GradeBadge({ grade }: { grade?: string }) {
  if (!grade) return null;
  return <ProfBadge variant="slate" size="sm">{grade}</ProfBadge>;
}

function PcdIcons({ sign, voice }: { sign?: boolean; voice?: boolean }) {
  if (!sign && !voice) return null;
  return (
    <div className="flex gap-1 items-center">
      {sign  && <span title="Libras"   className="text-xs select-none">🤟</span>}
      {voice && <span title="Narração" className="text-xs select-none">🔊</span>}
    </div>
  );
}

function SaveButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); if (!saved) onToggle(); }}
      disabled={saved}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
        saved
          ? 'bg-orange-50 text-orange-500 cursor-default'
          : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
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

/* Card wrapper — sem sombra, só borda */
function CardGrid({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 hover:border-slate-300 hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function CardList({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   GAME CARD — grid, destaque por dificuldade
───────────────────────────────────────── */
const DIFF_CONFIG: Record<string, { grad: string; badge: string; text: string }> = {
  'Fácil':   { grad: 'from-emerald-400 to-green-600',  badge: 'bg-emerald-500', text: 'Fácil' },
  'Médio':   { grad: 'from-amber-400   to-orange-500', badge: 'bg-amber-500',   text: 'Médio' },
  'Difícil': { grad: 'from-red-400     to-rose-600',   badge: 'bg-red-500',     text: 'Difícil' },
  '1':       { grad: 'from-emerald-400 to-green-600',  badge: 'bg-emerald-500', text: 'Fácil' },
  '2':       { grad: 'from-amber-400   to-orange-500', badge: 'bg-amber-500',   text: 'Médio' },
  '3':       { grad: 'from-red-400     to-rose-600',   badge: 'bg-red-500',     text: 'Difícil' },
};

export interface GameCardData {
  title:        string;
  discipline?:  string;
  grade?:       string;
  difficulty?:  string;
  engine?:      string;
  pcdSign?:     boolean;
  pcdVoice?:    boolean;
  thumbnailUrl?: string;
}

interface GameCardProps extends GameCardData {
  saved?:     boolean;
  onSave?:    () => void;
  onApply?:   () => void;
  onClick?:   () => void;
  className?: string;
}

export function GameCard({
  title, discipline, grade, difficulty, engine, pcdSign, pcdVoice,
  thumbnailUrl, saved = false, onSave, onApply, onClick, className = '',
}: GameCardProps) {
  const diff = difficulty ? (DIFF_CONFIG[difficulty] ?? DIFF_CONFIG['Fácil']) : DIFF_CONFIG['Fácil'];

  return (
    <CardGrid onClick={onClick} className={className}>
      {/* Cover */}
      <div className={`relative h-36 bg-gradient-to-br ${diff.grad} flex items-center justify-center shrink-0`}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <svg className="w-12 h-12 text-white/75" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.536.57a48.204 48.204 0 01-.3 4.163c-.022.252.17.472.423.49 1.657.114 3.336.171 5.03.171 1.694 0 3.373-.057 5.03-.17.252-.018.444-.239.423-.49a48.204 48.204 0 01-.3-4.164v0c-.019-.31.226-.57.536-.57.355 0 .676.186.959.401.29.221.634.349 1.003.349 1.036 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25c-.369 0-.713.128-1.003.349-.283.215-.604.401-.959.401v0a.656.656 0 01-.658-.663 48.422 48.422 0 00.315-4.907c.018-.252-.17-.472-.423-.49-.408-.029-.817-.056-1.225-.083a.64.64 0 01-.657-.643v0z" />
          </svg>
        )}
        {/* Difficulty pill */}
        {difficulty && (
          <span className={`absolute top-3 left-3 text-[10px] font-extrabold text-white ${diff.badge} px-2.5 py-1 rounded-full`}>
            {diff.text}
          </span>
        )}
        {/* PCD */}
        <div className="absolute bottom-2.5 right-3">
          <PcdIcons sign={pcdSign} voice={pcdVoice} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {engine && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
            ⚡ {engine}
          </span>
        )}
        <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 flex-1">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          <DisciplineBadge discipline={discipline} />
          <GradeBadge grade={grade} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <SaveButton saved={saved} onToggle={() => onSave?.()} />
        <ProfessorButton size="xs" variant="ghost" onClick={e => e.stopPropagation()}>Jogar</ProfessorButton>
      </div>
    </CardGrid>
  );
}

/* ─────────────────────────────────────────
   VIDEO CARD — grid, estilo cinematográfico
───────────────────────────────────────── */
export interface VideoCardData {
  title:           string;
  discipline?:     string;
  disciplineColor?: string;
  grade?:          string;
  duration?:       string;
  thumbnailUrl?:   string;
  sourceType?:     'link' | 'upload';
  views?:          number;
  description?:    string;
}

interface VideoCardProps extends VideoCardData {
  saved?:     boolean;
  onSave?:    () => void;
  onApply?:   () => void;
  onWatch?:   () => void;
  onClick?:   () => void;
  className?: string;
}

export function VideoCard({
  title, discipline, disciplineColor, grade, duration, thumbnailUrl, sourceType, views,
  description, saved = false, onSave, onApply, onWatch, onClick, className = '',
}: VideoCardProps) {
  return (
    <CardGrid onClick={onClick} className={className}>
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 group/thumb">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        </div>
        {/* Source badge */}
        {sourceType && (
          <span className={`absolute top-3 left-3 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${sourceType === 'link' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {sourceType === 'link' ? 'YouTube' : 'Upload'}
          </span>
        )}
        {/* Duration */}
        {duration && (
          <span className="absolute bottom-2.5 right-3 text-[10px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-full">
            {duration}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 flex-1">{title}</p>
        {description && <p className="text-xs text-slate-500 line-clamp-2">{description}</p>}
        <div className="flex flex-wrap gap-1.5 items-center">
          <DisciplineBadge discipline={discipline} color={disciplineColor} />
          <GradeBadge grade={grade} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <SaveButton saved={saved} onToggle={() => onSave?.()} />
        <ProfessorButton size="xs" variant="ghost" onClick={e => { e.stopPropagation(); onWatch?.(); }}>Assistir</ProfessorButton>
      </div>
    </CardGrid>
  );
}

/* ─────────────────────────────────────────
   AUDIO CARD — grid, gradiente musical
───────────────────────────────────────── */
export interface AudioCardData {
  title:            string;
  discipline?:      string;
  disciplineColor?: string;
  grade?:           string;
  duration?:        string;
  thumbnailUrl?:    string;
  tipo?:            string;
  plays?:           number;
  description?:     string;
}

interface AudioCardProps extends AudioCardData {
  saved?:     boolean;
  onSave?:    () => void;
  onApply?:   () => void;
  onPlay?:    () => void;
  onClick?:   () => void;
  className?: string;
}

export function AudioCard({
  title, discipline, disciplineColor, grade, duration, thumbnailUrl, tipo, plays,
  description, saved = false, onSave, onApply, onPlay, onClick, className = '',
}: AudioCardProps) {
  return (
    <CardGrid onClick={onClick} className={className}>
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 group/cover">
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        {/* Music icon */}
        <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
        </svg>
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        </div>
        {/* Type tag */}
        {tipo && (
          <span className="absolute top-3 left-3 text-[10px] font-extrabold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/25">
            {tipo}
          </span>
        )}
        {/* Duration */}
        {duration && (
          <span className="absolute bottom-2.5 right-3 text-[10px] font-extrabold text-white bg-black/60 px-2 py-0.5 rounded-full">
            {duration}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 flex-1">{title}</p>
        {description && <p className="text-xs text-slate-500 line-clamp-2">{description}</p>}
        <div className="flex flex-wrap gap-1.5 items-center">
          <DisciplineBadge discipline={discipline} color={disciplineColor} />
          <GradeBadge grade={grade} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <SaveButton saved={saved} onToggle={() => onSave?.()} />
        <ProfessorButton size="xs" variant="ghost" onClick={e => { e.stopPropagation(); onPlay?.(); }}>Ouvir</ProfessorButton>
      </div>
    </CardGrid>
  );
}

/* ─────────────────────────────────────────
   LIVRO CARD — grid, capa de livro
───────────────────────────────────────── */
const LIVRO_GRAD: Record<string, string> = {
  'Matemática': 'from-blue-500   to-blue-700',
  'Português':  'from-pink-500   to-rose-600',
  'Ciências':   'from-green-500  to-emerald-700',
  'História':   'from-amber-500  to-orange-600',
  'Geografia':  'from-teal-500   to-teal-700',
  'Artes':      'from-purple-500 to-purple-700',
  'default':    'from-slate-500  to-slate-700',
};

export interface LivroCardData {
  title:            string;
  discipline?:      string;
  disciplineColor?: string;
  grade?:           string;
  description?:     string;
  thumbnailUrl?:    string;
  fileUrl?:         string;
  canDownload?:     boolean;
  interactive?:     boolean;
  pcdSign?:         boolean;
  pcdVoice?:        boolean;
  isNew?:           boolean;
}

interface LivroCardProps extends LivroCardData {
  saved?:       boolean;
  onSave?:      () => void;
  onApply?:     () => void;
  onView?:      () => void;
  onDownload?:  () => void;
  onClick?:     () => void;
  className?:   string;
}

export function LivroCard({
  title, discipline, disciplineColor, grade, description, thumbnailUrl, fileUrl, canDownload,
  isNew, saved = false, onSave, onView, onDownload, onClick, className = '',
}: LivroCardProps) {
  const grad = LIVRO_GRAD[discipline ?? ''] ?? LIVRO_GRAD['default'];

  return (
    <CardGrid onClick={onClick} className={className}>
      {/* Capa */}
      <div className={`relative h-40 bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )}
        {isNew && (
          <span className="absolute top-3 left-3 text-[10px] font-extrabold text-white bg-orange-500 px-2.5 py-1 rounded-full">Novo</span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 flex-1">{title}</p>
        {description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{description}</p>}
        <div className="flex flex-wrap gap-1.5">
          <DisciplineBadge discipline={discipline} color={disciplineColor} />
          <GradeBadge grade={grade} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <SaveButton saved={saved} onToggle={() => onSave?.()} />
        <div className="flex items-center gap-1.5">
          {canDownload && fileUrl && (
            <button
              onClick={e => { e.stopPropagation(); onDownload?.(); }}
              className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
              title="Baixar"
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          )}
          {fileUrl && (
            <ProfessorButton size="xs" variant="ghost" onClick={e => { e.stopPropagation(); onView?.(); }}>Ver</ProfessorButton>
          )}
        </div>
      </div>
    </CardGrid>
  );
}

/* ─────────────────────────────────────────
   PLANO CARD — lista horizontal, cor por tipo de documento
───────────────────────────────────────── */
const PLANO_TYPE: Record<string, { label: string; bar: string; badge: string }> = {
  'plano_aula':         { label: 'Plano de Aula',      bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  'sequencia_didatica': { label: 'Sequência Didática', bar: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700' },
  'material_diverso':   { label: 'Material',           bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
};

export interface PlanoCardData {
  title:            string;
  description?:     string;
  discipline?:      string;
  disciplineColor?: string;
  grade?:           string;
  tipodoc?:         'plano_aula' | 'sequencia_didatica' | 'material_diverso';
  bnccSkill?:       string;
  canDownload?:     boolean;
  interactive?:     boolean;
  pcdSign?:         boolean;
  pcdVoice?:        boolean;
  thumbnailUrl?:    string;
}

interface PlanoCardProps extends PlanoCardData {
  saved?:      boolean;
  onSave?:     () => void;
  onApply?:    () => void;
  onView?:     () => void;
  onDownload?: () => void;
  onClick?:    () => void;
  className?:  string;
}

export function PlanoCard({
  title, description, discipline, disciplineColor, grade, tipodoc = 'plano_aula', bnccSkill,
  canDownload, interactive, pcdSign, pcdVoice, thumbnailUrl,
  saved = false, onSave, onApply, onView, onDownload, onClick, className = '',
}: PlanoCardProps) {
  const cfg = PLANO_TYPE[tipodoc];

  return (
    <CardList onClick={onClick} className={className}>
      <div className="flex">
        {/* Left color bar */}
        <div className={`w-1.5 shrink-0 ${cfg.bar} rounded-l-3xl`} />

        {/* Thumbnail */}
        <div className="w-32 shrink-0 bg-slate-50 flex items-center justify-center border-r border-slate-100">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Badges top row */}
          <div className="flex flex-wrap gap-1.5 mb-2 items-center">
            <span className={`inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <DisciplineBadge discipline={discipline} color={disciplineColor} />
            <GradeBadge grade={grade} />
            {bnccSkill && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                {bnccSkill}
              </span>
            )}
          </div>

          <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-1">{title}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              <span className="font-semibold text-slate-600">Objetivo/Descrição: </span>{description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
            <SaveButton saved={saved} onToggle={() => onSave?.()} />
            <div className="flex items-center gap-1.5">
              {canDownload && (
                <button
                  onClick={e => { e.stopPropagation(); onDownload?.(); }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                  title="Baixar"
                >
                  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              )}
              <ProfessorButton size="xs" variant="ghost" onClick={e => { e.stopPropagation(); onView?.(); }}>Visualizar</ProfessorButton>
            </div>
          </div>
        </div>
      </div>
    </CardList>
  );
}

/* ─────────────────────────────────────────
   QUESTÃO CARD — lista horizontal, strip de disciplina
───────────────────────────────────────── */
const DISC_BAR: Record<string, string> = {
  'Matemática': 'bg-blue-500',
  'Português':  'bg-pink-500',
  'Ciências':   'bg-green-500',
  'História':   'bg-amber-500',
  'Geografia':  'bg-teal-500',
  'Artes':      'bg-purple-500',
};

const QDIFF: Record<string, { label: string; cls: string }> = {
  'easy':   { label: 'Fácil',   cls: 'bg-emerald-100 text-emerald-700' },
  'medium': { label: 'Médio',   cls: 'bg-amber-100   text-amber-700' },
  'hard':   { label: 'Difícil', cls: 'bg-red-100     text-red-700' },
  'Fácil':  { label: 'Fácil',   cls: 'bg-emerald-100 text-emerald-700' },
  'Médio':  { label: 'Médio',   cls: 'bg-amber-100   text-amber-700' },
  'Difícil':{ label: 'Difícil', cls: 'bg-red-100     text-red-700' },
};

export interface QuestaoCardData {
  statement:    string;
  discipline?:  string;
  grade?:       string;
  difficulty?:  string;
  type?:        'multiple_choice' | 'discursive';
  origin?:      'system' | 'custom';
  bnccSkill?:   string;
  year?:        number;
  source?:      string;
  imageUrl?:    string;
}

interface QuestaoCardProps extends QuestaoCardData {
  saved?:     boolean;
  onSave?:    () => void;
  onApply?:   () => void;
  onView?:    () => void;
  onClick?:   () => void;
  className?: string;
}

export function QuestaoCard({
  statement, discipline, grade, difficulty, type, origin, bnccSkill, year, source, imageUrl,
  saved = false, onSave, onApply, onView, onClick, className = '',
}: QuestaoCardProps) {
  const barColor = DISC_BAR[discipline ?? ''] ?? 'bg-slate-400';
  const diff     = difficulty ? QDIFF[difficulty] : null;

  return (
    <CardList onClick={onClick} className={className}>
      <div className="flex">
        {/* Discipline color strip */}
        <div className={`w-1.5 shrink-0 ${barColor} rounded-l-3xl`} />

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2.5 items-center">
            <DisciplineBadge discipline={discipline} />
            {diff && (
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${diff.cls}`}>
                {diff.label}
              </span>
            )}
            {type && (
              <ProfBadge variant="slate" size="sm">
                {type === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}
              </ProfBadge>
            )}
            {origin && (
              <ProfBadge variant={origin === 'system' ? 'blue' : 'teal'} size="sm">
                {origin === 'system' ? 'Sistema' : 'Personalizada'}
              </ProfBadge>
            )}
            {bnccSkill && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                {bnccSkill}
              </span>
            )}
            <GradeBadge grade={grade} />
          </div>

          {/* Statement */}
          <div className="flex gap-3">
            <p className="text-sm text-slate-700 font-semibold leading-relaxed line-clamp-3 flex-1">
              {statement}
            </p>
            {imageUrl && (
              <img src={imageUrl} alt="Imagem da questão" className="w-20 h-14 object-cover rounded-xl shrink-0 border border-slate-200" />
            )}
          </div>

          {/* Meta */}
          {(year || source) && (
            <p className="text-[11px] text-slate-400 font-semibold mt-1.5 flex items-center gap-2">
              {source && <span>{source}</span>}
              {source && year && <span>•</span>}
              {year && <span>{year}</span>}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <SaveButton saved={saved} onToggle={() => onSave?.()} />
            <div className="ml-auto flex gap-1.5">
              <ProfessorButton size="xs" variant="ghost"   onClick={e => { e.stopPropagation(); onView?.(); }}>Ver questão</ProfessorButton>
              <ProfessorButton size="xs" variant="primary" onClick={e => { e.stopPropagation(); onApply?.(); }}>Usar na Avaliação</ProfessorButton>
            </div>
          </div>
        </div>
      </div>
    </CardList>
  );
}

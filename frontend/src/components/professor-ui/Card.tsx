'use client';

import { ReactNode } from 'react';

/* ─────────────────────────────────────────
   Base card wrapper
───────────────────────────────────────── */
interface ProfCardProps {
  children:  ReactNode;
  className?: string;
  onClick?:  () => void;
  hover?:    boolean;
}

export function ProfCard({ children, className = '', onClick, hover = false }: ProfCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl
        border border-slate-200
        ${hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-slate-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Book / Content card (vertical, with cover)
───────────────────────────────────────── */
type CoverColor = 'orange' | 'teal' | 'purple' | 'pink' | 'green' | 'blue' | 'amber';

const coverGradients: Record<CoverColor, string> = {
  orange: 'from-orange-400 via-orange-500 to-orange-700',
  teal:   'from-teal-400   via-teal-500   to-teal-700',
  purple: 'from-purple-400 via-purple-500 to-purple-700',
  pink:   'from-pink-400   via-pink-500   to-pink-700',
  green:  'from-green-400  via-green-500  to-green-700',
  blue:   'from-blue-400   via-blue-500   to-blue-700',
  amber:  'from-amber-400  via-amber-500  to-amber-700',
};

interface BookCardProps {
  title:      string;
  subtitle?:  string;
  badge?:     string;
  badgeColor?: CoverColor;
  color?:     CoverColor;
  coverIcon?: ReactNode;
  footer?:    ReactNode;
  onClick?:   () => void;
  className?: string;
}

export function BookCard({
  title,
  subtitle,
  badge,
  badgeColor = 'blue',
  color      = 'purple',
  coverIcon,
  footer,
  onClick,
  className  = '',
}: BookCardProps) {
  return (
    <ProfCard hover onClick={onClick} className={`flex flex-col overflow-hidden ${className}`}>
      {/* Cover area */}
      <div className={`relative h-36 bg-gradient-to-br ${coverGradients[color]} flex items-center justify-center`}>
        {/* Badge */}
        {badge && (
          <span className="absolute top-3 left-3 text-[10px] font-extrabold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/30">
            {badge}
          </span>
        )}
        {/* Cover icon or placeholder */}
        <div className="relative z-10 w-12 h-12 text-white/90">
          {coverIcon ?? (
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-1">
        <p className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 leading-snug line-clamp-2 mt-0.5">{subtitle}</p>}
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
    </ProfCard>
  );
}

/* ─────────────────────────────────────────
   Stat / Metric card
───────────────────────────────────────── */
interface StatCardProps {
  label:      string;
  value:      string | number;
  icon:       ReactNode;
  iconColor?: CoverColor;
  trend?:     { value: string; up: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, iconColor = 'orange', trend, className = '' }: StatCardProps) {
  return (
    <ProfCard className={`p-5 flex items-center gap-4 ${className}`}>
      {/* Icon */}
      <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${coverGradients[iconColor]} flex items-center justify-center shadow-lg`}>
        <span className="w-7 h-7 text-white">{icon}</span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-500 truncate">{label}</p>
        <p className="text-[28px] font-extrabold text-slate-800 leading-none mt-0.5">{value}</p>
        {trend && (
          <p className={`text-[11px] font-bold mt-1 ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? '▲' : '▼'} {trend.value}
          </p>
        )}
      </div>
    </ProfCard>
  );
}

/* ─────────────────────────────────────────
   Content list-item card (horizontal)
───────────────────────────────────────── */
interface ContentCardProps {
  title:       string;
  subtitle?:   string;
  meta?:       string;
  progress?:   number;
  progressColor?: 'orange' | 'teal' | 'green' | 'purple';
  badge?:      ReactNode;
  actions?:    ReactNode;
  onClick?:    () => void;
  className?:  string;
}

const progressColors: Record<string, string> = {
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
  green:  'bg-green-500',
  purple: 'bg-purple-500',
};

export function ContentCard({
  title,
  subtitle,
  meta,
  progress,
  progressColor = 'green',
  badge,
  actions,
  onClick,
  className = '',
}: ContentCardProps) {
  return (
    <ProfCard
      hover={!!onClick}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-800 text-sm truncate">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        {progress !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColors[progressColor]}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">{progress}%</span>
          </div>
        )}
      </div>
      {meta && (
        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-700 whitespace-nowrap">{meta}</p>
        </div>
      )}
      {actions && <div className="shrink-0">{actions}</div>}
      {/* Chevron */}
      {onClick && (
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </ProfCard>
  );
}

/* ─────────────────────────────────────────
   Feature card (icon + title + description)
───────────────────────────────────────── */
interface FeatureCardProps {
  title:       string;
  description?: string;
  icon:        ReactNode;
  iconColor?:  CoverColor;
  onClick?:    () => void;
  className?:  string;
}

export function FeatureCard({ title, description, icon, iconColor = 'orange', onClick, className = '' }: FeatureCardProps) {
  return (
    <ProfCard hover={!!onClick} onClick={onClick} className={`p-6 flex flex-col items-start gap-4 ${className}`}>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${coverGradients[iconColor]} flex items-center justify-center shadow-lg`}>
        <span className="w-7 h-7 text-white">{icon}</span>
      </div>
      <div>
        <p className="font-extrabold text-slate-800 text-base leading-snug">{title}</p>
        {description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {onClick && (
        <svg className="w-5 h-5 text-orange-400 mt-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      )}
    </ProfCard>
  );
}

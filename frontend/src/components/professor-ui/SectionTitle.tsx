'use client';

import { ReactNode } from 'react';

interface SectionTitleProps {
  title:      string;
  subtitle?:  string;
  icon?:      ReactNode;
  actions?:   ReactNode;
  accent?:    'orange' | 'teal' | 'purple' | 'blue' | 'none';
  className?: string;
}

const accentBar: Record<string, string> = {
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
  purple: 'bg-purple-500',
  blue:   'bg-blue-500',
  none:   'hidden',
};

export function SectionTitle({
  title,
  subtitle,
  icon,
  actions,
  accent    = 'none',
  className = '',
}: SectionTitleProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        {accent !== 'none' && (
          <div className={`w-1 rounded-full shrink-0 mt-1 h-6 ${accentBar[accent]}`} />
        )}
        {icon && (
          <span className="w-6 h-6 text-slate-600 shrink-0 mt-0.5">{icon}</span>
        )}
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-800 leading-snug">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

/* ── Page title (larger, used at top of content area) ── */
interface PageTitleProps {
  title:      string;
  subtitle?:  string;
  breadcrumb?: { label: string; href?: string }[];
  actions?:   ReactNode;
  className?: string;
}

export function PageTitle({ title, subtitle, breadcrumb, actions, className = '' }: PageTitleProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span className={item.href ? 'hover:text-slate-600 cursor-pointer' : 'text-slate-600'}>{item.label}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-900 leading-snug">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

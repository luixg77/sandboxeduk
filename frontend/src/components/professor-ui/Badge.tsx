'use client';

import { ReactNode } from 'react';

export type ProfBadgeVariant =
  | 'orange' | 'teal' | 'purple' | 'pink' | 'green' | 'blue' | 'amber' | 'red' | 'slate'
  | 'matematica' | 'portugues' | 'ciencias' | 'historia' | 'geografia' | 'artes'
  | 'novo' | 'em_progresso' | 'concluido' | 'pendente';

const variantMap: Record<ProfBadgeVariant, string> = {
  // Generic colors
  orange:      'bg-orange-100 text-orange-700 border border-orange-200',
  teal:        'bg-teal-100   text-teal-700   border border-teal-200',
  purple:      'bg-purple-100 text-purple-700 border border-purple-200',
  pink:        'bg-pink-100   text-pink-700   border border-pink-200',
  green:       'bg-green-100  text-green-700  border border-green-200',
  blue:        'bg-blue-100   text-blue-700   border border-blue-200',
  amber:       'bg-amber-100  text-amber-700  border border-amber-200',
  red:         'bg-red-100    text-red-700    border border-red-200',
  slate:       'bg-slate-100  text-slate-600  border border-slate-200',
  // Subject
  matematica:  'bg-blue-100   text-blue-700   border border-blue-200',
  portugues:   'bg-pink-100   text-pink-700   border border-pink-200',
  ciencias:    'bg-green-100  text-green-700  border border-green-200',
  historia:    'bg-amber-100  text-amber-700  border border-amber-200',
  geografia:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  artes:       'bg-purple-100 text-purple-700 border border-purple-200',
  // Status
  novo:         'bg-purple-100 text-purple-700 border border-purple-200',
  em_progresso: 'bg-amber-100  text-amber-700  border border-amber-200',
  concluido:    'bg-green-100  text-green-700  border border-green-200',
  pendente:     'bg-slate-100  text-slate-600  border border-slate-200',
};

interface ProfBadgeProps {
  variant?:  ProfBadgeVariant;
  children:  ReactNode;
  dot?:      boolean;
  size?:     'sm' | 'md';
  className?: string;
}

export function ProfBadge({
  variant   = 'orange',
  children,
  dot       = false,
  size      = 'sm',
  className = '',
}: ProfBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
        ${variantMap[variant]}
        ${className}
      `}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}

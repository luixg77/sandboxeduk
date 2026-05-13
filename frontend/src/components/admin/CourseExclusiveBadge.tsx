'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

interface CourseExclusiveBadgeProps {
  course: { id: string; title: string } | null | undefined;
  /** "compact" mostra só o ícone + título; "full" inclui o rótulo "Exclusivo do curso". */
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Badge exibido em listagens admin quando um conteúdo (vídeo/áudio/livro/plano/jogo/questão)
 * tem `course_id` preenchido — sinaliza que é exclusivo daquele curso e não aparece no acervo.
 */
export function CourseExclusiveBadge({
  course,
  variant = 'compact',
  className = '',
}: CourseExclusiveBadgeProps) {
  if (!course) return null;

  return (
    <Link
      href={`/admin/cursos/${course.id}`}
      onClick={e => e.stopPropagation()}
      title={`Exclusivo do curso: ${course.title}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors max-w-[200px] ${className}`}
    >
      <Lock className="w-2.5 h-2.5 shrink-0" />
      {variant === 'full' && <span className="shrink-0">Exclusivo:</span>}
      <span className="truncate">{course.title}</span>
    </Link>
  );
}

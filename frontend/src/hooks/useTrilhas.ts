'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

/* ── Types ── */
export interface TrilhaDisciplina {
  name:      string;
  color_hex: string;
}

export type TrilhaItemType = 'video' | 'audio' | 'question' | 'book' | 'lesson_plan' | 'game';

export interface TrilhaModuleItem {
  id:            string; // course_module_items.id
  item_id:       string; // FK para o conteúdo real (video_lessons.id, books.id, ...)
  item_type:     TrilhaItemType;
  title:         string;
  thumbnail_url: string | null;
  completed:     boolean;
}

export interface TrilhaModule {
  id:          string;
  title:       string;
  description: string | null;
  start_date:  string | null;
  end_date:    string | null;
  order_index: number;
  items:       TrilhaModuleItem[];
  progress:    number; // 0-100, ready for real implementation
}

export interface Trilha {
  id:              string;
  title:           string;
  description:     string | null;
  thumbnail_url:   string | null;
  status:          'draft' | 'published' | 'archived';
  start_date:      string | null;
  end_date:        string | null;
  target_audience: 'student' | 'teacher' | 'both';
  disciplines:     TrilhaDisciplina[];
  grades:          string[];
  modules:         TrilhaModule[];
  progress:        number; // overall 0-100
}

/* ── Helpers ── */
function parseModules(raw: any[]): TrilhaModule[] {
  return [...(raw ?? [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map(m => ({
      id:          m.id,
      title:       m.title,
      description: m.description ?? null,
      start_date:  m.start_date  ?? null,
      end_date:    m.end_date    ?? null,
      order_index: m.order_index ?? 0,
      items: [...(m.course_module_items ?? [])]
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((i: any) => ({
          id:            i.id,
          item_id:       i.item_id,
          item_type:     i.item_type,
          title:         i.title,
          thumbnail_url: i.thumbnail_url ?? null,
          completed:     false,
        })),
      progress: 0, // recalculado via applyTrilhaProgress()
    }));
}

function parseTrilha(raw: any): Trilha {
  return {
    id:              raw.id,
    title:           raw.title,
    description:     raw.description ?? null,
    thumbnail_url:   raw.thumbnail_url ?? null,
    status:          raw.status,
    start_date:      raw.start_date ?? null,
    end_date:        raw.end_date   ?? null,
    target_audience: raw.target_audience ?? 'both',
    disciplines:     (raw.course_disciplines ?? [])
                       .map((d: any) => d.disciplines)
                       .filter(Boolean)
                       .map((d: any) => ({ name: d.name, color_hex: d.color_hex || '#6366f1' })),
    grades:          (raw.course_grades ?? [])
                       .map((g: any) => g.grades?.name)
                       .filter(Boolean),
    modules:         parseModules(raw.course_modules ?? []),
    progress:        0, // recalculado no consumidor a partir da média dos módulos
  };
}

export function getCourseProgress(t: Pick<Trilha, 'modules'>): number {
  const total = t.modules.reduce((s, m) => s + m.items.length, 0);
  if (total === 0) return 0;
  const done  = t.modules.reduce((s, m) => s + m.items.filter(i => i.completed).length, 0);
  return Math.round((done / total) * 100);
}

/**
 * Recalcula `completed` por item e `progress` por módulo a partir de um conjunto
 * de IDs marcados (overrides do localStorage / futura tabela de progresso).
 */
export function applyTrilhaProgress(trilha: Trilha, isComplete: (itemId: string) => boolean): Trilha {
  return {
    ...trilha,
    modules: trilha.modules.map(m => {
      const items = m.items.map(it => ({ ...it, completed: isComplete(it.id) }));
      const done  = items.filter(i => i.completed).length;
      const progress = items.length ? Math.round((done / items.length) * 100) : 0;
      return { ...m, items, progress };
    }),
  };
}

const TRILHA_SELECT = `
  id, title, description, thumbnail_url, status, start_date, end_date, target_audience,
  course_disciplines(discipline_id, disciplines(name, color_hex)),
  course_grades(grade_id, grades(name)),
  course_modules(id, title, description, start_date, end_date, order_index,
    course_module_items(id, item_id, item_type, title, thumbnail_url, order_index)
  )
`;

/* ── Hooks ── */
export function useTrilhas() {
  return useQuery<Trilha[]>({
    queryKey: ['professor', 'trilhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(TRILHA_SELECT)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(parseTrilha);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrilhaById(id: string) {
  return useQuery<Trilha>({
    queryKey: ['professor', 'trilha', id],
    enabled:  !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(TRILHA_SELECT)
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return parseTrilha(data);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Status helpers ── */
export type TrilhaStatus = 'em_andamento' | 'em_breve' | 'encerrada' | 'disponivel';

export function getTrilhaStatus(t: Pick<Trilha, 'start_date' | 'end_date' | 'status'>): TrilhaStatus {
  const now = new Date();
  if (t.start_date && new Date(t.start_date) > now) return 'em_breve';
  if (t.end_date   && new Date(t.end_date)   < now) return 'encerrada';
  if (t.start_date && t.end_date)                    return 'em_andamento';
  return 'disponivel';
}

export type TrilhaUserStatus =
  | 'em_breve'
  | 'encerrada'
  | 'concluida'
  | 'em_andamento'
  | 'nao_iniciada';

/**
 * Status visível para o usuário, combinando período da trilha e progresso real.
 * Prioridade: em_breve > encerrada > concluida > em_andamento > nao_iniciada.
 */
export function getTrilhaUserStatus(t: Trilha): TrilhaUserStatus {
  const now = new Date();
  if (t.start_date && new Date(t.start_date) > now) return 'em_breve';
  if (t.end_date   && new Date(t.end_date)   < now) return 'encerrada';

  const totalItems = t.modules.reduce((s, m) => s + m.items.length, 0);
  const doneItems  = t.modules.reduce((s, m) => s + m.items.filter(i => i.completed).length, 0);

  if (totalItems > 0 && doneItems >= totalItems) return 'concluida';
  if (doneItems > 0)                              return 'em_andamento';
  return 'nao_iniciada';
}

export function getModuleStatus(m: Pick<TrilhaModule, 'start_date' | 'end_date'>): 'bloqueado' | 'disponivel' | 'encerrado' {
  const now = new Date();
  if (m.start_date && new Date(m.start_date) > now) return 'bloqueado';
  if (m.end_date   && new Date(m.end_date)   < now) return 'encerrado';
  return 'disponivel';
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const QK = (trilhaId: string) => ['trilha-progress', trilhaId] as const;
const QK_ALL = ['trilha-progress', 'all'] as const;

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function getCurrentUserOrgId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data?.organization_id ?? null;
}

/**
 * Progresso do usuário logado em uma trilha específica.
 * Persistido em `course_item_progress` (RLS: user_id = auth.uid()).
 */
export function useTrilhaProgress(trilhaId: string) {
  const qc = useQueryClient();

  const query = useQuery<Set<string>>({
    queryKey: QK(trilhaId),
    enabled:  !!trilhaId,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return new Set();
      const { data, error } = await supabase
        .from('course_item_progress')
        .select('item_id')
        .eq('user_id', userId)
        .eq('course_id', trilhaId);
      if (error) throw error;
      return new Set((data ?? []).map(r => r.item_id as string));
    },
    staleTime: 30_000,
  });

  const completed = query.data ?? new Set<string>();

  const setLocal = (mutator: (s: Set<string>) => Set<string>) => {
    qc.setQueryData<Set<string>>(QK(trilhaId), prev => mutator(prev ?? new Set()));
    // Atualiza cache da listagem (Map<courseId, Set<itemId>>)
    qc.setQueryData<Map<string, Set<string>>>(QK_ALL, prev => {
      const next: Map<string, Set<string>> = new Map(prev ?? new Map<string, Set<string>>());
      const cur  = new Set<string>(next.get(trilhaId) ?? []);
      const updated = mutator(cur);
      next.set(trilhaId, updated);
      return next;
    });
  };

  const markMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Não autenticado');
      const orgId = await getCurrentUserOrgId(userId);
      if (!orgId) throw new Error('Organização não encontrada');

      const { error } = await supabase
        .from('course_item_progress')
        .upsert(
          { user_id: userId, organization_id: orgId, course_id: trilhaId, item_id: itemId },
          { onConflict: 'user_id,item_id' },
        );
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QK(trilhaId) });
      const prev = qc.getQueryData<Set<string>>(QK(trilhaId));
      setLocal(s => { const n = new Set(s); n.add(itemId); return n; });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK(trilhaId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK(trilhaId) });
      qc.invalidateQueries({ queryKey: QK_ALL });
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('course_item_progress')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QK(trilhaId) });
      const prev = qc.getQueryData<Set<string>>(QK(trilhaId));
      setLocal(s => { const n = new Set(s); n.delete(itemId); return n; });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK(trilhaId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK(trilhaId) });
      qc.invalidateQueries({ queryKey: QK_ALL });
    },
  });

  const markComplete   = (itemId: string) => { if (!completed.has(itemId))  markMutation.mutate(itemId); };
  const unmarkComplete = (itemId: string) => { if (completed.has(itemId))   unmarkMutation.mutate(itemId); };
  const toggleComplete = (itemId: string) => {
    if (completed.has(itemId)) unmarkMutation.mutate(itemId);
    else                       markMutation.mutate(itemId);
  };

  return {
    isOverridden: (id: string) => completed.has(id),
    isLoading:    query.isLoading,
    markComplete,
    unmarkComplete,
    toggleComplete,
  };
}

/**
 * Progresso do usuário em TODOS os cursos. Útil para a listagem,
 * onde uma única query alimenta os cards de todas as trilhas.
 */
export function useAllUserProgress() {
  return useQuery<Map<string, Set<string>>>({
    queryKey: QK_ALL,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return new Map();
      const { data, error } = await supabase
        .from('course_item_progress')
        .select('course_id, item_id')
        .eq('user_id', userId);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      (data ?? []).forEach(r => {
        const set = map.get(r.course_id as string) ?? new Set<string>();
        set.add(r.item_id as string);
        map.set(r.course_id as string, set);
      });
      return map;
    },
    staleTime: 30_000,
  });
}

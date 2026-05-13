'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const QK = ['estojo_notes'] as const;

export function useEstojoNotes() {
  const supabase    = createClient();
  const queryClient = useQueryClient();

  const { data: notes = {} } = useQuery<Record<string, string>>({
    queryKey: QK,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};

      const { data, error } = await supabase
        .from('estojo_notes')
        .select('item_id, note')
        .eq('user_id', session.user.id);

      if (error) throw error;

      return Object.fromEntries((data ?? []).map(r => [r.item_id, r.note]));
    },
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');

      if (text.trim()) {
        const { error } = await supabase.from('estojo_notes').upsert(
          { user_id: session.user.id, item_id: itemId, note: text.trim(), updated_at: new Date().toISOString() },
          { onConflict: 'user_id,item_id' },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('estojo_notes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('item_id', itemId);
        if (error) throw error;
      }
    },
    onMutate: async ({ itemId, text }) => {
      await queryClient.cancelQueries({ queryKey: QK });
      const previous = queryClient.getQueryData<Record<string, string>>(QK);
      queryClient.setQueryData<Record<string, string>>(QK, prev => {
        const next = { ...(prev ?? {}) };
        if (text.trim()) next[itemId] = text.trim();
        else delete next[itemId];
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(QK, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK });
    },
  });

  const setNote = useCallback((itemId: string, text: string) => {
    mutation.mutate({ itemId, text });
  }, [mutation]);

  return { notes, setNote };
}

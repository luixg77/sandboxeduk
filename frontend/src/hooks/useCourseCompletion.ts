'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface CourseCompletion {
  id:           string;
  user_id:      string;
  course_id:    string;
  rating:       number;
  feedback:     string | null;
  finished_at:  string;
}

const QK = (courseId: string) => ['course-completion', courseId] as const;
const QK_ALL = ['course-completion', 'all'] as const;

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

/** Finalização do curso pelo usuário logado. */
export function useCourseCompletion(courseId: string) {
  const qc = useQueryClient();

  const query = useQuery<CourseCompletion | null>({
    queryKey: QK(courseId),
    enabled:  !!courseId,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return null;
      const { data, error } = await supabase
        .from('course_completions')
        .select('id, user_id, course_id, rating, feedback, finished_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error) throw error;
      return (data as CourseCompletion | null) ?? null;
    },
    staleTime: 60_000,
  });

  const finalize = useMutation({
    mutationFn: async ({ rating, feedback }: { rating: number; feedback?: string }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Não autenticado');
      const orgId = await getCurrentUserOrgId(userId);
      if (!orgId) throw new Error('Organização não encontrada');

      const { data, error } = await supabase
        .from('course_completions')
        .insert({
          user_id:         userId,
          organization_id: orgId,
          course_id:       courseId,
          rating,
          feedback:        feedback?.trim() || null,
        })
        .select('id, user_id, course_id, rating, feedback, finished_at')
        .single();
      if (error) throw error;
      return data as CourseCompletion;
    },
    onSuccess: (data) => {
      qc.setQueryData<CourseCompletion | null>(QK(courseId), data);
      qc.invalidateQueries({ queryKey: QK_ALL });
    },
  });

  return {
    completion: query.data ?? null,
    isLoading:  query.isLoading,
    isFinalized: !!query.data,
    finalize:   finalize.mutateAsync,
    isFinalizing: finalize.isPending,
    error:      finalize.error,
  };
}

/** Mapa courseId → completion para a listagem. */
export function useAllCourseCompletions() {
  return useQuery<Map<string, CourseCompletion>>({
    queryKey: QK_ALL,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return new Map();
      const { data, error } = await supabase
        .from('course_completions')
        .select('id, user_id, course_id, rating, feedback, finished_at')
        .eq('user_id', userId);
      if (error) throw error;
      const map = new Map<string, CourseCompletion>();
      (data ?? []).forEach(c => map.set(c.course_id as string, c as CourseCompletion));
      return map;
    },
    staleTime: 60_000,
  });
}

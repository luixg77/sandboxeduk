import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type EssayDifficulty = 'Fácil' | 'Média' | 'Difícil';
export type EssayStatus = 'Rascunho' | 'Publicado';

export interface EssayPrompt {
  id: string;
  organization_id: string;
  internal_name: string;
  title: string;
  description: string | null;
  instructions: string | null;
  cover_image_url: string | null;
  file_url: string | null;
  difficulty_level: EssayDifficulty;
  category: string | null;
  status: EssayStatus;
  created_at: string;
  updated_at: string;
}

export interface UseEssayPromptsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  difficulty?: string;
  status?: string;
}

export function useEssayPrompts(options: UseEssayPromptsOptions = {}) {
  const { page = 1, pageSize = 20, search, category, difficulty, status } = options;

  return useQuery({
    queryKey: ['essay_prompts', page, pageSize, search, category, difficulty, status],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('essay_prompts')
        .select('*', { count: 'exact' });

      // Filtros
      if (status) {
        query = query.eq('status', status);
      }
      if (difficulty) {
        query = query.eq('difficulty_level', difficulty);
      }
      if (category && category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,internal_name.ilike.%${search}%`);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data as EssayPrompt[],
        count: count || 0,
        pageCount: Math.ceil((count || 0) / pageSize)
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateEssayPrompt() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: Partial<EssayPrompt>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Descobrir a organização do usuário logado
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      const payload = {
        ...data,
        organization_id: profile.organization_id,
        created_by: user.user.id
      };

      const { data: created, error } = await supabase
        .from('essay_prompts')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay_prompts'] });
    },
  });
}

export function useUpdateEssayPrompt() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EssayPrompt> }) => {
      const { data: updated, error } = await supabase
        .from('essay_prompts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay_prompts'] });
    },
  });
}

export function useDeleteEssayPrompt() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('essay_prompts')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay_prompts'] });
    },
  });
}

export function useEssayCategories() {
  return useQuery({
    queryKey: ['essay_categories'],
    queryFn: async () => {
      const supabase = createClient();
      // To get unique categories, we'll fetch all non-null categories and distinct them in code
      // since Supabase JS client doesn't have a direct distinct method.
      const { data, error } = await supabase
        .from('essay_prompts')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        throw new Error(error.message);
      }

      const categories = new Set(data.map(item => item.category).filter(Boolean));
      return Array.from(categories).sort();
    },
  });
}

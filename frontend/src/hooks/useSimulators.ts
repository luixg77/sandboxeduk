import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Simulator {
  id: string;
  organization_id: string;
  title: string;
  knowledge_area: string | null;
  classification: string | null;
  topics: string | null;
  learning_objectives: string | null;
  system_requirements: string | null;
  iframe_url: string;
  source: string | null;
  thumbnail_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type SortOrder = 'newest' | 'oldest';

export interface UseSimulatorsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  knowledgeArea?: string;
  source?: string;
  status?: string;
  sortOrder?: SortOrder;
}

export function useSimulators(options: UseSimulatorsOptions = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    knowledgeArea,
    source,
    status = 'active',
    sortOrder = 'newest',
  } = options;

  return useQuery({
    queryKey: ['simulators', page, pageSize, search, knowledgeArea, source, status, sortOrder],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('simulators')
        .select('*', { count: 'exact' });

      // Filtros
      if (status) {
        query = query.eq('status', status);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,topics.ilike.%${search}%,learning_objectives.ilike.%${search}%`);
      }
      
      if (knowledgeArea && knowledgeArea !== 'all') {
        query = query.ilike('knowledge_area', `%${knowledgeArea}%`);
      }

      if (source && source !== 'all') {
        query = query.ilike('source', `%${source}%`);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to).order('created_at', { ascending: sortOrder === 'oldest' });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data as Simulator[],
        count: count || 0,
        pageCount: Math.ceil((count || 0) / pageSize)
      };
    },
    placeholderData: keepPreviousData,
  });
}

/** Buscar áreas de conhecimento distintas para filtro lateral */
export function useSimulatorKnowledgeAreas() {
  return useQuery({
    queryKey: ['simulator_knowledge_areas'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('simulators')
        .select('knowledge_area')
        .not('knowledge_area', 'is', null)
        .order('knowledge_area');

      if (error) throw new Error(error.message);

      // Retorna áreas únicas
      const unique = Array.from(new Set((data || []).map(d => d.knowledge_area).filter(Boolean))) as string[];
      return unique;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** Buscar fontes distintas para filtro lateral */
export function useSimulatorSources() {
  return useQuery({
    queryKey: ['simulator_sources'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('simulators')
        .select('source')
        .not('source', 'is', null)
        .order('source');

      if (error) throw new Error(error.message);

      const unique = Array.from(new Set((data || []).map(d => d.source).filter(Boolean))) as string[];
      return unique;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSimulator() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: Partial<Simulator>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      const payload = {
        ...data,
        organization_id: profile.organization_id,
      };

      const { data: created, error } = await supabase
        .from('simulators')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulators'] });
    },
  });
}

export function useUpdateSimulator() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Simulator> }) => {
      const { data: updated, error } = await supabase
        .from('simulators')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulators'] });
    },
  });
}

/** Soft-delete: marca status = 'inactive' */
export function useInactivateSimulator() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulators')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulators'] });
    },
  });
}

/** Reativar: marca status = 'active' */
export function useActivateSimulator() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulators')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulators'] });
    },
  });
}

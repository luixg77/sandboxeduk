'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Question,
  QuestionFilters,
  CreateQuestionPayload,
  AlternativePayload,
} from '@/types/question.types';
import type {
  VideoLesson,
  VideoLessonFilters,
  CreateVideoLessonPayload,
} from '@/types/video.types';
import type {
  AudioLesson,
  AudioLessonFilters,
  AudioLessonType,
  CreateAudioLessonPayload,
} from '@/types/audio.types';

/**
 * Helper to fetch the current user's organization_id from their DB profile 
 * (or user_metadata if it was injected into the JWT).
 */
async function getOrganizationId(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const jwtOrgId = session.user.user_metadata?.organization_id || session.user.app_metadata?.organization_id;
  if (jwtOrgId) return jwtOrgId;

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();

  if (!profile?.organization_id) throw new Error('Organization ID is missing for this user.');
  return profile.organization_id;
}

function getRange(page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

// ─────────────────────────────────────────────────────────────────────────────
// USE ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function useOrganizations(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'organizations', page, limit],
    queryFn: async () => {
      const { from, to } = getRange(page, limit);
      const { data, error, count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('name')
        .range(from, to);
        
        if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE CURRENT ORGANIZATION (WHITE-LABEL HOOK)
// ─────────────────────────────────────────────────────────────────────────────
export function useCurrentOrganization() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'current_organization'],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
        
      if (error) throw error;
      return data;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE TENANTS
// ─────────────────────────────────────────────────────────────────────────────
export function useTenants(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'tenants', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('tenants')
        .select('*, schools(count), users(count), projects(id, name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE SCHOOLS
// ─────────────────────────────────────────────────────────────────────────────
export function useSchools(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'schools', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('schools')
        .select('*, tenants(name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

export function useSchoolById(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'school', id],
    queryFn: async () => {
      if (id === 'novo' || id === 'nova') return null; // Aborta query para tela de criação vazia
      await getOrganizationId(supabase); // Apenas valida sessão 
      
      const { data, error } = await supabase
        .from('schools')
        .select('*, tenants(name)')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== 'novo' && id !== 'nova'
  });
}

export function useClassesBySchoolId(schoolId: string, page = 1, limit = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'classes_by_school', schoolId, page, limit],
    queryFn: async () => {
      if (!schoolId || schoolId === 'novo' || schoolId === 'nova') return { data: [], count: 0 };
      await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*, grades(name)', { count: 'exact' })
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!schoolId && schoolId !== 'novo' && schoolId !== 'nova'
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE DISCIPLINES (BNCC)
// ─────────────────────────────────────────────────────────────────────────────
export function useDisciplines(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'disciplines', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('disciplines')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE SUBJECTS (Conteúdos das Disciplinas)
// ─────────────────────────────────────────────────────────────────────────────
export function useSubjects(disciplineId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'subjects', disciplineId],
    queryFn: async () => {
      if (!disciplineId || disciplineId === '') return [];
      
      const orgId = await getOrganizationId(supabase);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('organization_id', orgId)
        .eq('discipline_id', disciplineId)
        .is('deleted_at', null)
        .order('name');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!disciplineId && disciplineId !== '',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
export function useProjects(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'projects', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('projects')
        .select('*, tenants(name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE USERS
// ─────────────────────────────────────────────────────────────────────────────
export function useUsers(page = 1, limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*, schools(name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE EDUCATION STAGES
// ─────────────────────────────────────────────────────────────────────────────
export function useEducationStages(page = 1, limit = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'education_stages', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('education_stages')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE GRADES
// ─────────────────────────────────────────────────────────────────────────────
export function useGrades(page = 1, limit = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'grades', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('grades')
        .select('*, education_stages(name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USE CLASSES
// ─────────────────────────────────────────────────────────────────────────────
export function useClasses(page = 1, limit = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'classes', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      
      const { data, error, count } = await supabase
        .from('classes')
        .select('*, grades(name), schools(name)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('name')
        .range(from, to);
        
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateRecord(table: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      // Fix 400 Bad Request: Do not inject 'organization_id' on 'organizations' root table
      let finalPayload = payload;
      
      if (table !== 'organizations') {
        const orgId = await getOrganizationId(supabase);
        finalPayload = { ...payload, organization_id: orgId };
      }

      const { data, error } = await supabase.from(table).insert(finalPayload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
    }
  });
}

export function useUpdateRecord(table: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
    }
  });
}

export function useDeleteRecord(table: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft Delete: Only updates deleted_at timestamp
      // Clean payload to ensure ONLY deleted_at is sent
      const { data, error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// USE INACTIVATE QUESTION (SOFT DELETE DOMAIN)
// ─────────────────────────────────────────────────────────────
export function useInactivateQuestion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('questions')
        .update({ status: 'inactive' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// USE ACTIVATE QUESTION (RESTORE)
// ─────────────────────────────────────────────────────────────
export function useActivateQuestion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('questions')
        .update({ status: 'active' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    }
  });
}

// =============================================================
// QUESTION BANK
// =============================================================

// ─────────────────────────────────────────────────────────────
// USE QUESTIONS — paginated list with server-side filters
// ─────────────────────────────────────────────────────────────
export type SortOrder = 'newest' | 'oldest';

export function useQuestions(
  filters: Partial<QuestionFilters> = {},
  page = 1,
  limit = 20,
  sortOrder: SortOrder = 'newest',
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'questions', filters, page, limit, sortOrder],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);

      let query = supabase
        .from('questions')
        .select(
          `*,
          disciplines(id, name, color_hex),
          subjects(id, name),
          education_stages(id, name),
          grades(id, name),
          bncc_skills(id, code, description),
          question_alternatives(id, letter, text, is_correct, image_url, deleted_at)`,
          { count: 'exact' },
        )
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: sortOrder === 'oldest' })
        .range(from, to);

      if (filters.keyword)       query = query.ilike('statement', `%${filters.keyword}%`);
      
      if (filters.discipline_id) {
        if (filters.discipline_id === 'null') {
          query = query.is('discipline_id', null);
        } else {
          query = query.eq('discipline_id', filters.discipline_id);
        }
      }
      
      if (filters.subject_id) {
        if (filters.subject_id === 'null') {
          query = query.is('subject_id', null);
        } else {
          query = query.eq('subject_id', filters.subject_id);
        }
      }

      if (filters.year)          query = query.eq('year', Number(filters.year));
      if (filters.difficulty)    query = query.eq('difficulty', filters.difficulty);
      if (filters.type)          query = query.eq('type', filters.type);
      if (filters.origin)        query = query.eq('origin', filters.origin);
      if (filters.stage_id)      query = query.eq('stage_id', filters.stage_id);
      if (filters.grade_id)      query = query.eq('grade_id', filters.grade_id);
      if (filters.created_by)    query = query.eq('created_by', filters.created_by);
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.neq('status', 'inactive');
      }

      if (filters.ids && filters.ids.length > 0) {
        query = query.in('id', filters.ids);
      } else if (filters.ids && filters.ids.length === 0) {
        // Se a lista de ids for forçada como vazia, não retorne nada.
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); 
      }

      try {
        const { data, error, count } = await query;
        if (error) {
          console.error("Erro detalhado:", error);
          throw error;
        }

        const normalized = (data || []).map((q) => ({
          ...q,
          question_alternatives: (q.question_alternatives || [])
            .filter((a: { deleted_at: string | null }) => !a.deleted_at)
            .sort((a: { letter: string }, b: { letter: string }) =>
              a.letter.localeCompare(b.letter),
            ),
        })) as Question[];

        return { data: normalized, count: count || 0 };
      } catch (err) {
        console.error("Erro na requisição supabase:", err);
        throw err;
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE BNCC SKILLS — reference table, no org filter needed
// ─────────────────────────────────────────────────────────────
export function useBnccSkills() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['bncc_skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bncc_skills')
        .select('id, code, description')
        .is('deleted_at', null)
        .order('code')
        .limit(500);
      if (error) throw error;
      return (data || []) as { id: string; code: string; description: string }[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ─────────────────────────────────────────────────────────────
// HABILIDADES CRUD
// ─────────────────────────────────────────────────────────────
export function useHabilidades(filters: { keyword?: string; disciplina?: string; objeto_conhecimento?: string; etapa?: string } = {}, page = 1, limit = 50) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'habilidades', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      let q = supabase
        .from('bncc_skills')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('code');
      if (filters.keyword) q = q.or(`code.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      if (filters.disciplina) q = q.eq('disciplina', filters.disciplina);
      if (filters.objeto_conhecimento) q = q.ilike('objeto_conhecimento', `%${filters.objeto_conhecimento}%`);
      if (filters.etapa) q = q.ilike('code', `${filters.etapa}%`);
      const { data, error, count } = await q.range(from, to);
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });
}

export function useCreateHabilidade() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (payload: { code: string; description: string; disciplina?: string; objeto_conhecimento?: string }) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase.from('bncc_skills').insert({ ...payload, organization_id: orgId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'habilidades'] }); queryClient.invalidateQueries({ queryKey: ['bncc_skills'] }); },
  });
}

export function useUpdateHabilidade() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<{ code: string; description: string; disciplina: string; objeto_conhecimento: string }> }) => {
      const { data, error } = await supabase.from('bncc_skills').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'habilidades'] }); queryClient.invalidateQueries({ queryKey: ['bncc_skills'] }); },
  });
}

export function useDeleteHabilidade() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bncc_skills').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'habilidades'] }); queryClient.invalidateQueries({ queryKey: ['bncc_skills'] }); },
  });
}

export function useImportHabilidades() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (rows: { code: string; description: string; disciplina: string; objeto_conhecimento: string }[]) => {
      const orgId = await getOrganizationId(supabase);
      // Deduplicate by (code + description) to avoid inserting identical rows twice
      const seen = new Set<string>();
      const deduped = rows.filter(r => {
        const key = `${r.code}||${r.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(r => ({ ...r, organization_id: orgId }));

      let inserted = 0;
      for (let i = 0; i < deduped.length; i += 100) {
        const batch = deduped.slice(i, i + 100);
        const { error } = await supabase.from('bncc_skills').insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }
      return inserted;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'habilidades'] }); queryClient.invalidateQueries({ queryKey: ['bncc_skills'] }); },
  });
}

// ─────────────────────────────────────────────────────────────
// USE CREATE QUESTION — inserts question + alternatives
// ─────────────────────────────────────────────────────────────
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      question,
      alternatives,
    }: {
      question: CreateQuestionPayload;
      alternatives?: AlternativePayload[];
    }) => {
      const orgId = await getOrganizationId(supabase);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const { data: newQuestion, error: qError } = await supabase
        .from('questions')
        .insert({ ...question, organization_id: orgId, created_by: session.user.id })
        .select()
        .single();

      if (qError) throw qError;

      const validAlts = (alternatives || []).filter((a) => a.text.trim());
      if (validAlts.length && newQuestion) {
        const { error: altError } = await supabase
          .from('question_alternatives')
          .insert(validAlts.map((a) => ({ ...a, question_id: newQuestion.id, organization_id: orgId })));
        if (altError) throw altError;
      }

      return newQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE UPDATE QUESTION — updates question + replaces alternatives
// ─────────────────────────────────────────────────────────────
export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      question,
      alternatives,
    }: {
      id: string;
      question: Partial<CreateQuestionPayload>;
      alternatives?: AlternativePayload[];
    }) => {
      // Sanitize payload: strip relational objects and auto-managed fields
      const { 
        disciplines, 
        subjects,
        education_stages, 
        grades, 
        bncc_skills, 
        question_alternatives,
        created_at,
        updated_at,
        created_by,
        organization_id, // prevent changing org_id on update
        id: _id, // strip id from payload
        ...cleanQuestion 
      } = question as any;

      const orgId = (question as any).organization_id || await getOrganizationId(supabase);

      const { data: updated, error: qError } = await supabase
        .from('questions')
        .update(cleanQuestion)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (qError) {
        throw qError;
      }

      if (alternatives !== undefined) {
        const orgId = (question as any).organization_id || await getOrganizationId(supabase);
        
        const { error: deleteError } = await supabase
          .from('question_alternatives')
          .update({ 
            deleted_at: new Date().toISOString(),
            organization_id: orgId // Force org_id in payload for RLS stability
          })
          .eq('question_id', id)
          .is('deleted_at', null);

        if (deleteError) {
          throw deleteError;
        }

        const validAlts = alternatives.filter((a) => a.text.trim());
        if (validAlts.length) {
          const { error: altError } = await supabase
            .from('question_alternatives')
            .insert(validAlts.map((a) => ({ ...a, question_id: id, organization_id: orgId })));
          
          if (altError) {
            throw altError;
          }
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE DELETE QUESTION — soft deletes questions and their alternatives
// Segue o MESMO padrão do useUpdateQuestion:
//   - NÃO envia organization_id no payload (evita WITH CHECK do RLS)
//   - Usa .eq('organization_id', orgId) como filtro de escopo
// ─────────────────────────────────────────────────────────────
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);


      const deletedAt = new Date().toISOString();

      // 1. Soft-delete alternativas (mesmo padrão: org_id só no filtro, não no payload)
      const { error: altError } = await supabase
        .from('question_alternatives')
        .update({ deleted_at: deletedAt })
        .eq('question_id', id)
        .eq('organization_id', orgId)
        .is('deleted_at', null);

      if (altError) {
        throw altError;
      }

      // 2. Soft-delete questão principal (mesmo padrão do useUpdateQuestion)
      //    - Payload contém APENAS deleted_at (não toca em organization_id)
      //    - .eq() filtra por id e org para escopo multi-tenant
      const { error: qError } = await supabase
        .from('questions')
        .update({ deleted_at: deletedAt })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (qError) {
        throw qError;
      }

      return { id, deleted_at: deletedAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });
}

// =============================================================
// VIDEO LESSONS
// =============================================================

const VIDEO_COLUMNS = `
  id, organization_id,
  title, description, thumbnail_url,
  discipline_id, grade_id, subject,
  source_type, video_url, duration, views,
  origin, status, created_by,
  created_at, updated_at, deleted_at,
  course_id, course:courses(id, title),
  disciplines(id, name, color_hex),
  grades(id, name),
  video_lesson_projects(project_id, projects(id, name))
`;

// ─────────────────────────────────────────────────────────────
// USE VIDEO LESSONS — paginated list with server-side filters
// ─────────────────────────────────────────────────────────────
export function useVideoLessons(
  filters: Partial<VideoLessonFilters> = {},
  page = 1,
  limit = 20,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'video_lessons', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);

      let query = supabase
        .from('video_lessons')
        .select(VIDEO_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.keyword)       query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      if (filters.discipline_id) query = query.eq('discipline_id', filters.discipline_id);
      if (filters.grade_id)      query = query.eq('grade_id', filters.grade_id);
      if (filters.status)        query = query.eq('status', filters.status);
      if (filters.origin)        query = query.eq('origin', filters.origin);

      // Filter by project via junction table
      if (filters.project_id) {
        const { data: links } = await supabase
          .from('video_lesson_projects')
          .select('video_lesson_id')
          .eq('project_id', filters.project_id);
        const ids = (links || []).map((l: { video_lesson_id: string }) => l.video_lesson_id);
        query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: (data || []) as unknown as VideoLesson[], count: count || 0 };
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE CREATE VIDEO LESSON
// ─────────────────────────────────────────────────────────────
export function useCreateVideoLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (payload: CreateVideoLessonPayload) => {
      const orgId = await getOrganizationId(supabase);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const { project_ids, ...videoPayload } = payload;

      const { data, error } = await supabase
        .from('video_lessons')
        .insert({ ...videoPayload, organization_id: orgId, created_by: session.user.id })
        .select('id')
        .single();

      if (error) throw error;

      // Sync project associations
      if (project_ids && project_ids.length > 0) {
        await supabase
          .from('video_lesson_projects')
          .insert(project_ids.map((pid) => ({ video_lesson_id: (data as { id: string }).id, project_id: pid })));
      }

      const { data: full } = await supabase
        .from('video_lessons')
        .select(VIDEO_COLUMNS)
        .eq('id', (data as { id: string }).id)
        .single();

      return full as unknown as VideoLesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'video_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE UPDATE VIDEO LESSON
// ─────────────────────────────────────────────────────────────
export function useUpdateVideoLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateVideoLessonPayload>;
    }) => {
      const orgId = await getOrganizationId(supabase);
      const { project_ids, ...videoPayload } = payload;

      const { error } = await supabase
        .from('video_lessons')
        .update({ ...videoPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      // Replace project associations if provided
      if (project_ids !== undefined) {
        await supabase.from('video_lesson_projects').delete().eq('video_lesson_id', id);
        if (project_ids.length > 0) {
          await supabase
            .from('video_lesson_projects')
            .insert(project_ids.map((pid) => ({ video_lesson_id: id, project_id: pid })));
        }
      }

      const { data: full } = await supabase
        .from('video_lessons')
        .select(VIDEO_COLUMNS)
        .eq('id', id)
        .single();

      return full as unknown as VideoLesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'video_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE INACTIVATE VIDEO LESSON (status → inactive)
// ─────────────────────────────────────────────────────────────
export function useInactivateVideoLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('video_lessons')
        .update({ status: 'inactive' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'video_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE ACTIVATE VIDEO LESSON (status → active)
// ─────────────────────────────────────────────────────────────
export function useActivateVideoLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('video_lessons')
        .update({ status: 'active' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'video_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE DELETE VIDEO LESSON — soft delete (deleted_at)
// ─────────────────────────────────────────────────────────────
export function useDeleteVideoLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { error } = await supabase
        .from('video_lessons')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId)
        .is('deleted_at', null);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'video_lessons'] });
    },
  });
}

// =============================================================
// AUDIO LESSONS
// =============================================================

const AUDIO_COLUMNS = `
  id, organization_id,
  title, description, thumbnail_url,
  discipline_id, grade_id, subject,
  source_type, audio_url, duration, plays,
  origin, status, created_by,
  created_at, updated_at, deleted_at,
  course_id, course:courses(id, title),
  disciplines(id, name, color_hex),
  grades(id, name),
  audio_lesson_projects(project_id, projects(id, name)),
  audio_lesson_type_links(type_id, audio_lesson_types(id, name))
`;

// ─────────────────────────────────────────────────────────────
// USE AUDIO LESSONS — paginated list with server-side filters
// ─────────────────────────────────────────────────────────────
export function useAudioLessons(
  filters: Partial<AudioLessonFilters> = {},
  page = 1,
  limit = 20,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'audio_lessons', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);

      let query = supabase
        .from('audio_lessons')
        .select(AUDIO_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.keyword)       query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      if (filters.discipline_id) query = query.eq('discipline_id', filters.discipline_id);
      if (filters.grade_id)      query = query.eq('grade_id', filters.grade_id);
      if (filters.status)        query = query.eq('status', filters.status);
      if (filters.origin)        query = query.eq('origin', filters.origin);
      if (filters.type_id) {
        const { data: typeLinks } = await supabase
          .from('audio_lesson_type_links')
          .select('audio_lesson_id')
          .eq('type_id', filters.type_id);
        const ids = (typeLinks || []).map((l: { audio_lesson_id: string }) => l.audio_lesson_id);
        query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      }

      if (filters.project_id) {
        const { data: links } = await supabase
          .from('audio_lesson_projects')
          .select('audio_lesson_id')
          .eq('project_id', filters.project_id);
        const ids = (links || []).map((l: { audio_lesson_id: string }) => l.audio_lesson_id);
        query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: (data || []) as unknown as AudioLesson[], count: count || 0 };
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE CREATE AUDIO LESSON
// ─────────────────────────────────────────────────────────────
export function useCreateAudioLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (payload: CreateAudioLessonPayload) => {
      const orgId = await getOrganizationId(supabase);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const { project_ids, type_ids, ...audioPayload } = payload;

      const { data, error } = await supabase
        .from('audio_lessons')
        .insert({ ...audioPayload, organization_id: orgId, created_by: session.user.id })
        .select('id')
        .single();

      if (error) throw error;

      const lessonId = (data as { id: string }).id;

      if (type_ids && type_ids.length > 0) {
        await supabase
          .from('audio_lesson_type_links')
          .insert(type_ids.map((tid) => ({ audio_lesson_id: lessonId, type_id: tid })));
      }

      if (project_ids && project_ids.length > 0) {
        await supabase
          .from('audio_lesson_projects')
          .insert(project_ids.map((pid) => ({ audio_lesson_id: lessonId, project_id: pid })));
      }

      const { data: full } = await supabase
        .from('audio_lessons')
        .select(AUDIO_COLUMNS)
        .eq('id', (data as { id: string }).id)
        .single();

      return full as unknown as AudioLesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE UPDATE AUDIO LESSON
// ─────────────────────────────────────────────────────────────
export function useUpdateAudioLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateAudioLessonPayload> }) => {
      const orgId = await getOrganizationId(supabase);
      const { project_ids, type_ids, ...audioPayload } = payload;

      const { error } = await supabase
        .from('audio_lessons')
        .update({ ...audioPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      if (type_ids !== undefined) {
        await supabase.from('audio_lesson_type_links').delete().eq('audio_lesson_id', id);
        if (type_ids.length > 0) {
          await supabase
            .from('audio_lesson_type_links')
            .insert(type_ids.map((tid) => ({ audio_lesson_id: id, type_id: tid })));
        }
      }

      if (project_ids !== undefined) {
        await supabase.from('audio_lesson_projects').delete().eq('audio_lesson_id', id);
        if (project_ids.length > 0) {
          await supabase
            .from('audio_lesson_projects')
            .insert(project_ids.map((pid) => ({ audio_lesson_id: id, project_id: pid })));
        }
      }

      const { data: full } = await supabase
        .from('audio_lessons')
        .select(AUDIO_COLUMNS)
        .eq('id', id)
        .single();

      return full as unknown as AudioLesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE INACTIVATE AUDIO LESSON
// ─────────────────────────────────────────────────────────────
export function useInactivateAudioLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('audio_lessons')
        .update({ status: 'inactive' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE ACTIVATE AUDIO LESSON
// ─────────────────────────────────────────────────────────────
export function useActivateAudioLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('audio_lessons')
        .update({ status: 'active' })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE DELETE AUDIO LESSON — soft delete
// ─────────────────────────────────────────────────────────────
export function useDeleteAudioLesson() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = await getOrganizationId(supabase);
      const { error } = await supabase
        .from('audio_lessons')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId)
        .is('deleted_at', null);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lessons'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE AUDIO LESSON TYPES — list all available types (system + org)
// ─────────────────────────────────────────────────────────────
export function useAudioLessonTypes() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'audio_lesson_types'],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);

      const { data, error } = await supabase
        .from('audio_lesson_types')
        .select('id, name, organization_id, created_at')
        .or(`organization_id.is.null,organization_id.eq.${orgId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AudioLessonType[];
    },
  });
}

// ─────────────────────────────────────────────────────────────
// USE CREATE AUDIO LESSON TYPE — create a custom type for the org
// ─────────────────────────────────────────────────────────────
export function useCreateAudioLessonType() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const orgId = await getOrganizationId(supabase);

      const { data, error } = await supabase
        .from('audio_lesson_types')
        .insert({ name: name.trim(), organization_id: orgId })
        .select('id, name, organization_id, created_at')
        .single();

      if (error) throw error;
      return data as AudioLessonType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'audio_lesson_types'] });
    },
  });
}

// =============================================================
// COURSES (EAD)
// =============================================================

export function useCourses(page = 1, limit = 20) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'courses', page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      const { data, error, count } = await supabase
        .from('courses')
        .select('*, course_disciplines(discipline_id, disciplines(id, name, color_hex)), course_grades(grade_id, grades(name)), course_projects(project_id, projects(id, name)), course_modules(id, deleted_at)', { count: 'exact' })
        .is('deleted_at', null)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    }
  });
}

export function useCourseById(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'course', id],
    queryFn: async () => {
      if (id === 'novo') return null;
      await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('courses')
        .select('*, course_disciplines(discipline_id, disciplines(id, name, color_hex)), course_grades(grade_id, grades(id, name)), course_projects(project_id, projects(id, name))')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== 'novo'
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ course, gradeIds, projectIds, disciplineIds }: { course: any; gradeIds: string[]; projectIds: string[]; disciplineIds: string[] }) => {
      const orgId = await getOrganizationId(supabase);
      const { data: { session } } = await supabase.auth.getSession();
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({ ...course, organization_id: orgId, created_by: session?.user.id })
        .select()
        .single();
      if (error) throw error;
      const cid = (newCourse as any).id;
      if (disciplineIds.length > 0) await supabase.from('course_disciplines').insert(disciplineIds.map(id => ({ course_id: cid, discipline_id: id })));
      if (gradeIds.length > 0) await supabase.from('course_grades').insert(gradeIds.map(id => ({ course_id: cid, grade_id: id })));
      if (projectIds.length > 0) await supabase.from('course_projects').insert(projectIds.map(id => ({ course_id: cid, project_id: id })));
      return newCourse;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }); }
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, course, gradeIds, projectIds, disciplineIds }: { id: string; course: any; gradeIds: string[]; projectIds: string[]; disciplineIds: string[] }) => {
      const { error } = await supabase.from('courses').update({ ...course, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await supabase.from('course_disciplines').delete().eq('course_id', id);
      if (disciplineIds.length > 0) await supabase.from('course_disciplines').insert(disciplineIds.map(did => ({ course_id: id, discipline_id: did })));
      await supabase.from('course_grades').delete().eq('course_id', id);
      if (gradeIds.length > 0) await supabase.from('course_grades').insert(gradeIds.map(gid => ({ course_id: id, grade_id: gid })));
      await supabase.from('course_projects').delete().eq('course_id', id);
      if (projectIds.length > 0) await supabase.from('course_projects').insert(projectIds.map(pid => ({ course_id: id, project_id: pid })));
      return { id };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', vars.id] });
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { id };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }); }
  });
}

// ─────────────────────────────────────────────────────────────
// COURSE MODULES
// ─────────────────────────────────────────────────────────────
export function useCourseModules(courseId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'course_modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .is('deleted_at', null)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId && courseId !== 'novo'
  });
}

export function useCreateCourseModule() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (payload: { course_id: string; title: string; description?: string; start_date?: string; end_date?: string; order_index: number }) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase.from('course_modules').insert({ ...payload, organization_id: orgId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_modules', vars.course_id] }); }
  });
}

export function useUpdateCourseModule() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, courseId, payload }: { id: string; courseId: string; payload: any }) => {
      const { data, error } = await supabase.from('course_modules').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_modules', vars.courseId] }); }
  });
}

export function useDeleteCourseModule() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase.from('course_modules').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { id, courseId };
    },
    onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_modules', result.courseId] }); }
  });
}

// ─────────────────────────────────────────────────────────────
// COURSE MODULE ITEMS (TRAIL)
// ─────────────────────────────────────────────────────────────
export function useCourseModuleItems(moduleId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'course_module_items', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_module_items')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId
  });
}

export function useAddCourseModuleItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (payload: { module_id: string; course_id: string; item_type: string; item_id: string; title: string; thumbnail_url?: string; order_index: number }) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase.from('course_module_items').insert({ ...payload, organization_id: orgId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_module_items', vars.module_id] }); }
  });
}

export function useRemoveCourseModuleItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, moduleId }: { id: string; moduleId: string }) => {
      const { error } = await supabase.from('course_module_items').delete().eq('id', id);
      if (error) throw error;
      return { id, moduleId };
    },
    onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_module_items', result.moduleId] }); }
  });
}

export function useReorderCourseModules() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ courseId, modules }: { courseId: string; modules: { id: string; order_index: number }[] }) => {
      for (const m of modules) {
        await supabase.from('course_modules').update({ order_index: m.order_index }).eq('id', m.id);
      }
      return { courseId };
    },
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_modules', r.courseId] }); }
  });
}

export function useReorderModuleItems() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ moduleId, items }: { moduleId: string; items: { id: string; order_index: number }[] }) => {
      for (const item of items) {
        await supabase.from('course_module_items').update({ order_index: item.order_index }).eq('id', item.id);
      }
      return { moduleId };
    },
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['admin', 'course_module_items', r.moduleId] }); }
  });
}

// ─────────────────────────────────────────────────────────────
// USE LESSON PLANS COUNT — total non-deleted lesson plans for org
// ─────────────────────────────────────────────────────────────
export function useLessonPlansCount() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'lesson_plans_count'],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { count, error } = await supabase
        .from('lesson_plans')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null);
      if (error) return 0;
      return count ?? 0;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// LESSON PLANS FULL CRUD
// ─────────────────────────────────────────────────────────────
export interface LessonPlanFilters {
  search?: string;
  tipo_documento?: string;
  discipline_id?: string;
  grade_id?: string;
  status?: string;
  origin?: string;
  interactive?: boolean;
  can_download?: boolean;
  pcd_sign?: boolean;
  pcd_voice?: boolean;
  source_platform?: string;
  audience?: 'professor' | 'aluno';
}

export function useLessonPlans(filters: LessonPlanFilters = {}, page = 1, limit = 24) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'lesson_plans', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      let q = supabase
        .from('lesson_plans')
        .select('*, course:courses(id, title)', { count: 'exact' })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('is_mapa_mental', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.search)         q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,keywords.ilike.%${filters.search}%,disciplina.ilike.%${filters.search}%`);
      if (filters.tipo_documento) q = q.eq('tipo_documento', filters.tipo_documento);
      if (filters.discipline_id)  q = q.eq('discipline_id', filters.discipline_id);
      if (filters.grade_id)       q = q.eq('grade_id', filters.grade_id);
      if (filters.status)         q = q.eq('status', filters.status);
      if (filters.origin)         q = q.eq('origin', filters.origin);
      if (filters.interactive !== undefined)  q = q.eq('interactive', filters.interactive);
      if (filters.can_download !== undefined) q = q.eq('can_download', filters.can_download);
      if (filters.pcd_sign !== undefined)     q = q.eq('pcd_sign', filters.pcd_sign);
      if (filters.pcd_voice !== undefined)    q = q.eq('pcd_voice', filters.pcd_voice);
      if (filters.source_platform)            q = q.eq('source_platform', filters.source_platform);
      if (filters.audience === 'aluno')      q = q.eq('source_platform', 'evoluir_alunos');
      if (filters.audience === 'professor')  q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

export function useCreateLessonPlan() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const orgId = await getOrganizationId(supabase);
      const { data, error } = await supabase
        .from('lesson_plans')
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'lesson_plans'] }); },
  });
}

export function useUpdateLessonPlan() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'lesson_plans'] }); },
  });
}

export function useDeleteLessonPlan() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'lesson_plans'] }); },
  });
}

export function useImportLessonPlans() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, any>[]) => {
      const orgId = await getOrganizationId(supabase);
      const withOrg = rows.map(r => ({ ...r, organization_id: orgId }));
      let inserted = 0;
      for (let i = 0; i < withOrg.length; i += 100) {
        const batch = withOrg.slice(i, i + 100);
        const { error } = await supabase.from('lesson_plans').insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }
      return { inserted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lesson_plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'lesson_plans_count'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────────────────────
export interface GameFilters {
  search?: string;
  discipline_id?: string;
  grade_id?: string;
  engine?: string;
  difficulty?: number;
  pcd_sign?: boolean;
  pcd_voice?: boolean;
  status?: string;
  project_id?: string;
}

export function useGames(filters: GameFilters = {}, page = 1, limit = 12) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'games', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      let q = supabase
        .from('games')
        .select('*, course:courses(id, title), game_projects(project_id, projects(id, name))', { count: 'exact' })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.search)        q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,keywords.ilike.%${filters.search}%,disciplina.ilike.%${filters.search}%`);
      if (filters.discipline_id) q = q.eq('discipline_id', filters.discipline_id);
      if (filters.grade_id)      q = q.eq('grade_id', filters.grade_id);
      if (filters.engine)        q = q.eq('engine', filters.engine);
      if (filters.difficulty !== undefined) q = q.eq('difficulty', filters.difficulty);
      if (filters.pcd_sign !== undefined)   q = q.eq('pcd_sign', filters.pcd_sign);
      if (filters.pcd_voice !== undefined)  q = q.eq('pcd_voice', filters.pcd_voice);
      if (filters.status)        q = q.eq('status', filters.status);
      if (filters.project_id) {
        q = (q as any).eq('game_projects.project_id', filters.project_id);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

export function useAssignGameToProject() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ gameId, projectIds }: { gameId: string; projectIds: string[] }) => {
      await supabase.from('game_projects').delete().eq('game_id', gameId);
      if (projectIds.length > 0) {
        const { error } = await supabase.from('game_projects')
          .insert(projectIds.map(pid => ({ game_id: gameId, project_id: pid })));
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'games'] }),
  });
}

// ─────────────────────────────────────────────────────────────
// BOOKS
// ─────────────────────────────────────────────────────────────
export interface BookFilters {
  search?: string;
  discipline_id?: string;
  grade_id?: string;
  status?: string;
  interactive?: boolean;
  can_download?: boolean;
  pcd_sign?: boolean;
  pcd_voice?: boolean;
  audience?: 'professor' | 'aluno';
  project_id?: string;
}

export function useBooks(filters: BookFilters = {}, page = 1, limit = 10) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['admin', 'books', filters, page, limit],
    queryFn: async () => {
      const orgId = await getOrganizationId(supabase);
      const { from, to } = getRange(page, limit);
      let q = supabase
        .from('books')
        .select('*, course:courses(id, title), book_projects(project_id, projects(id, name))', { count: 'exact' })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.search)        q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,keywords.ilike.%${filters.search}%,disciplina.ilike.%${filters.search}%`);
      if (filters.discipline_id) q = q.eq('discipline_id', filters.discipline_id);
      if (filters.grade_id)      q = q.eq('grade_id', filters.grade_id);
      if (filters.status)        q = q.eq('status', filters.status);
      if (filters.interactive !== undefined)  q = q.eq('interactive', filters.interactive);
      if (filters.can_download !== undefined) q = q.eq('can_download', filters.can_download);
      if (filters.pcd_sign !== undefined)     q = q.eq('pcd_sign', filters.pcd_sign);
      if (filters.pcd_voice !== undefined)    q = q.eq('pcd_voice', filters.pcd_voice);
      if (filters.audience === 'aluno')       q = q.eq('source_platform', 'evoluir_alunos');
      if (filters.audience === 'professor')   q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

export function useAssignBookToProject() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, projectIds }: { bookId: string; projectIds: string[] }) => {
      await supabase.from('book_projects').delete().eq('book_id', bookId);
      if (projectIds.length > 0) {
        const { error } = await supabase.from('book_projects')
          .insert(projectIds.map(pid => ({ book_id: bookId, project_id: pid })));
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'books'] }),
  });
}


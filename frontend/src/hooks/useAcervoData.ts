'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type AcervoContentType = 'livro' | 'video' | 'jogo' | 'audio' | 'plano_aula';
export type AcervoTab = 'todos' | AcervoContentType;
type CardColor = 'orange' | 'teal' | 'purple' | 'pink' | 'green' | 'blue' | 'amber';

export interface AcervoItem {
  id:           string;
  type:         AcervoContentType;
  title:        string;
  discipline?:  string;
  grade?:       string;
  description?: string;
  color:        CardColor;
  isNew?:       boolean;
  canDownload?:  boolean;
  pcdSign?:      boolean;
  pcdVoice?:     boolean;
  interactive?:  boolean;
  duration?:     string;
  views?:        number;
  plays?:        number;
  sourceType?:   'link' | 'upload';
  tipo?:         string;
  difficulty?:   string;
  engine?:       string;
  tipodoc?:      'plano_aula' | 'sequencia_didatica' | 'material_diverso';
  bnccSkill?:    string;
  thumbnailUrl?: string;
  fileUrl?:      string;
  videoUrl?:     string;
  audioUrl?:     string;
}

export interface AcervoFilters {
  activeTab:  AcervoTab;
  search:     string;
  discipline: string;
  grade:      string;
  audience:   string;
  page:       number;
}

const PAGE_LIMIT = 50;
const STALE_MS   = 1000 * 60 * 5;
const WEEK_MS    = 1000 * 60 * 60 * 24 * 7;

const COLORS: CardColor[] = ['blue', 'pink', 'green', 'amber', 'purple', 'teal', 'orange'];
const DISCIPLINE_COLORS: Record<string, CardColor> = {
  'Matemática':           'blue',
  'Português':            'pink',
  'Língua Portuguesa':    'pink',
  'Ciências':             'green',
  'Ciências da Natureza': 'green',
  'História':             'amber',
  'Geografia':            'teal',
  'Artes':                'purple',
  'Arte':                 'purple',
  'Educação Física':      'orange',
};

function colorFor(discipline?: string | null, idx = 0): CardColor {
  if (discipline && DISCIPLINE_COLORS[discipline]) return DISCIPLINE_COLORS[discipline];
  return COLORS[idx % COLORS.length];
}

function difficultyLabel(d: number | null | undefined): string | undefined {
  if (d == null) return undefined;
  if (d <= 1) return 'Fácil';
  if (d === 2) return 'Médio';
  return 'Difícil';
}

function tipodocValue(t: string | null): 'plano_aula' | 'sequencia_didatica' | 'material_diverso' {
  if (t === 'sequencia_didatica') return 'sequencia_didatica';
  if (t === 'material_diverso')   return 'material_diverso';
  return 'plano_aula';
}

function isNew(createdAt: string | null): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < WEEK_MS;
}

// ─── shared user context (session + profile + projectIds) ────────────────────
// Cached 30 min — eliminates the waterfall duplicated across hooks

interface UserContext {
  tenantId:   string;
  orgId:      string;
  projectIds: string[];
}

export function useUserContext() {
  const supabase = createClient();

  return useQuery<UserContext | null>({
    queryKey: ['user', 'context'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id, organization_id')
        .eq('id', session.user.id)
        .maybeSingle();

      const tenantId = profile?.tenant_id as string | null;
      const orgId    = profile?.organization_id as string | null;
      if (!tenantId || !orgId) return null;

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null);

      const projectIds = (projects || []).map((p: any) => p.id as string);
      return { tenantId, orgId, projectIds };
    },
    staleTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
  });
}

// ─── fetchers ────────────────────────────────────────────────────────────────

async function fetchBooks(
  supabase: any,
  projectIds: string[],
  orgId: string,
  search: string,
  discipline: string,
  grade: string,
  audience: string,
  limit: number,
  offset: number,
): Promise<{ items: AcervoItem[]; count: number }> {
  let q = supabase
    .from('books')
    .select(
      'id, title, description, disciplina, serie, can_download, pcd_sign, pcd_voice, interactive, thumbnail, file_url, created_at, book_projects!inner(project_id)',
      { count: 'exact' },
    )
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('course_id', null)
    .in('book_projects.project_id', projectIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search)                   q = q.ilike('title', `%${search}%`);
  if (discipline)               q = q.eq('disciplina', discipline);
  if (grade)                    q = q.eq('serie', grade);
  if (audience === 'professor') q = q.is('source_platform', null);
  if (audience === 'aluno')     q = q.eq('source_platform', 'evoluir_alunos');

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    count: count ?? 0,
    items: (data || []).map((b: any, i: number): AcervoItem => ({
      id:           b.id,
      type:         'livro',
      title:        b.title,
      discipline:   b.disciplina  || undefined,
      grade:        b.serie       || undefined,
      description:  b.description || undefined,
      color:        colorFor(b.disciplina, i),
      isNew:        isNew(b.created_at),
      canDownload:  b.can_download ?? undefined,
      pcdSign:      b.pcd_sign    ?? undefined,
      pcdVoice:     b.pcd_voice   ?? undefined,
      interactive:  b.interactive ?? undefined,
      thumbnailUrl: b.thumbnail   || undefined,
      fileUrl:      b.file_url    || undefined,
    })),
  };
}

async function fetchGames(
  supabase: any,
  projectIds: string[],
  orgId: string,
  search: string,
  discipline: string,
  grade: string,
  audience: string,
  limit: number,
  offset: number,
): Promise<{ items: AcervoItem[]; count: number }> {
  let q = supabase
    .from('games')
    .select(
      'id, title, description, disciplina, serie, difficulty, engine, pcd_sign, pcd_voice, created_at, game_projects!inner(project_id)',
      { count: 'exact' },
    )
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('course_id', null)
    .in('game_projects.project_id', projectIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search)                   q = q.ilike('title', `%${search}%`);
  if (discipline)               q = q.eq('disciplina', discipline);
  if (grade)                    q = q.eq('serie', grade);
  if (audience === 'professor') q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');
  if (audience === 'aluno')     q = q.eq('source_platform', 'evoluir_alunos');

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    count: count ?? 0,
    items: (data || []).map((g: any, i: number): AcervoItem => ({
      id:         g.id,
      type:       'jogo',
      title:      g.title,
      discipline: g.disciplina || undefined,
      grade:      g.serie      || undefined,
      color:      colorFor(g.disciplina, i),
      isNew:      isNew(g.created_at),
      pcdSign:    g.pcd_sign   ?? undefined,
      pcdVoice:   g.pcd_voice  ?? undefined,
      difficulty: difficultyLabel(g.difficulty),
      engine:     g.engine     || undefined,
    })),
  };
}

async function fetchVideos(
  supabase: any,
  projectIds: string[],
  search: string,
  discipline: string,
  grade: string,
  audience: string,
  limit: number,
  offset: number,
): Promise<{ items: AcervoItem[]; count: number }> {
  let q = supabase
    .from('video_lessons')
    .select(
      'id, title, description, source_type, video_url, thumbnail_url, duration, views, created_at, disciplines(name), grades(name), video_lesson_projects!inner(project_id)',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .is('course_id', null)
    .in('video_lesson_projects.project_id', projectIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search)                   q = q.ilike('title', `%${search}%`);
  if (discipline)               q = q.eq('disciplines.name', discipline);
  if (grade)                    q = q.eq('grades.name', grade);
  if (audience === 'professor') q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');
  if (audience === 'aluno')     q = q.eq('source_platform', 'evoluir_alunos');

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    count: count ?? 0,
    items: (data || []).map((v: any, i: number): AcervoItem => ({
      id:          v.id,
      type:        'video',
      title:       v.title,
      discipline:  (v.disciplines as any)?.name || undefined,
      grade:       (v.grades      as any)?.name || undefined,
      description: v.description || undefined,
      color:       colorFor((v.disciplines as any)?.name, i),
      isNew:       isNew(v.created_at),
      sourceType:   v.source_type   || undefined,
      videoUrl:     v.video_url     || undefined,
      thumbnailUrl: v.thumbnail_url || undefined,
      duration:     v.duration      || undefined,
      views:        v.views         ?? undefined,
    })),
  };
}

async function fetchAudios(
  supabase: any,
  projectIds: string[],
  search: string,
  discipline: string,
  grade: string,
  audience: string,
  limit: number,
  offset: number,
): Promise<{ items: AcervoItem[]; count: number }> {
  let q = supabase
    .from('audio_lessons')
    .select(
      'id, title, description, audio_url, duration, plays, created_at, disciplines(name), grades(name), audio_lesson_projects!inner(project_id), audio_lesson_type_links(audio_lesson_types(name))',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .is('course_id', null)
    .in('audio_lesson_projects.project_id', projectIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search)                   q = q.ilike('title', `%${search}%`);
  if (discipline)               q = q.eq('disciplines.name', discipline);
  if (grade)                    q = q.eq('grades.name', grade);
  if (audience === 'professor') q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');
  if (audience === 'aluno')     q = q.eq('source_platform', 'evoluir_alunos');

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    count: count ?? 0,
    items: (data || []).map((a: any, i: number): AcervoItem => {
      const typeLinks: any[] = a.audio_lesson_type_links || [];
      return {
        id:          a.id,
        type:        'audio',
        title:       a.title,
        discipline:  (a.disciplines as any)?.name || undefined,
        grade:       (a.grades      as any)?.name || undefined,
        description: a.description || undefined,
        color:       colorFor((a.disciplines as any)?.name, i),
        isNew:       isNew(a.created_at),
        audioUrl:    a.audio_url || undefined,
        duration:    a.duration  || undefined,
        plays:       a.plays     ?? undefined,
        tipo:        typeLinks[0]?.audio_lesson_types?.name || undefined,
      };
    }),
  };
}

async function fetchPlans(
  supabase: any,
  projectIds: string[],
  orgId: string,
  search: string,
  discipline: string,
  grade: string,
  audience: string,
  limit: number,
  offset: number,
): Promise<{ items: AcervoItem[]; count: number }> {
  let q = supabase
    .from('lesson_plans')
    .select(
      'id, title, description, disciplina, serie, tipo_documento, can_download, interactive, pcd_sign, pcd_voice, skills, thumbnail, file_url, created_at, lesson_plan_projects!inner(project_id)',
      { count: 'exact' },
    )
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('course_id', null)
    .in('lesson_plan_projects.project_id', projectIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search)                   q = q.ilike('title', `%${search}%`);
  if (discipline)               q = q.eq('disciplina', discipline);
  if (grade)                    q = q.eq('serie', grade);
  if (audience === 'professor') q = q.or('source_platform.neq.evoluir_alunos,source_platform.is.null');
  if (audience === 'aluno')     q = q.eq('source_platform', 'evoluir_alunos');

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    count: count ?? 0,
    items: (data || []).map((p: any, i: number): AcervoItem => ({
      id:           p.id,
      type:         'plano_aula',
      title:        p.title,
      discipline:   p.disciplina    || undefined,
      grade:        p.serie         || undefined,
      description:  p.description   || undefined,
      color:        colorFor(p.disciplina, i),
      isNew:        isNew(p.created_at),
      canDownload:  p.can_download  ?? undefined,
      interactive:  p.interactive   ?? undefined,
      pcdSign:      p.pcd_sign      ?? undefined,
      pcdVoice:     p.pcd_voice     ?? undefined,
      tipodoc:      tipodocValue(p.tipo_documento),
      bnccSkill:    Array.isArray(p.skills) && p.skills.length > 0 ? p.skills[0] : undefined,
      thumbnailUrl: p.thumbnail     || undefined,
      fileUrl:      p.file_url      || undefined,
    })),
  };
}

// ─── options hook — disciplines + grades from FK tables only ─────────────────

export function useAcervoOptions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['professor', 'acervo', 'options'],
    queryFn: async () => {
      // grades: FK table + texto livre de books e lesson_plans (série como string)
      const [discRows, gradeRows, booksSerie, plansSerie] = await Promise.all([
        supabase.from('disciplines').select('name, color_hex').eq('origin', 'sistema').order('name'),
        supabase.from('grades').select('name').order('name'),
        supabase.from('books').select('serie').not('serie', 'is', null).is('course_id', null).limit(200),
        supabase.from('lesson_plans').select('serie').not('serie', 'is', null).is('course_id', null).limit(200),
      ]);

      const disciplines = (discRows.data || [])
        .filter((d: any) => d.name)
        .map((d: any) => ({ name: d.name as string, color: (d.color_hex ?? '') as string }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

      const gradeSet = new Set<string>();
      (gradeRows.data   || []).forEach((g: any) => g.name  && gradeSet.add(g.name));
      (booksSerie.data  || []).forEach((b: any) => b.serie && gradeSet.add(b.serie));
      (plansSerie.data  || []).forEach((p: any) => p.serie && gradeSet.add(p.serie));
      const grades = Array.from(gradeSet).sort();

      return { disciplines, grades };
    },
    staleTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
  });
}

// ─── counts hook — uses shared useUserContext ─────────────────────────────────

export function useAcervoCounts(search: string, discipline = '', grade = '', audience = '') {
  const supabase = createClient();
  const { data: ctx } = useUserContext();

  return useQuery({
    queryKey: ['professor', 'acervo', 'counts', search, discipline, grade, audience, ctx?.tenantId],
    enabled: !!ctx,
    queryFn: async () => {
      if (!ctx || ctx.projectIds.length === 0) {
        return { livro: 0, video: 0, jogo: 0, audio: 0, plano_aula: 0 };
      }
      const { orgId, projectIds } = ctx;

      const [books, games, videos, audios, plans] = await Promise.all([
        fetchBooks( supabase, projectIds, orgId, search, discipline, grade, audience, 1, 0),
        fetchGames( supabase, projectIds, orgId, search, discipline, grade, audience, 1, 0),
        fetchVideos(supabase, projectIds,        search, discipline, grade, audience, 1, 0),
        fetchAudios(supabase, projectIds,        search, discipline, grade, audience, 1, 0),
        fetchPlans( supabase, projectIds, orgId, search, discipline, grade, audience, 1, 0),
      ]);

      return {
        livro:      books.count,
        video:      videos.count,
        jogo:       games.count,
        audio:      audios.count,
        plano_aula: plans.count,
      };
    },
    staleTime: STALE_MS,
    placeholderData: (prev) => prev,
  });
}

// ─── main data hook — uses shared useUserContext ──────────────────────────────

export function useAcervoData(filters: AcervoFilters) {
  const supabase = createClient();
  const { data: ctx } = useUserContext();
  const { activeTab, search, discipline, grade, audience, page } = filters;

  return useQuery({
    queryKey: ['professor', 'acervo', activeTab, search, discipline, grade, audience, page, ctx?.tenantId],
    enabled: !!ctx,
    queryFn: async () => {
      if (!ctx || ctx.projectIds.length === 0) {
        return { items: [], counts: {} as Record<string, number> };
      }
      const { orgId, projectIds } = ctx;
      const offset = (page - 1) * PAGE_LIMIT;

      if (activeTab === 'todos') {
        const [books, games, videos, audios, plans] = await Promise.all([
          fetchBooks( supabase, projectIds, orgId, search, discipline, grade, audience, 10, 0),
          fetchGames( supabase, projectIds, orgId, search, discipline, grade, audience, 10, 0),
          fetchVideos(supabase, projectIds,        search, discipline, grade, audience, 10, 0),
          fetchAudios(supabase, projectIds,        search, discipline, grade, audience, 10, 0),
          fetchPlans( supabase, projectIds, orgId, search, discipline, grade, audience, 10, 0),
        ]);
        return {
          items: [...books.items, ...games.items, ...videos.items, ...audios.items, ...plans.items],
          counts: {
            livro:      books.count,
            jogo:       games.count,
            video:      videos.count,
            audio:      audios.count,
            plano_aula: plans.count,
          },
        };
      }

      if (activeTab === 'livro') {
        const r = await fetchBooks(supabase, projectIds, orgId, search, discipline, grade, audience, PAGE_LIMIT, offset);
        return { items: r.items, counts: { livro: r.count } };
      }
      if (activeTab === 'jogo') {
        const r = await fetchGames(supabase, projectIds, orgId, search, discipline, grade, audience, PAGE_LIMIT, offset);
        return { items: r.items, counts: { jogo: r.count } };
      }
      if (activeTab === 'video') {
        const r = await fetchVideos(supabase, projectIds, search, discipline, grade, audience, PAGE_LIMIT, offset);
        return { items: r.items, counts: { video: r.count } };
      }
      if (activeTab === 'audio') {
        const r = await fetchAudios(supabase, projectIds, search, discipline, grade, audience, PAGE_LIMIT, offset);
        return { items: r.items, counts: { audio: r.count } };
      }
      if (activeTab === 'plano_aula') {
        const r = await fetchPlans(supabase, projectIds, orgId, search, discipline, grade, audience, PAGE_LIMIT, offset);
        return { items: r.items, counts: { plano_aula: r.count } };
      }

      return { items: [], counts: {} };
    },
    staleTime: STALE_MS,
    placeholderData: (prev) => prev,
  });
}

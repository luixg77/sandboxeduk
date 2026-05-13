export type TipoDocumento  = 'plano_aula' | 'sequencia_didatica' | 'material_diverso';
export type TipoConteudo   = 'arquivo' | 'texto';
export type PlanStatus     = 'rascunho' | 'publicado';
export type PlanOrigin     = 'sistema' | 'custom';

// Mirrors the actual lesson_plans table columns
export interface LessonPlan {
  id: string;
  organization_id?: string;
  // core content fields (existing column names)
  title: string;
  description: string;
  tipo_documento: TipoDocumento;
  tipo_conteudo: TipoConteudo;
  projetos: string[];
  subject: string;
  discipline_id: string | null;
  disciplina: string;
  grade_id: string | null;
  serie: string;
  skills: string[];
  keywords: string | null;
  thumbnail: string | null;
  content: Record<string, unknown> | null;
  file_name: string | null;
  file_url: string | null;
  origin: PlanOrigin;
  status: PlanStatus;
  // external import fields
  uid_external: string | null;
  medium_id: number | null;
  interactive: boolean;
  can_download: boolean;
  pcd_sign: boolean;
  pcd_voice: boolean;
  ratings: number;
  total_rating: number;
  source_platform: string | null;
  classifiers: any[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  course_id?: string | null;
  course?: { id: string; title: string } | null;
}

export const STORAGE_KEY = 'kodar_lesson_plans';

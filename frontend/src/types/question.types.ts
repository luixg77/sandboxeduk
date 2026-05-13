// ─────────────────────────────────────────────────────────────
// Question Bank — shared TypeScript types (mirrors DB schema)
// ─────────────────────────────────────────────────────────────

export type QuestionType       = 'multiple_choice' | 'discursive';
export type QuestionOrigin     = 'system' | 'custom';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus     = 'draft' | 'active' | 'inactive';

export interface QuestionAlternative {
  id: string;
  question_id: string;
  organization_id: string;
  letter: string;
  text: string;
  is_correct: boolean;
  image_url: string | null;
  deleted_at: string | null;
}

export interface Question {
  id: string;
  organization_id: string;
  statement: string;
  type: QuestionType;
  origin: QuestionOrigin;
  difficulty: QuestionDifficulty | null;
  comment: string | null;
  answer_key: string | null;
  image_url: string | null;
  source: string | null;
  year: number | null;
  status: QuestionStatus;
  created_by: string;
  bncc_skill_id: string | null;
  stage_id: string | null;
  discipline_id: string | null;
  subject_id: string | null;
  grade_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Flexible metadata (JSONB) — holds board, tags, taxonomy, etc.
  metadata: Record<string, any> | null;
  // Joined relations — returned by Supabase select with FK expansion
  disciplines: { id: string; name: string; color_hex: string } | null;
  subjects: { id: string; name: string } | null;
  education_stages: { id: string; name: string } | null;
  grades: { id: string; name: string } | null;
  bncc_skills: { id: string; code: string; description: string } | null;
  question_alternatives: QuestionAlternative[];
}

export interface QuestionFilters {
  keyword: string;
  discipline_id: string;
  subject_id: string;
  year: string;
  difficulty: string;
  type: string;
  origin: string;
  stage_id: string;
  grade_id: string;
  status?: string;
  created_by?: string;
  ids?: string[];
}

export const EMPTY_QUESTION_FILTERS: QuestionFilters = {
  keyword: '', discipline_id: '', subject_id: '', year: '', difficulty: '',
  type: '', origin: '', stage_id: '', grade_id: '',
};

export interface CreateQuestionPayload {
  statement: string;
  type: QuestionType;
  origin: QuestionOrigin;
  difficulty: QuestionDifficulty | null;
  comment: string | null;
  answer_key: string | null;
  image_url: string | null;
  source: string | null;
  year: number | null;
  status: QuestionStatus;
  bncc_skill_id: string | null;
  stage_id: string | null;
  discipline_id: string | null;
  subject_id: string | null;
  grade_id: string | null;
  /** Quando preenchido, marca a questão como exclusiva desse curso (não aparece no banco geral). */
  course_id?: string | null;
}

export interface AlternativePayload {
  letter: string;
  text: string;
  is_correct: boolean;
  image_url: string | null;
}

// ── Display helpers ──────────────────────────────────────────
export function questionDisplayCode(id: string): string {
  return `Q-${id.slice(0, 8).toUpperCase()}`;
}

export const DIFFICULTY_CONFIG: Record<QuestionDifficulty, { label: string; cls: string }> = {
  easy:   { label: 'Fácil',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Médio',   cls: 'bg-amber-50  text-amber-700  border-amber-200'    },
  hard:   { label: 'Difícil', cls: 'bg-red-50    text-red-700    border-red-200'      },
};

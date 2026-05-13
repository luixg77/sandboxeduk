export type AudioStatus = 'active' | 'inactive' | 'pending';
export type AudioOrigin = 'system' | 'custom';
export type AudioSourceType = 'link' | 'upload';

export interface AudioLesson {
  id: string;
  organization_id: string;

  // Content
  title: string;
  description: string | null;
  thumbnail_url: string | null;

  // Classification
  discipline_id: string | null;
  grade_id: string | null;
  subject: string | null;

  // Audio
  source_type: AudioSourceType;
  audio_url: string | null;
  duration: string | null;
  plays: number;

  // Lifecycle
  origin: AudioOrigin;
  status: AudioStatus;
  created_by: string;

  // Audit
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Course-only flag
  course_id: string | null;

  // Relations (joined from Supabase)
  disciplines?: { id: string; name: string; color_hex: string | null } | null;
  grades?: { id: string; name: string } | null;
  audio_lesson_projects?: { project_id: string; projects: { id: string; name: string } | null }[] | null;
  audio_lesson_type_links?: { type_id: string; audio_lesson_types: { id: string; name: string } | null }[] | null;
  course?: { id: string; title: string } | null;
}

export interface AudioLessonFilters {
  keyword: string;
  discipline_id: string;
  grade_id: string;
  status: string;
  origin: string;
  project_id: string;
  type_id: string;
}

export interface AudioLessonType {
  id: string;
  name: string;
  organization_id: string | null;
  created_at: string;
}

export const EMPTY_AUDIO_FILTERS: AudioLessonFilters = {
  keyword: '',
  discipline_id: '',
  grade_id: '',
  status: '',
  origin: '',
  project_id: '',
  type_id: '',
};

export interface CreateAudioLessonPayload {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  discipline_id?: string | null;
  grade_id?: string | null;
  subject?: string | null;
  source_type: AudioSourceType;
  audio_url?: string | null;
  duration?: string | null;
  origin?: AudioOrigin;
  status?: AudioStatus;
  source_platform?: string | null;
  type_ids?: string[];
  project_ids?: string[];
  /** Quando preenchido, marca o áudio como exclusivo desse curso (não aparece no acervo). */
  course_id?: string | null;
}

export type VideoStatus = 'active' | 'inactive' | 'pending';
export type VideoOrigin = 'system' | 'custom';
export type VideoSourceType = 'link' | 'upload';

export interface VideoLesson {
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

  // Video
  source_type: VideoSourceType;
  video_url: string | null;
  duration: string | null;
  views: number;

  // Lifecycle
  origin: VideoOrigin;
  status: VideoStatus;
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
  video_lesson_projects?: { project_id: string; projects: { id: string; name: string } | null }[] | null;
  course?: { id: string; title: string } | null;
}

export interface VideoLessonFilters {
  keyword: string;
  discipline_id: string;
  grade_id: string;
  status: string;
  origin: string;
  project_id: string;
}

export const EMPTY_VIDEO_FILTERS: VideoLessonFilters = {
  keyword: '',
  discipline_id: '',
  grade_id: '',
  status: '',
  origin: '',
  project_id: '',
};

export interface CreateVideoLessonPayload {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  discipline_id?: string | null;
  grade_id?: string | null;
  subject?: string | null;
  source_type: VideoSourceType;
  video_url?: string | null;
  duration?: string | null;
  origin?: VideoOrigin;
  status?: VideoStatus;
  source_platform?: string | null;
  project_ids?: string[];
  /** Quando preenchido, marca o vídeo como exclusivo desse curso (não aparece no acervo). */
  course_id?: string | null;
}

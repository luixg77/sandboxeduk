'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { TrilhaItemType } from './useTrilhas';

const supabase = createClient();

export interface QuestionAlternative {
  id:         string;
  letter:     string;
  text:       string;
  is_correct: boolean;
}

export interface ItemContent {
  type:          TrilhaItemType;
  title:         string;
  description:   string | null;     // pode conter HTML — admins escrevem via textarea
  thumbnailUrl:  string | null;
  fileUrl:       string | null;
  fileName?:     string | null;
  // video
  videoUrl?:     string | null;
  duration?:     string | null;
  sourceType?:   string | null;
  // audio
  audioUrl?:     string | null;
  // lesson_plan
  tipoConteudo?: 'texto' | 'arquivo' | null;
  contentJson?:  any;
  // game
  imageUrl?:     string | null;
  engine?:       string | null;
  layout?:       string | null;
  // question
  statement?:    string | null;
  questionType?: 'multiple_choice' | 'discursive' | null;
  comment?:      string | null;
  answerKey?:    string | null;
  alternatives?: QuestionAlternative[];
}

// v2: invalidação proposital após introduzir refreshSignedUrl — força refetch.
const QK = (type: TrilhaItemType, id: string) => ['item-content', 'v2', type, id] as const;

/**
 * Quando a URL é uma signed URL do Supabase Storage (.../object/sign/<bucket>/<path>?token=...),
 * regenera com expiração nova de 1h. Para URLs públicas/externas, retorna como está.
 * Sem isso, áudios/vídeos/PDFs param de tocar quando o token original expira.
 */
async function refreshSignedUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    if (!m) return url;
    const [, bucket, path] = m;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return url;
    return data.signedUrl;
  } catch {
    return url;
  }
}

/**
 * Busca o conteúdo real (vídeo / áudio / livro / plano / jogo / questão) referenciado
 * por `course_module_items.item_id`, retornando uma forma unificada para o viewer.
 */
export function useItemContent(itemId: string | null | undefined, itemType: TrilhaItemType | null | undefined) {
  return useQuery<ItemContent | null>({
    queryKey: itemId && itemType ? QK(itemType, itemId) : ['item-content', 'noop'],
    enabled:  !!itemId && !!itemType,
    queryFn: async () => {
      if (!itemId || !itemType) return null;

      switch (itemType) {
        case 'video': {
          const { data, error } = await supabase
            .from('video_lessons')
            .select('id, title, description, thumbnail_url, video_url, source_type, duration')
            .eq('id', itemId)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            type:         'video',
            title:        data.title,
            description:  data.description ?? null,
            thumbnailUrl: data.thumbnail_url ?? null,
            fileUrl:      null,
            videoUrl:     await refreshSignedUrl(data.video_url),
            duration:     data.duration ?? null,
            sourceType:   data.source_type ?? null,
          };
        }
        case 'audio': {
          const { data, error } = await supabase
            .from('audio_lessons')
            .select('id, title, description, thumbnail_url, audio_url, source_type, duration')
            .eq('id', itemId)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            type:         'audio',
            title:        data.title,
            description:  data.description ?? null,
            thumbnailUrl: data.thumbnail_url ?? null,
            fileUrl:      null,
            audioUrl:     await refreshSignedUrl(data.audio_url),
            duration:     data.duration ?? null,
            sourceType:   data.source_type ?? null,
          };
        }
        case 'book': {
          const { data, error } = await supabase
            .from('books')
            .select('id, title, description, file_url, thumbnail')
            .eq('id', itemId)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            type:         'book',
            title:        data.title,
            description:  data.description ?? null,
            thumbnailUrl: data.thumbnail ?? null,
            fileUrl:      await refreshSignedUrl(data.file_url),
          };
        }
        case 'lesson_plan': {
          const { data, error } = await supabase
            .from('lesson_plans')
            .select('id, title, description, tipo_conteudo, content, file_url, file_name, thumbnail')
            .eq('id', itemId)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            type:         'lesson_plan',
            title:        data.title,
            description:  data.description ?? null,
            thumbnailUrl: data.thumbnail ?? null,
            fileUrl:      await refreshSignedUrl(data.file_url),
            fileName:     data.file_name ?? null,
            tipoConteudo: data.tipo_conteudo ?? null,
            contentJson:  data.content ?? null,
          };
        }
        case 'game': {
          const { data, error } = await supabase
            .from('games')
            .select('id, title, description, image_url, thumbnail, engine, layout')
            .eq('id', itemId)
            .maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return {
            type:         'game',
            title:        data.title,
            description:  data.description ?? null,
            thumbnailUrl: data.thumbnail ?? null,
            fileUrl:      null,
            imageUrl:     await refreshSignedUrl(data.image_url),
            engine:       data.engine ?? null,
            layout:       data.layout ?? null,
          };
        }
        case 'question': {
          const [{ data: q, error: qe }, { data: alts, error: ae }] = await Promise.all([
            supabase.from('questions')
              .select('id, statement, type, comment, answer_key, image_url')
              .eq('id', itemId)
              .maybeSingle(),
            supabase.from('question_alternatives')
              .select('id, letter, text, is_correct')
              .eq('question_id', itemId)
              .order('letter', { ascending: true }),
          ]);
          if (qe) throw qe;
          if (ae) throw ae;
          if (!q) return null;
          return {
            type:         'question',
            title:        q.statement?.slice(0, 80) ?? '',
            description:  null,
            thumbnailUrl: q.image_url ?? null,
            fileUrl:      null,
            statement:    q.statement,
            questionType: q.type,
            comment:      q.comment ?? null,
            answerKey:    q.answer_key ?? null,
            alternatives: (alts ?? []) as QuestionAlternative[],
          };
        }
      }
    },
    // Signed URLs do Supabase Storage expiram (1h por padrão). Mantemos staleTime curto
    // para forçar refetch e refresh das URLs ao reabrir o conteúdo.
    staleTime: 60 * 1000,
    gcTime:    5 * 60 * 1000,
  });
}

/* ─────────────── helpers de mídia ─────────────── */

export type EmbedKind = 'pdf' | 'office' | 'image' | 'video-iframe' | 'audio' | 'unknown';

export function detectEmbed(url: string): { kind: EmbedKind; src: string } {
  const lower = url.toLowerCase().split('?')[0].split('#')[0];

  if (/\.pdf$/.test(lower))                          return { kind: 'pdf',   src: url };
  if (/\.(jpe?g|png|webp|gif|bmp|svg|avif)$/.test(lower)) return { kind: 'image', src: url };
  if (/\.(docx?|pptx?|xlsx?|odt|odp|ods)$/.test(lower)) return {
    kind: 'office',
    src:  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
  };
  if (/\.(mp4|webm|mov|m4v)$/.test(lower))           return { kind: 'video-iframe', src: url };
  if (/\.(mp3|wav|m4a|ogg|aac)$/.test(lower))        return { kind: 'audio', src: url };

  // YouTube
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return { kind: 'video-iframe', src: `https://www.youtube.com/embed/${v}` };
    }
    if (u.hostname === 'youtu.be') {
      return { kind: 'video-iframe', src: `https://www.youtube.com/embed${u.pathname}` };
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return { kind: 'video-iframe', src: `https://player.vimeo.com/video/${id}` };
    }
  } catch { /* ignore */ }

  return { kind: 'unknown', src: url };
}

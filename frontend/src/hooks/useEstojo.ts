'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type EstojoItemType = 'livro' | 'video' | 'jogo' | 'audio' | 'plano_aula';

export interface EstojoItem {
  id:            string;
  type:          EstojoItemType;
  title:         string;
  discipline?:   string;
  grade?:        string;
  color:         string;
  savedAt:       string;
  thumbnailUrl?: string;
  fileUrl?:      string;
  canDownload?:  boolean;
}

export interface EstojoFolder {
  id:        string;
  name:      string;
  createdAt: string;
  items:     EstojoItem[];
}

const QK = ['estojo'] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function rowToFolder(f: any, items: any[]): EstojoFolder {
  return {
    id:        f.id,
    name:      f.name,
    createdAt: f.created_at,
    items: items
      .filter((i: any) => i.folder_id === f.id)
      .map((i: any): EstojoItem => ({
        id:           i.content_id,
        type:         i.content_type as EstojoItemType,
        title:        i.title,
        discipline:   i.discipline    ?? undefined,
        grade:        i.grade         ?? undefined,
        color:        i.color,
        savedAt:      i.saved_at,
        thumbnailUrl: i.thumbnail_url ?? undefined,
        fileUrl:      i.file_url      ?? undefined,
        canDownload:  i.can_download  ?? undefined,
      })),
  };
}

// ─── main hook ───────────────────────────────────────────────────────────────

export function useEstojo() {
  const supabase     = createClient();
  const queryClient  = useQueryClient();

  // ── fetch all folders + items in two parallel queries ──────────────────────
  const { data, isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { folders: [] as EstojoFolder[] };

      const [fRes, iRes] = await Promise.all([
        supabase
          .from('estojo_folders')
          .select('id, name, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('estojo_items')
          .select('id, folder_id, content_id, content_type, title, discipline, grade, color, saved_at, thumbnail_url, file_url, can_download')
          .eq('user_id', session.user.id)
          .order('saved_at', { ascending: true }),
      ]);

      if (fRes.error) throw fRes.error;
      if (iRes.error) throw iRes.error;

      const folders = (fRes.data || []).map((f: any) =>
        rowToFolder(f, iRes.data || [])
      );
      return { folders };
    },
    staleTime: 1000 * 60 * 5,
  });

  const folders: EstojoFolder[] = data?.folders ?? [];

  // ── invalidate helper ──────────────────────────────────────────────────────
  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QK });
  }

  // ── create folder ──────────────────────────────────────────────────────────
  const createFolderMut = useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');
      const { data, error } = await supabase
        .from('estojo_folders')
        .insert({ user_id: session.user.id, name })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  async function createFolder(name: string): Promise<string> {
    return createFolderMut.mutateAsync(name);
  }

  // ── create folder + save item atomically ──────────────────────────────────
  async function createFolderWithItem(name: string, item: EstojoItem) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: folder, error: fe } = await supabase
      .from('estojo_folders')
      .insert({ user_id: session.user.id, name })
      .select('id')
      .single();
    if (fe) throw fe;

    const { error: ie } = await supabase.from('estojo_items').insert({
      folder_id:     folder.id,
      user_id:       session.user.id,
      content_id:    item.id,
      content_type:  item.type,
      title:         item.title,
      discipline:    item.discipline   ?? null,
      grade:         item.grade        ?? null,
      color:         item.color,
      thumbnail_url: item.thumbnailUrl ?? null,
      file_url:      item.fileUrl      ?? null,
      can_download:  item.canDownload  ?? null,
    });
    if (ie) throw ie;

    invalidate();
  }

  // ── save item to existing folder ──────────────────────────────────────────
  const saveItemMut = useMutation({
    mutationFn: async ({ item, folderId }: { item: EstojoItem; folderId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');
      const { error } = await supabase.from('estojo_items').upsert({
        folder_id:     folderId,
        user_id:       session.user.id,
        content_id:    item.id,
        content_type:  item.type,
        title:         item.title,
        discipline:    item.discipline    ?? null,
        grade:         item.grade         ?? null,
        color:         item.color,
        thumbnail_url: item.thumbnailUrl  ?? null,
        file_url:      item.fileUrl       ?? null,
        can_download:  item.canDownload   ?? null,
      }, { onConflict: 'folder_id,content_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  function saveItem(item: EstojoItem, folderId: string) {
    saveItemMut.mutate({ item, folderId });
  }

  // ── remove item from folder ───────────────────────────────────────────────
  const removeItemMut = useMutation({
    mutationFn: async ({ itemId, folderId }: { itemId: string; folderId: string }) => {
      const { error } = await supabase
        .from('estojo_items')
        .delete()
        .eq('content_id', itemId)
        .eq('folder_id', folderId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  function removeItem(itemId: string, folderId: string) {
    removeItemMut.mutate({ itemId, folderId });
  }

  // ── rename folder ─────────────────────────────────────────────────────────
  const renameFolderMut = useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const { error } = await supabase
        .from('estojo_folders')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', folderId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  function renameFolder(folderId: string, name: string) {
    renameFolderMut.mutate({ folderId, name });
  }

  // ── delete folder (cascade deletes items via FK) ───────────────────────────
  const deleteFolderMut = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from('estojo_folders')
        .delete()
        .eq('id', folderId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  function deleteFolder(folderId: string) {
    deleteFolderMut.mutate(folderId);
  }

  // ── isSaved — checks across all folders ──────────────────────────────────
  function isSaved(contentId: string): boolean {
    return folders.some(f => f.items.some(i => i.id === contentId));
  }

  const totalItems = folders.reduce((s, f) => s + f.items.length, 0);

  return {
    folders,
    isLoading,
    createFolder,
    createFolderWithItem,
    saveItem,
    removeItem,
    renameFolder,
    deleteFolder,
    isSaved,
    totalItems,
    ready: !isLoading,
  };
}

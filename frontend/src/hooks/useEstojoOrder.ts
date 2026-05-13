'use client';

import { useState, useCallback } from 'react';
import type { EstojoItem, EstojoFolder } from './useEstojo';

const STORAGE_KEY = 'estojo_order';

function load(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); }
  catch { return {}; }
}

export function useEstojoOrder() {
  const [orders, setOrdersState] = useState<Record<string, string[]>>(load);

  function getOrderedItems(folder: EstojoFolder): EstojoItem[] {
    const order = orders[folder.id];
    if (!order || order.length === 0) return folder.items;
    const map = new Map(folder.items.map(i => [i.id, i]));
    const sorted = order.flatMap(id => { const i = map.get(id); return i ? [i] : []; });
    const rest   = folder.items.filter(i => !order.includes(i.id));
    return [...sorted, ...rest];
  }

  const moveItem = useCallback((
    folderId: string,
    currentItems: EstojoItem[],
    itemId: string,
    direction: 'up' | 'down',
  ) => {
    const ids  = currentItems.map(i => i.id);
    const idx  = ids.indexOf(itemId);
    const next = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || next < 0 || next >= ids.length) return;
    const newIds = [...ids];
    [newIds[idx], newIds[next]] = [newIds[next], newIds[idx]];
    setOrdersState(prev => {
      const updated = { ...prev, [folderId]: newIds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { getOrderedItems, moveItem };
}

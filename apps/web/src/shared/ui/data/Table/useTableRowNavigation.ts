import { useRef, useState } from 'react';
import { TableKey } from '@/shared/ui/data/Table/Table.constants';

const getTargetIndex = (key: string, index: number, count: number): number | null => {
  switch (key) {
    case TableKey.ArrowDown:
      return Math.min(index + 1, count - 1);
    case TableKey.ArrowUp:
      return Math.max(index - 1, 0);
    case TableKey.Home:
      return 0;
    case TableKey.End:
      return count - 1;
    default:
      return null;
  }
};

export function useTableRowNavigation(rowIds: readonly string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLTableRowElement>());
  const tabStopId = activeId !== null && rowIds.includes(activeId) ? activeId : (rowIds[0] ?? null);

  const registerRow = (id: string) => (node: HTMLTableRowElement | null) => {
    if (node === null) {
      rows.current.delete(id);
      return;
    }
    rows.current.set(id, node);
  };

  const moveFocus = (key: string, index: number): boolean => {
    const target = getTargetIndex(key, index, rowIds.length);
    if (target === null) {
      return false;
    }
    const id = rowIds[target];
    if (id !== undefined) {
      setActiveId(id);
      rows.current.get(id)?.focus();
    }
    return true;
  };

  return { tabStopId, registerRow, moveFocus, setActiveId };
}

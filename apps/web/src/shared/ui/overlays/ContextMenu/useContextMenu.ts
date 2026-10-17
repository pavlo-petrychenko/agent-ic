import { useCallback, useState } from 'react';
import type {
  ContextMenuEvent,
  ContextMenuTarget,
  UseContextMenuResult,
} from '@/shared/ui/overlays/ContextMenu/ContextMenu.typedefs';

export function useContextMenu<T>(): UseContextMenuResult<T> {
  const [state, setState] = useState<ContextMenuTarget<T> | null>(null);

  const open = useCallback((target: T, event: ContextMenuEvent) => {
    event.preventDefault();
    setState({ target, anchor: { x: event.clientX, y: event.clientY } });
  }, []);

  const close = useCallback(() => setState(null), []);

  return { state, open, close };
}

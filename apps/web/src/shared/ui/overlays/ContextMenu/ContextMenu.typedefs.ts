import type { MouseEvent } from 'react';
import type { MenuEntry } from '@/shared/ui/overlays/Menu';
import type { PopoverPoint } from '@/shared/ui/overlays/Popover';

export type ContextMenuEvent = MouseEvent<HTMLElement>;

export interface ContextMenuTarget<T> {
  readonly target: T;
  readonly anchor: PopoverPoint;
}

export interface ContextMenuProps {
  readonly anchor: PopoverPoint | null;
  readonly items: readonly MenuEntry[];
  readonly ariaLabel: string;
  readonly minWidth?: number | null;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
}

export interface UseContextMenuResult<T> {
  readonly state: ContextMenuTarget<T> | null;
  readonly open: (target: T, event: ContextMenuEvent) => void;
  readonly close: () => void;
}

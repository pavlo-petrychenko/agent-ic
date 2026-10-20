import type { PromptFolderMenuAction } from '@/features/prompts/constants/promptFolderMenu.constants';
import type { ContextMenuEvent } from '@/shared/ui/overlays/ContextMenu';
import type { PopoverPoint } from '@/shared/ui/overlays/Popover';

export interface PromptFolderListItem {
  readonly id: string;
  readonly name: string;
}

export interface PromptFolderMenuTarget {
  readonly folder: PromptFolderListItem;
  readonly promptCount: number;
}

export interface UsePromptFolderMenuResult {
  readonly anchor: PopoverPoint | null;
  readonly renameFolder: PromptFolderListItem | null;
  readonly deleteTarget: PromptFolderMenuTarget | null;
  readonly open: (target: PromptFolderMenuTarget, event: ContextMenuEvent) => void;
  readonly select: (action: PromptFolderMenuAction) => void;
  readonly close: () => void;
  readonly closeRename: () => void;
  readonly closeDelete: () => void;
}

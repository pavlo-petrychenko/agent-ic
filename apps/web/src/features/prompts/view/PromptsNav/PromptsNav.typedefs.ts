import type { PromptFolderMenuAction } from '@/features/prompts/constants/promptFolderMenu.constants';
import type { PromptFolderMenuTarget } from '@/features/prompts/typedefs/promptFolder.typedefs';
import type { PromptTreeGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';
import type { ContextMenuEvent } from '@/shared/ui/overlays/ContextMenu';
import type { PopoverPoint } from '@/shared/ui/overlays/Popover';

export interface PromptsNavProps {
  readonly workspaceId: string;
  readonly groups: readonly PromptTreeGroup[];
  readonly loading: boolean;
  readonly query: string;
  readonly draftPromptIds: ReadonlySet<string>;
  readonly onCreate: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onQueryClear: () => void;
  readonly onOpenChange: (folderId: string, open: boolean) => void;
  readonly folderMenuAnchor: PopoverPoint | null;
  readonly onFolderMenuOpen: (target: PromptFolderMenuTarget, event: ContextMenuEvent) => void;
  readonly onFolderMenuSelect: (action: PromptFolderMenuAction) => void;
  readonly onFolderMenuClose: () => void;
}

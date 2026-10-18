import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface PromptGroup {
  readonly folder: PromptFolderListItem;
  readonly prompts: readonly PromptListItem[];
}

export interface PromptTreeGroup extends PromptGroup {
  readonly open: boolean;
}

export interface UsePromptFolderTreeResult {
  readonly groups: readonly PromptTreeGroup[];
  readonly setOpen: (folderId: string, open: boolean) => void;
}

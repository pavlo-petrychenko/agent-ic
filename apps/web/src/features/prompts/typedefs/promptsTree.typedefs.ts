import type { PromptFolderWithPrompts } from '@/features/prompts/typedefs/prompt.typedefs';

export interface PromptTreeGroup extends PromptFolderWithPrompts {
  readonly open: boolean;
}

export interface UsePromptFolderTreeResult {
  readonly groups: readonly PromptTreeGroup[];
  readonly setOpen: (folderId: string, open: boolean) => void;
}

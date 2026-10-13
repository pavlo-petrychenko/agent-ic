import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import type { PromptGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';

export const toPromptGroups = (
  folders: readonly PromptFolderListItem[],
  prompts: readonly PromptListItem[],
): readonly PromptGroup[] =>
  folders.map((folder) => ({
    folder,
    prompts: prompts.filter((prompt) => prompt.folderId === folder.id),
  }));

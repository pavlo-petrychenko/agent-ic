import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import type { PromptGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';

export const toPromptGroups = (
  folders: readonly PromptFolderListItem[],
  prompts: readonly PromptListItem[],
  query: string,
): readonly PromptGroup[] => {
  const needle = query.trim().toLocaleLowerCase();
  const matching =
    needle === ''
      ? prompts
      : prompts.filter((prompt) => prompt.name.toLocaleLowerCase().includes(needle));
  return folders
    .map((folder) => ({
      folder,
      prompts: matching.filter((prompt) => prompt.folderId === folder.id),
    }))
    .filter((group) => needle === '' || group.prompts.length > 0);
};

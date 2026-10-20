import type { PromptFolderWithPrompts } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';

export const toPromptGroups = (
  folders: readonly PromptFolderWithPrompts[],
  query: string,
): readonly PromptGroup[] => {
  const needle = query.trim().toLocaleLowerCase();
  return folders
    .map((folder) => ({
      folder: { id: folder.id, name: folder.name },
      prompts:
        needle === ''
          ? folder.prompts
          : folder.prompts.filter((prompt) => prompt.name.toLocaleLowerCase().includes(needle)),
    }))
    .filter((group) => needle === '' || group.prompts.length > 0);
};

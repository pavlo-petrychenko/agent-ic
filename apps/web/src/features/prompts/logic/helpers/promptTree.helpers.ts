import type { PromptFolderWithPrompts } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptTreeGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';

export const toPromptTreeGroups = (
  folders: readonly PromptFolderWithPrompts[],
  closedIds: ReadonlySet<string>,
): readonly PromptTreeGroup[] =>
  folders.map((folder) => ({ ...folder, open: !closedIds.has(folder.id) }));

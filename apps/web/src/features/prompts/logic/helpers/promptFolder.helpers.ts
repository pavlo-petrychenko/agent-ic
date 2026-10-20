import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export const findFolderByName = (
  folders: readonly PromptFolderListItem[],
  name: string,
): PromptFolderListItem | null => {
  const normalized = name.trim().toLocaleLowerCase();
  return folders.find((folder) => folder.name.toLocaleLowerCase() === normalized) ?? null;
};

export const findFolderName = (
  folders: readonly PromptFolderListItem[],
  folderId: string,
): string | null => folders.find((folder) => folder.id === folderId)?.name ?? null;

import { useCallback, useMemo, useState } from 'react';
import { toPromptGroups } from '@/features/prompts/logic/helpers/promptTree.helpers';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import type { UsePromptFolderTreeResult } from '@/features/prompts/typedefs/promptsTree.typedefs';

export function usePromptFolderTree(
  folders: readonly PromptFolderListItem[],
  prompts: readonly PromptListItem[],
): UsePromptFolderTreeResult {
  const [closedIds, setClosedIds] = useState<ReadonlySet<string>>(() => new Set<string>());
  const setOpen = useCallback((folderId: string, open: boolean) => {
    setClosedIds((current) => {
      const next = new Set(current);
      if (open) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);
  const groups = useMemo(
    () =>
      toPromptGroups(folders, prompts).map((group) => ({
        ...group,
        open: !closedIds.has(group.folder.id),
      })),
    [folders, prompts, closedIds],
  );

  return { groups, setOpen };
}

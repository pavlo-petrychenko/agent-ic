import { useCallback, useMemo, useState } from 'react';
import { toPromptGroups } from '@/features/prompts/logic/helpers/promptTree.helpers';
import type { PromptFolderWithPrompts } from '@/features/prompts/typedefs/prompt.typedefs';
import type { UsePromptFolderTreeResult } from '@/features/prompts/typedefs/promptsTree.typedefs';

export function usePromptFolderTree(
  folders: readonly PromptFolderWithPrompts[],
  query: string,
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
  const groups = useMemo(() => {
    const searching = query.trim() !== '';
    return toPromptGroups(folders, query).map((group) => ({
      ...group,
      open: searching || !closedIds.has(group.folder.id),
    }));
  }, [folders, query, closedIds]);

  return { groups, setOpen };
}

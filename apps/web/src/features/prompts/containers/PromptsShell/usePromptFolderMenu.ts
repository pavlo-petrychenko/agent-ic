import { useCallback, useState } from 'react';
import { PromptFolderMenuAction } from '@/features/prompts/constants/promptFolderMenu.constants';
import type {
  PromptFolderListItem,
  PromptFolderMenuTarget,
  UsePromptFolderMenuResult,
} from '@/features/prompts/typedefs/promptFolder.typedefs';
import { useContextMenu } from '@/shared/ui/overlays/ContextMenu';

export function usePromptFolderMenu(): UsePromptFolderMenuResult {
  const { state, open, close } = useContextMenu<PromptFolderMenuTarget>();
  const [renameFolder, setRenameFolder] = useState<PromptFolderListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromptFolderMenuTarget | null>(null);

  const select = useCallback(
    (action: PromptFolderMenuAction) => {
      const target = state?.target ?? null;
      switch (action) {
        case PromptFolderMenuAction.Rename:
          return setRenameFolder(target?.folder ?? null);
        case PromptFolderMenuAction.Delete:
          return setDeleteTarget(target);
      }
    },
    [state],
  );

  const closeRename = useCallback(() => setRenameFolder(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  return {
    anchor: state?.anchor ?? null,
    renameFolder,
    deleteTarget,
    open,
    select,
    close,
    closeRename,
    closeDelete,
  };
}

import { useEffect, useMemo, useState } from 'react';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { DeletePromptFolderDialog } from '@/features/prompts/containers/DeletePromptFolderDialog';
import { NewPromptDialog } from '@/features/prompts/containers/NewPromptDialog';
import type { PromptsShellProps } from '@/features/prompts/containers/PromptsShell/PromptsShell.typedefs';
import { usePromptFolderMenu } from '@/features/prompts/containers/PromptsShell/usePromptFolderMenu';
import { RenamePromptFolderDialog } from '@/features/prompts/containers/RenamePromptFolderDialog';
import { usePromptFolderTree } from '@/features/prompts/logic/hooks/usePromptFolderTree';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import { PromptsNav } from '@/features/prompts/view/PromptsNav';

export function PromptsShell({ workspaceId, children }: PromptsShellProps) {
  const { folders, loading } = usePromptLibrary();
  const drafts = usePromptDraftsStore((state) => state.drafts);
  const draftPromptIds = useMemo(() => new Set(Object.keys(drafts)), [drafts]);
  const [query, setQuery] = useState('');
  const { groups, setOpen } = usePromptFolderTree(folders, query);
  const folderMenu = usePromptFolderMenu();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    usePromptDraftsStore.getState().load();
  }, []);

  return (
    <div className="flex h-full min-h-0">
      <PromptsNav
        workspaceId={workspaceId}
        groups={groups}
        loading={loading}
        query={query}
        draftPromptIds={draftPromptIds}
        onCreate={() => setCreating(true)}
        onQueryChange={setQuery}
        onQueryClear={() => setQuery('')}
        onOpenChange={setOpen}
        folderMenuAnchor={folderMenu.anchor}
        onFolderMenuOpen={folderMenu.open}
        onFolderMenuSelect={folderMenu.select}
        onFolderMenuClose={folderMenu.close}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</div>
      {creating && (
        <NewPromptDialog
          workspaceId={workspaceId}
          folders={folders}
          onClose={() => setCreating(false)}
        />
      )}
      {folderMenu.renameFolder !== null && (
        <RenamePromptFolderDialog
          folder={folderMenu.renameFolder}
          onClose={folderMenu.closeRename}
        />
      )}
      {folderMenu.deleteTarget !== null && (
        <DeletePromptFolderDialog
          folder={folderMenu.deleteTarget.folder}
          promptCount={folderMenu.deleteTarget.promptCount}
          onClose={folderMenu.closeDelete}
        />
      )}
    </div>
  );
}

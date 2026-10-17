import { useState } from 'react';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { DeletePromptFolderDialog } from '@/features/prompts/containers/DeletePromptFolderDialog';
import { NewPromptDialog } from '@/features/prompts/containers/NewPromptDialog';
import type { PromptsShellProps } from '@/features/prompts/containers/PromptsShell/PromptsShell.typedefs';
import { usePromptFolderMenu } from '@/features/prompts/containers/PromptsShell/usePromptFolderMenu';
import { RenamePromptFolderDialog } from '@/features/prompts/containers/RenamePromptFolderDialog';
import { usePromptFolderTree } from '@/features/prompts/logic/hooks/usePromptFolderTree';
import { PromptsNav } from '@/features/prompts/view/PromptsNav';

export function PromptsShell({ workspaceId, children }: PromptsShellProps) {
  const { folders, prompts, loading } = usePromptLibrary();
  const { groups, setOpen } = usePromptFolderTree(folders, prompts);
  const folderMenu = usePromptFolderMenu();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex h-full min-h-0">
      <PromptsNav
        workspaceId={workspaceId}
        groups={groups}
        loading={loading}
        onCreate={() => setCreating(true)}
        onOpenChange={setOpen}
        folderMenuAnchor={folderMenu.anchor}
        onFolderMenuOpen={folderMenu.open}
        onFolderMenuSelect={folderMenu.select}
        onFolderMenuClose={folderMenu.close}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</div>
      {creating && <NewPromptDialog folders={folders} onClose={() => setCreating(false)} />}
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

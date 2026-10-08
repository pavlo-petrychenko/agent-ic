import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenameWorkspaceDocument } from '@/features/settings/communication/gql/mutation/renameWorkspace.generated';

export function useRenameWorkspace(): (name: string) => Promise<void> {
  const [renameWorkspace] = useMutation(RenameWorkspaceDocument);

  return useCallback(
    async (name) => {
      await renameWorkspace({ variables: { input: { name } } });
    },
    [renameWorkspace],
  );
}

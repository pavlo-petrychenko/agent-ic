import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteWorkspaceDocument } from '@/features/settings/communication/gql/mutation/deleteWorkspace.generated';

export function useDeleteWorkspace(): (name: string, password: string) => Promise<void> {
  const [deleteWorkspace] = useMutation(DeleteWorkspaceDocument, {
    refetchQueries: ['WorkspaceShell'],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (name, password) => {
      await deleteWorkspace({ variables: { input: { name, password } } });
    },
    [deleteWorkspace],
  );
}

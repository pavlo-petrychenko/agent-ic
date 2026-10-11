import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { LeaveWorkspaceDocument } from '@/features/settings/communication/gql/mutation/leaveWorkspace.generated';

export function useLeaveWorkspace(): (workspaceId: string) => Promise<void> {
  const [leaveWorkspace] = useMutation(LeaveWorkspaceDocument, {
    refetchQueries: ['WorkspaceShell'],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (workspaceId) => {
      await leaveWorkspace({ variables: { workspaceId } });
    },
    [leaveWorkspace],
  );
}

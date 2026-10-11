import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { LeaveWorkspaceDocument } from '@/features/settings/communication/gql/mutation/leaveWorkspace.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';

export function useLeaveWorkspace(): (workspaceId: string) => Promise<void> {
  const [leaveWorkspace] = useMutation(LeaveWorkspaceDocument, {
    refetchQueries: [TeamMembersDocument, 'WorkspaceShell'],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (workspaceId) => {
      await leaveWorkspace({ variables: { workspaceId } });
    },
    [leaveWorkspace],
  );
}

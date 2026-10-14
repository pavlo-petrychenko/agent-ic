import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RemoveMemberDocument } from '@/features/settings/communication/gql/mutation/removeMember.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';

export function useRemoveMember(): (membershipId: string) => Promise<void> {
  const [removeMember] = useMutation(RemoveMemberDocument, {
    refetchQueries: [TeamMembersDocument, 'WorkspaceShell'],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (membershipId) => {
      await removeMember({ variables: { input: { membershipId } } });
    },
    [removeMember],
  );
}

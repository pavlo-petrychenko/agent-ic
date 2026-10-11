import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { TransferOwnershipDocument } from '@/features/settings/communication/gql/mutation/transferOwnership.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';

export function useTransferOwnership(): (membershipId: string, password: string) => Promise<void> {
  const [transferOwnership] = useMutation(TransferOwnershipDocument, {
    refetchQueries: [TeamMembersDocument, 'WorkspaceShell'],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (membershipId, password) => {
      await transferOwnership({ variables: { input: { membershipId, password } } });
    },
    [transferOwnership],
  );
}

import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteRoleDocument } from '@/features/settings/communication/gql/mutation/deleteRole.generated';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';

export function useDeleteRole(): (roleId: string, replacementRoleId: string) => Promise<void> {
  const [deleteRole] = useMutation(DeleteRoleDocument, {
    refetchQueries: [RolesDocument, TeamMembersDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (roleId, replacementRoleId) => {
      await deleteRole({ variables: { input: { roleId, replacementRoleId } } });
    },
    [deleteRole],
  );
}

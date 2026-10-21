import type { WorkspaceRole } from '@agent-ic/contracts';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ChangeMemberRoleDocument } from '@/features/settings/communication/gql/mutation/changeMemberRole.generated';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';
import type { UseChangeMemberRoleResult } from '@/features/settings/typedefs/member.typedefs';
import { ROLE_TO_API } from '@/shared/api/constants/workspaceRole.constants';

export function useChangeMemberRole(): UseChangeMemberRoleResult {
  const [changeMemberRole, { loading }] = useMutation(ChangeMemberRoleDocument, {
    refetchQueries: [TeamMembersDocument],
    awaitRefetchQueries: true,
  });

  const change = useCallback(
    async (membershipId: string, role: WorkspaceRole) => {
      await changeMemberRole({
        variables: { input: { membershipId, role: ROLE_TO_API[role] } },
      });
    },
    [changeMemberRole],
  );

  return { changeMemberRole: change, changing: loading };
}

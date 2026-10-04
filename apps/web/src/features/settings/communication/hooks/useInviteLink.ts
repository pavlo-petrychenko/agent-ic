import type { WorkspaceRole } from '@agent-ic/contracts';
import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { ResetInviteLinkDocument } from '@/features/settings/communication/gql/mutation/resetInviteLink.generated';
import { UpdateInviteLinkRoleDocument } from '@/features/settings/communication/gql/mutation/updateInviteLinkRole.generated';
import { InviteLinkDocument } from '@/features/settings/communication/gql/query/inviteLink.generated';
import { toInviteLinkView } from '@/features/settings/communication/helpers/inviteLink.helpers';
import type { UseInviteLinkResult } from '@/features/settings/typedefs/inviteLink.typedefs';
import { ROLE_TO_API } from '@/shared/api/constants/workspaceRole.constants';

export function useInviteLink(): UseInviteLinkResult {
  const { data, loading } = useQuery(InviteLinkDocument, { fetchPolicy: 'network-only' });
  const [updateRole] = useMutation(UpdateInviteLinkRoleDocument, {
    update: (cache, { data: result }) => {
      if (result !== undefined && result !== null) {
        cache.writeQuery({
          query: InviteLinkDocument,
          data: { inviteLink: result.updateInviteLinkRole },
        });
      }
    },
  });
  const [resetLink] = useMutation(ResetInviteLinkDocument, {
    update: (cache, { data: result }) => {
      if (result !== undefined && result !== null) {
        cache.writeQuery({
          query: InviteLinkDocument,
          data: { inviteLink: result.resetInviteLink },
        });
      }
    },
  });

  const changeRole = useCallback(
    async (role: WorkspaceRole) => {
      await updateRole({ variables: { input: { role: ROLE_TO_API[role] } } });
    },
    [updateRole],
  );
  const reset = useCallback(async () => {
    await resetLink();
  }, [resetLink]);

  return { link: toInviteLinkView(data?.inviteLink ?? null), loading, changeRole, reset };
}

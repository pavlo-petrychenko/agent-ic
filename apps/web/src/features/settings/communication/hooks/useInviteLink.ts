import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { ResetInviteLinkDocument } from '@/features/settings/communication/gql/mutation/resetInviteLink.generated';
import { UpdateInviteLinkRoleDocument } from '@/features/settings/communication/gql/mutation/updateInviteLinkRole.generated';
import { InviteLinkDocument } from '@/features/settings/communication/gql/query/inviteLink.generated';
import { toInviteLinkView } from '@/features/settings/communication/helpers/inviteLink.helpers';
import type {
  UseInviteLinkOptions,
  UseInviteLinkResult,
} from '@/features/settings/typedefs/inviteLink.typedefs';

export function useInviteLink(
  { skip }: UseInviteLinkOptions = { skip: false },
): UseInviteLinkResult {
  const { data, loading } = useQuery(InviteLinkDocument, { fetchPolicy: 'network-only', skip });
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
    async (roleId: string) => {
      await updateRole({ variables: { input: { role: null, roleId } } });
    },
    [updateRole],
  );
  const reset = useCallback(async () => {
    await resetLink();
  }, [resetLink]);

  return { link: toInviteLinkView(data?.inviteLink ?? null), loading, changeRole, reset };
}

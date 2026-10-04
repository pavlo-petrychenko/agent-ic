import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { AcceptInviteDocument } from '@/features/auth/communication/gql/mutation/acceptInvite.generated';
import { MY_WORKSPACES_FIELD } from '@/features/auth/constants/workspaceStep.constants';

export function useAcceptInvite(): (token: string) => Promise<string | null> {
  const [acceptInvite] = useMutation(AcceptInviteDocument, {
    update: (cache) => {
      cache.evict({ fieldName: MY_WORKSPACES_FIELD });
      cache.gc();
    },
  });

  return useCallback(
    async (token) => {
      const { data } = await acceptInvite({ variables: { token } });
      return data?.acceptInvite.workspace.id ?? null;
    },
    [acceptInvite],
  );
}

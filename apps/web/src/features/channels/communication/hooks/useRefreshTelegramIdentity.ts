import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RefreshTelegramIdentityDocument } from '@/features/channels/communication/gql/mutation/refreshTelegramIdentity.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type { UseRefreshTelegramIdentityResult } from '@/features/channels/typedefs/telegram.typedefs';

export function useRefreshTelegramIdentity(): UseRefreshTelegramIdentityResult {
  const [refresh, { loading }] = useMutation(RefreshTelegramIdentityDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const refreshTelegramIdentity = useCallback(
    async (id: string) => {
      await refresh({ variables: { id } });
    },
    [refresh],
  );

  return { refreshTelegramIdentity, refreshing: loading };
}

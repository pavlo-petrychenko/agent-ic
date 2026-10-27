import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DisconnectTelegramDocument } from '@/features/channels/communication/gql/mutation/disconnectTelegram.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type { UseDisconnectTelegramResult } from '@/features/channels/typedefs/telegram.typedefs';

export function useDisconnectTelegram(): UseDisconnectTelegramResult {
  const [disconnect, { loading }] = useMutation(DisconnectTelegramDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const disconnectTelegram = useCallback(
    async (id: string) => {
      await disconnect({ variables: { id } });
    },
    [disconnect],
  );

  return { disconnectTelegram, disconnecting: loading };
}

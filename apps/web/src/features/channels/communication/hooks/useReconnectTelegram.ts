import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ReconnectTelegramDocument } from '@/features/channels/communication/gql/mutation/reconnectTelegram.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type { UseReconnectTelegramResult } from '@/features/channels/typedefs/telegram.typedefs';

export function useReconnectTelegram(): UseReconnectTelegramResult {
  const [reconnect, { loading }] = useMutation(ReconnectTelegramDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const reconnectTelegram = useCallback(
    async (id: string) => {
      await reconnect({ variables: { id } });
    },
    [reconnect],
  );

  return { reconnectTelegram, reconnecting: loading };
}

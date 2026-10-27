import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ConnectTelegramDocument } from '@/features/channels/communication/gql/mutation/connectTelegram.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  ConnectTelegramVariables,
  UseConnectTelegramResult,
} from '@/features/channels/typedefs/telegram.typedefs';

export function useConnectTelegram(): UseConnectTelegramResult {
  const [connect, { loading }] = useMutation(ConnectTelegramDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const connectTelegram = useCallback(
    async (variables: ConnectTelegramVariables): Promise<string> => {
      const result = await connect({ variables: { input: variables } });
      const channel = result.data?.connectTelegram;
      if (channel === undefined) {
        throw new Error('Telegram connect returned no channel');
      }
      return channel.id;
    },
    [connect],
  );

  return { connectTelegram, connecting: loading };
}

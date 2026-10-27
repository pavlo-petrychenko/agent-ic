import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ReplaceTelegramTokenDocument } from '@/features/channels/communication/gql/mutation/replaceTelegramToken.generated';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  ReplaceTelegramTokenVariables,
  UseReplaceTelegramTokenResult,
} from '@/features/channels/typedefs/telegram.typedefs';

export function useReplaceTelegramToken(): UseReplaceTelegramTokenResult {
  const [replace, { loading }] = useMutation(ReplaceTelegramTokenDocument, {
    refetchQueries: [ChannelDocument, ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const replaceTelegramToken = useCallback(
    async (variables: ReplaceTelegramTokenVariables) => {
      await replace({ variables: { input: variables } });
    },
    [replace],
  );

  return { replaceTelegramToken, replacing: loading };
}

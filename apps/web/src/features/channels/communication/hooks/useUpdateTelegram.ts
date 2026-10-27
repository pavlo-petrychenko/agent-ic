import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateTelegramDocument } from '@/features/channels/communication/gql/mutation/updateTelegram.generated';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  UpdateTelegramVariables,
  UseUpdateTelegramResult,
} from '@/features/channels/typedefs/telegram.typedefs';

export function useUpdateTelegram(): UseUpdateTelegramResult {
  const [update, { loading }] = useMutation(UpdateTelegramDocument, {
    refetchQueries: [ChannelDocument, ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const updateTelegram = useCallback(
    async (variables: UpdateTelegramVariables) => {
      await update({ variables: { input: variables } });
    },
    [update],
  );

  return { updateTelegram, saving: loading };
}

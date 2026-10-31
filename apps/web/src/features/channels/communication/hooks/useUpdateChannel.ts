import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateChannelDocument } from '@/features/channels/communication/gql/mutation/updateChannel.generated';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type {
  UpdateChannelVariables,
  UseUpdateChannelResult,
} from '@/features/channels/typedefs/channels.typedefs';

export function useUpdateChannel(): UseUpdateChannelResult {
  const [update, { loading }] = useMutation(UpdateChannelDocument, {
    refetchQueries: [ChannelDocument, ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const updateChannel = useCallback(
    async (variables: UpdateChannelVariables) => {
      await update({ variables: { input: variables } });
    },
    [update],
  );

  return { updateChannel, saving: loading };
}

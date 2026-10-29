import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteChannelDocument } from '@/features/channels/communication/gql/mutation/deleteChannel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import type { UseDeleteChannelResult } from '@/features/channels/typedefs/telegram.typedefs';

export function useDeleteChannel(): UseDeleteChannelResult {
  const [remove, { loading }] = useMutation(DeleteChannelDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const deleteChannel = useCallback(
    async (id: string) => {
      await remove({ variables: { id } });
    },
    [remove],
  );

  return { deleteChannel, deleting: loading };
}

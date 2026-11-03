import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RotateApiChannelKeyDocument } from '@/features/channels/communication/gql/mutation/rotateApiChannelKey.generated';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import { API_CHANNEL_HTTP_METHOD } from '@/features/channels/constants/apiChannel.constants';
import type { UseRotateApiChannelKeyResult } from '@/features/channels/typedefs/channels.typedefs';

export function useRotateApiChannelKey(): UseRotateApiChannelKeyResult {
  const [rotate, { loading }] = useMutation(RotateApiChannelKeyDocument, {
    refetchQueries: [ChannelDocument, ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const rotateApiChannelKey = useCallback(
    async (id: string) => {
      const result = await rotate({ variables: { id } });
      const payload = result.data?.rotateApiChannelKey;
      if (payload === undefined) {
        return null;
      }
      return {
        name: payload.channel.displayName,
        secret: payload.secret,
        endpoint:
          payload.channel.endpoint === null
            ? ''
            : `${API_CHANNEL_HTTP_METHOD} ${payload.channel.endpoint}`,
      };
    },
    [rotate],
  );

  return { rotateApiChannelKey, rotating: loading };
}

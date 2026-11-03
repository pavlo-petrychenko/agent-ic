import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateApiChannelDocument } from '@/features/channels/communication/gql/mutation/createApiChannel.generated';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import { API_CHANNEL_HTTP_METHOD } from '@/features/channels/constants/apiChannel.constants';
import type {
  CreateApiChannelVariables,
  UseCreateApiChannelResult,
} from '@/features/channels/typedefs/channels.typedefs';

export function useCreateApiChannel(): UseCreateApiChannelResult {
  const [create, { loading }] = useMutation(CreateApiChannelDocument, {
    refetchQueries: [ChannelsDocument],
    awaitRefetchQueries: true,
  });

  const createApiChannel = useCallback(
    async (variables: CreateApiChannelVariables) => {
      const result = await create({ variables: { input: variables } });
      const payload = result.data?.createApiChannel;
      if (payload === undefined) {
        return null;
      }
      return {
        name: payload.channel.displayName,
        secret: payload.secret,
        webhookSecret: payload.webhookSecret,
        endpoint:
          payload.channel.endpoint === null
            ? ''
            : `${API_CHANNEL_HTTP_METHOD} ${payload.channel.endpoint}`,
      };
    },
    [create],
  );

  return { createApiChannel, creating: loading };
}

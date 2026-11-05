import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import {
  isApiChannel,
  toApiChannelView,
} from '@/features/channels/communication/helpers/channel.helpers';
import type {
  ChannelAgent,
  UseApiChannelResult,
} from '@/features/channels/typedefs/channels.typedefs';

export function useApiChannel(id: string, agents: readonly ChannelAgent[]): UseApiChannelResult {
  const { data, loading, error, refetch } = useQuery(ChannelDocument, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  const channel = useMemo(() => {
    const found = data?.channel ?? null;
    if (found === null || !isApiChannel(found)) {
      return null;
    }
    const agentId = found.agentId;
    const agent =
      agentId === null ? null : (agents.find((candidate) => candidate.id === agentId) ?? null);
    return toApiChannelView(found, agent);
  }, [agents, data?.channel]);

  const retry = useCallback(() => void refetch().catch(() => undefined), [refetch]);

  return {
    channel,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}

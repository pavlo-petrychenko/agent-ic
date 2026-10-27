import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { ChannelDocument } from '@/features/channels/communication/gql/query/channel.generated';
import {
  isTelegramChannel,
  toTelegramChannelView,
} from '@/features/channels/communication/helpers/channel.helpers';
import type {
  ChannelAgent,
  UseChannelResult,
} from '@/features/channels/typedefs/channels.typedefs';

export function useChannel(id: string, agents: readonly ChannelAgent[]): UseChannelResult {
  const { data, loading, error, refetch } = useQuery(ChannelDocument, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  const channel = useMemo(() => {
    const found = data?.channel ?? null;
    if (found === null || !isTelegramChannel(found)) {
      return null;
    }
    const agentId = found.agentId;
    const agent =
      agentId === null ? null : (agents.find((candidate) => candidate.id === agentId) ?? null);
    return toTelegramChannelView(found, agent);
  }, [agents, data?.channel]);

  const retry = useCallback(() => void refetch().catch(() => undefined), [refetch]);

  return {
    channel,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}

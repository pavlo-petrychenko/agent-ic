import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { ChannelsDocument } from '@/features/channels/communication/gql/query/channels.generated';
import {
  isApiChannel,
  isTelegramChannel,
  toApiChannelSummary,
  toTelegramChannelSummary,
} from '@/features/channels/communication/helpers/channel.helpers';
import type {
  ChannelAgent,
  UseChannelsResult,
} from '@/features/channels/typedefs/channels.typedefs';

export function useChannels(agents: readonly ChannelAgent[]): UseChannelsResult {
  const { data, loading, error, refetch } = useQuery(ChannelsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const agentNames = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );
  const agentNameOf = useCallback(
    (agentId: string | null): string | null =>
      agentId === null ? null : (agentNames.get(agentId) ?? null),
    [agentNames],
  );
  const channels = useMemo(
    () =>
      (data?.channels ?? [])
        .filter(isTelegramChannel)
        .map((channel) => toTelegramChannelSummary(channel, agentNameOf(channel.agentId))),
    [agentNameOf, data?.channels],
  );
  const apiChannels = useMemo(
    () =>
      (data?.channels ?? [])
        .filter(isApiChannel)
        .map((channel) => toApiChannelSummary(channel, agentNameOf(channel.agentId))),
    [agentNameOf, data?.channels],
  );

  const retry = useCallback(() => void refetch().catch(() => undefined), [refetch]);

  return {
    channels,
    apiChannels,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}

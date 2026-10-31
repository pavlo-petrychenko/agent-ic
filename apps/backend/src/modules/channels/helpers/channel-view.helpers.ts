import { IdPrefix } from '@agent-ic/contracts';
import { channelDisplayName, channelFirstName } from '@/modules/channels/helpers/channel.helpers';
import type { ChannelRecord, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';

interface ChannelViewExtras {
  readonly tokenMasked?: string | null;
  readonly updatedByName?: string | null;
  readonly endpoint?: string | null;
}

export const toChannelView = (
  channel: ChannelRecord,
  ids: IdService,
  extras: ChannelViewExtras = {},
): ChannelView => {
  const apiIdentity = 'replyMode' in channel.identity ? channel.identity : null;
  return {
    id: ids.toPublic(IdPrefix.Channel, channel.id),
    kind: channel.kind,
    status: channel.status,
    agentId: channel.agentId === null ? null : ids.toPublic(IdPrefix.Agent, channel.agentId),
    displayName: channelDisplayName(channel.identity, channel.externalId),
    firstName: channelFirstName(channel.identity),
    tokenMasked: extras.tokenMasked ?? null,
    updatedByName: extras.updatedByName ?? null,
    showTyping: channel.showTyping,
    replyMode: apiIdentity?.replyMode ?? null,
    webhook: apiIdentity?.webhook ?? null,
    endpoint: extras.endpoint ?? null,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
  };
};

export const apiChannelEndpoint = (publicUrl: string, channelPublicId: string): string =>
  new URL(`/v1/channels/${channelPublicId}/messages`, publicUrl).toString();

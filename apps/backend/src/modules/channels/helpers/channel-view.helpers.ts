import { IdPrefix } from '@agent-ic/contracts';
import { channelDisplayName, channelFirstName } from '@/modules/channels/helpers/channel.helpers';
import type { ChannelRecord, ChannelView } from '@/modules/channels/typedefs/channel.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';

export const toChannelView = (
  channel: ChannelRecord,
  ids: IdService,
  tokenMasked: string | null = null,
): ChannelView => ({
  id: ids.toPublic(IdPrefix.Channel, channel.id),
  kind: channel.kind,
  status: channel.status,
  agentId: channel.agentId === null ? null : ids.toPublic(IdPrefix.Agent, channel.agentId),
  displayName: channelDisplayName(channel.identity, channel.externalId),
  firstName: channelFirstName(channel.identity),
  tokenMasked,
  showTyping: channel.showTyping,
  createdAt: channel.createdAt,
  updatedAt: channel.updatedAt,
});

import { channelDisplayName, channelReplyMode } from '@/modules/channels/helpers/channel.helpers';
import type { ChannelRecord, ChannelSummary } from '@/modules/channels/typedefs/channel.typedefs';

export const channelSummaryOf = (channel: ChannelRecord): ChannelSummary => {
  const username = 'username' in channel.identity ? channel.identity.username : '';
  return {
    name:
      username === '' ? channelDisplayName(channel.identity, channel.externalId) : `@${username}`,
    replyTarget: channelReplyMode(channel.identity),
  };
};

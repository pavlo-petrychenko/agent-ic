import type { ChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';

export const channelDisplayName = (identity: ChannelIdentity, fallback: string): string =>
  ('username' in identity ? identity.username : null) ||
  ('name' in identity ? identity.name : null) ||
  fallback;

export const channelFirstName = (identity: ChannelIdentity): string | null =>
  'firstName' in identity && typeof identity.firstName === 'string' ? identity.firstName : null;

export const channelUpdaterId = (
  channel: Pick<ChannelRecord, 'createdByUserId' | 'updatedByUserId'>,
): string => channel.updatedByUserId ?? channel.createdByUserId;

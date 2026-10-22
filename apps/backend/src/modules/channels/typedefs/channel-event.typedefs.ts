import type { channelEvents } from '@/modules/channels/db/channel-events.table';

export type ChannelEventRecord = typeof channelEvents.$inferSelect;

export type NewChannelEvent = typeof channelEvents.$inferInsert;

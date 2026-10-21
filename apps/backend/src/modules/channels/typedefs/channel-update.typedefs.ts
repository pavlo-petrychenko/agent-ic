import type { channelUpdates } from '@/modules/channels/db/channel-updates.table';

export type NewChannelUpdate = typeof channelUpdates.$inferInsert;

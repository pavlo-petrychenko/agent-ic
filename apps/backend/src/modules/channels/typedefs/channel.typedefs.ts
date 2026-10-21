import type { channels } from '@/modules/channels/db/channels.table';
import type { telegramChannels } from '@/modules/channels/db/telegram-channels.table';

export type ChannelRecord = typeof channels.$inferSelect;

export type NewChannel = typeof channels.$inferInsert;

export interface ChannelPatch {
  readonly status: ChannelRecord['status'];
  readonly agentId: string | null;
  readonly lastUpdateAt: Date | null;
  readonly updatedAt: Date;
}

export type TelegramChannelRecord = typeof telegramChannels.$inferSelect;

export type NewTelegramChannel = typeof telegramChannels.$inferInsert;

export type TelegramChannelPatch = Partial<
  Pick<
    TelegramChannelRecord,
    'name' | 'botId' | 'username' | 'tokenSealed' | 'webhookSecretHash' | 'showTyping'
  >
>;

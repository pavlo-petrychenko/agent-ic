import type { channels } from '@/modules/channels/db/channels.table';

export type ChannelRecord = typeof channels.$inferSelect;

export type NewChannel = typeof channels.$inferInsert;

export interface ChannelPatch {
  readonly status: ChannelRecord['status'];
  readonly agentId: string | null;
  readonly name: string;
  readonly telegramBotId: string | null;
  readonly telegramUsername: string | null;
  readonly tokenSealed: string | null;
  readonly webhookSecretHash: string | null;
  readonly showTyping: boolean;
  readonly lastUpdateAt: Date | null;
  readonly updatedAt: Date;
}

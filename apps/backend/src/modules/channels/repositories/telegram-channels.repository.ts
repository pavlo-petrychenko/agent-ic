import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { telegramChannels } from '@/modules/channels/db/telegram-channels.table';
import type {
  NewTelegramChannel,
  TelegramChannelPatch,
  TelegramChannelRecord,
} from '@/modules/channels/typedefs/channel.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class TelegramChannelsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(channel: NewTelegramChannel): Promise<void> {
    await this.txHost.tx.insert(telegramChannels).values(channel);
  }

  async findByChannelId(
    workspaceId: string,
    channelId: string,
  ): Promise<TelegramChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .select()
      .from(telegramChannels)
      .where(
        and(
          eq(telegramChannels.workspaceId, workspaceId),
          eq(telegramChannels.channelId, channelId),
        ),
      );
    return channel ?? null;
  }

  async update(
    workspaceId: string,
    channelId: string,
    patch: TelegramChannelPatch,
  ): Promise<TelegramChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(telegramChannels)
      .set(patch)
      .where(
        and(
          eq(telegramChannels.workspaceId, workspaceId),
          eq(telegramChannels.channelId, channelId),
        ),
      )
      .returning();
    return channel ?? null;
  }
}

import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { channelUpdates } from '@/modules/channels/db/channel-updates.table';
import type { NewChannelUpdate } from '@/modules/channels/typedefs/channel-update.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChannelUpdatesRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insertIfAbsent(update: NewChannelUpdate): Promise<boolean> {
    const inserted = await this.txHost.tx
      .insert(channelUpdates)
      .values(update)
      .onConflictDoNothing({
        target: [channelUpdates.channelId, channelUpdates.externalId],
      })
      .returning({ id: channelUpdates.id });
    return inserted.length > 0;
  }
}

import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { channelEvents } from '@/modules/channels/db/channel-events.table';
import type { NewChannelEvent } from '@/modules/channels/typedefs/channel-event.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChannelEventsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insertIfAbsent(event: NewChannelEvent): Promise<boolean> {
    const inserted = await this.txHost.tx
      .insert(channelEvents)
      .values(event)
      .onConflictDoNothing({
        target: [channelEvents.channelId, channelEvents.externalId],
      })
      .returning({ id: channelEvents.id });
    return inserted.length > 0;
  }
}

import { ChannelKind } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { channels } from '@/modules/channels/db/channels.table';
import type { TelegramPollerChannel } from '@/modules/channels/typedefs/telegram.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class TelegramPollerRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  listConnected(): Promise<TelegramPollerChannel[]> {
    return this.systemDb.db
      .select({
        id: channels.id,
        workspaceId: channels.workspaceId,
        credentialsSealed: channels.credentialsSealed,
      })
      .from(channels)
      .where(
        and(eq(channels.kind, ChannelKind.Telegram), eq(channels.status, ChannelStatus.Connected)),
      );
  }
}

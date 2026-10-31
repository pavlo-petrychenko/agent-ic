import { ChannelKind } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { channels } from '@/modules/channels/db/channels.table';
import type { ApiChannelIngressRecord } from '@/modules/channels/typedefs/channel.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class ApiChannelIngressRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  async findById(id: string): Promise<ApiChannelIngressRecord | null> {
    const [channel] = await this.systemDb.db
      .select({
        id: channels.id,
        workspaceId: channels.workspaceId,
        agentId: channels.agentId,
        identity: channels.identity,
        status: channels.status,
        credentialsSealed: channels.credentialsSealed,
      })
      .from(channels)
      .where(and(eq(channels.id, id), eq(channels.kind, ChannelKind.Api)));
    return channel ?? null;
  }
}

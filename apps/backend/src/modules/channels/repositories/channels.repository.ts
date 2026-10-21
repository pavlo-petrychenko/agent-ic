import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { channels } from '@/modules/channels/db/channels.table';
import type {
  ChannelPatch,
  ChannelRecord,
  NewChannel,
} from '@/modules/channels/typedefs/channel.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChannelsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(channel: NewChannel): Promise<void> {
    await this.txHost.tx.insert(channels).values(channel);
  }

  async findById(workspaceId: string, id: string): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .select()
      .from(channels)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)));
    return channel ?? null;
  }

  async findByIdForUpdate(workspaceId: string, id: string): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .select()
      .from(channels)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .for('update');
    return channel ?? null;
  }

  list(workspaceId: string): Promise<ChannelRecord[]> {
    return this.txHost.tx
      .select()
      .from(channels)
      .where(eq(channels.workspaceId, workspaceId))
      .orderBy(asc(channels.createdAt), asc(channels.id));
  }

  async update(
    workspaceId: string,
    id: string,
    patch: ChannelPatch,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(channels)
      .set(patch)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .returning();
    return channel ?? null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(channels)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .returning({ id: channels.id });
    return deleted.length > 0;
  }
}

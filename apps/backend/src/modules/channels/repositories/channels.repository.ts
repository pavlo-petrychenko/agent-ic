import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { channels } from '@/modules/channels/db/channels.table';
import type {
  ChannelCredentialsPatch,
  ChannelPatch,
  ChannelRecord,
  ChannelSettingsPatch,
  NewChannel,
} from '@/modules/channels/typedefs/channel.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChannelsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insertIfAbsent(channel: NewChannel): Promise<boolean> {
    const inserted = await this.txHost.tx
      .insert(channels)
      .values(channel)
      .onConflictDoNothing({ target: [channels.kind, channels.externalId] })
      .returning({ id: channels.id });
    return inserted.length > 0;
  }

  async findByKindAndExternalId(
    workspaceId: string,
    kind: ChannelRecord['kind'],
    externalId: string,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.workspaceId, workspaceId),
          eq(channels.kind, kind),
          eq(channels.externalId, externalId),
        ),
      );
    return channel ?? null;
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

  async updateStatus(
    workspaceId: string,
    id: string,
    status: ChannelRecord['status'],
    updatedAt: Date,
    updatedByUserId: string,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(channels)
      .set({ status, updatedAt, updatedByUserId })
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .returning();
    return channel ?? null;
  }

  async updateStatusIfCurrent(
    workspaceId: string,
    id: string,
    current: ChannelRecord['status'],
    next: ChannelRecord['status'],
    updatedAt: Date,
    updatedByUserId: string,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(channels)
      .set({ status: next, updatedAt, updatedByUserId })
      .where(
        and(
          eq(channels.workspaceId, workspaceId),
          eq(channels.id, id),
          eq(channels.status, current),
        ),
      )
      .returning();
    return channel ?? null;
  }

  async updateSettings(
    workspaceId: string,
    id: string,
    patch: ChannelSettingsPatch,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(channels)
      .set(patch)
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .returning();
    return channel ?? null;
  }

  async updateIdentity(
    workspaceId: string,
    id: string,
    identity: ChannelRecord['identity'],
    updatedAt: Date,
    updatedByUserId: string,
  ): Promise<ChannelRecord | null> {
    const [channel] = await this.txHost.tx
      .update(channels)
      .set({ identity, updatedAt, updatedByUserId })
      .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
      .returning();
    return channel ?? null;
  }

  async updateCredentials(
    workspaceId: string,
    id: string,
    patch: ChannelCredentialsPatch,
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

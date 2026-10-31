import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { sources } from '@/modules/knowledge/db/sources.table';
import type {
  NewSource,
  Source,
  SourceChanges,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SourcesRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(source: NewSource): Promise<Source> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(sources)
        .values({ ...source, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async findById(workspaceId: string, sourceId: string): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .select()
      .from(sources)
      .where(this.activeWhere(workspaceId, eq(sources.id, sourceId)));
    return source ?? null;
  }

  async findByIdIncludingDeleted(workspaceId: string, sourceId: string): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .select()
      .from(sources)
      .where(and(eq(sources.workspaceId, workspaceId), eq(sources.id, sourceId)));
    return source ?? null;
  }

  async findByIdForUpdate(workspaceId: string, sourceId: string): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .select()
      .from(sources)
      .where(this.activeWhere(workspaceId, eq(sources.id, sourceId)))
      .for('update');
    return source ?? null;
  }

  async update(
    workspaceId: string,
    sourceId: string,
    changes: SourceChanges,
  ): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .update(sources)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(this.activeWhere(workspaceId, eq(sources.id, sourceId)))
      .returning();
    return source ?? null;
  }

  async softDelete(workspaceId: string, sourceId: string, deletedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, sourceId, { deletedAt })) !== null;
  }

  async deleteById(workspaceId: string, sourceId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(sources)
      .where(and(eq(sources.workspaceId, workspaceId), eq(sources.id, sourceId)))
      .returning({ id: sources.id });
    return deleted.length > 0;
  }

  async listByKnowledgeBase(workspaceId: string, knowledgeBaseId: string): Promise<Source[]> {
    return this.txHost.tx
      .select()
      .from(sources)
      .where(this.activeWhere(workspaceId, eq(sources.kbId, knowledgeBaseId)))
      .orderBy(desc(sources.createdAt));
  }

  async hasActiveByKnowledgeBase(workspaceId: string, knowledgeBaseId: string): Promise<boolean> {
    const [source] = await this.txHost.tx
      .select({ id: sources.id })
      .from(sources)
      .where(this.activeWhere(workspaceId, eq(sources.kbId, knowledgeBaseId)))
      .limit(1);
    return source !== undefined;
  }

  async hasAnyByConnection(workspaceId: string, connectionId: string): Promise<boolean> {
    const [source] = await this.txHost.tx
      .select({ id: sources.id })
      .from(sources)
      .where(and(eq(sources.workspaceId, workspaceId), eq(sources.connectionId, connectionId)))
      .limit(1);
    return source !== undefined;
  }

  private activeWhere(workspaceId: string, ...conditions: SQL[]): SQL | undefined {
    return and(eq(sources.workspaceId, workspaceId), isNull(sources.deletedAt), ...conditions);
  }
}

import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { knowledgeNamesLockKey } from '@/modules/knowledge/helpers/knowledge-names.helpers';
import type {
  KnowledgeBase,
  KnowledgeBaseChanges,
  NewKnowledgeBase,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class KnowledgeBasesRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(knowledgeBase: NewKnowledgeBase): Promise<KnowledgeBase> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(knowledgeBases)
        .values({ ...knowledgeBase, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async lockNames(workspaceId: string): Promise<void> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${knowledgeNamesLockKey(workspaceId)}))`,
    );
  }

  async findById(workspaceId: string, knowledgeBaseId: string): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .select()
      .from(knowledgeBases)
      .where(this.activeWhere(workspaceId, eq(knowledgeBases.id, knowledgeBaseId)));
    return knowledgeBase ?? null;
  }

  async findByName(workspaceId: string, name: string): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .select()
      .from(knowledgeBases)
      .where(this.activeWhere(workspaceId, sql`lower(${knowledgeBases.name}) = lower(${name})`));
    return knowledgeBase ?? null;
  }

  async findByToolName(workspaceId: string, toolName: string): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .select()
      .from(knowledgeBases)
      .where(
        this.activeWhere(workspaceId, sql`lower(${knowledgeBases.toolName}) = lower(${toolName})`),
      );
    return knowledgeBase ?? null;
  }

  list(workspaceId: string): Promise<KnowledgeBase[]> {
    return this.txHost.tx
      .select()
      .from(knowledgeBases)
      .where(this.activeWhere(workspaceId))
      .orderBy(asc(knowledgeBases.id));
  }

  async update(
    workspaceId: string,
    knowledgeBaseId: string,
    changes: KnowledgeBaseChanges,
  ): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .update(knowledgeBases)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(this.activeWhere(workspaceId, eq(knowledgeBases.id, knowledgeBaseId)))
      .returning();
    return knowledgeBase ?? null;
  }

  async softDelete(
    workspaceId: string,
    knowledgeBaseId: string,
    deletedAt: Date,
  ): Promise<boolean> {
    return (await this.update(workspaceId, knowledgeBaseId, { deletedAt })) !== null;
  }

  private activeWhere(workspaceId: string, ...conditions: SQL[]): SQL | undefined {
    return and(
      eq(knowledgeBases.workspaceId, workspaceId),
      isNull(knowledgeBases.deletedAt),
      ...conditions,
    );
  }
}

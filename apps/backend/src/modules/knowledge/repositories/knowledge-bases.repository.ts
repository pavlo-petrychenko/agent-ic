import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
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

  async findById(workspaceId: string, knowledgeBaseId: string): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .select()
      .from(knowledgeBases)
      .where(this.activeWhere(workspaceId, knowledgeBaseId));
    return knowledgeBase ?? null;
  }

  async update(
    workspaceId: string,
    knowledgeBaseId: string,
    changes: KnowledgeBaseChanges,
  ): Promise<KnowledgeBase | null> {
    const [knowledgeBase] = await this.txHost.tx
      .update(knowledgeBases)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(this.activeWhere(workspaceId, knowledgeBaseId))
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

  private activeWhere(workspaceId: string, knowledgeBaseId: string) {
    return and(
      eq(knowledgeBases.workspaceId, workspaceId),
      eq(knowledgeBases.id, knowledgeBaseId),
      isNull(knowledgeBases.deletedAt),
    );
  }
}

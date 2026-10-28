import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { KNOWLEDGE_WRITE_BATCH_SIZE } from '@/modules/knowledge/constants/knowledge.constants';
import { chunkTerms } from '@/modules/knowledge/db/chunk-terms.table';
import type {
  ChunkTerm,
  ChunkTermChanges,
  NewChunkTerm,
} from '@/modules/knowledge/typedefs/chunk-term.typedefs';
import { rowBatches } from '@/platform/database/helpers/row-batch.helpers';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChunkTermsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(chunkTerm: NewChunkTerm): Promise<ChunkTerm> {
    return storedRow(await this.txHost.tx.insert(chunkTerms).values(chunkTerm).returning());
  }

  async insertMany(chunkTermsToInsert: readonly NewChunkTerm[]): Promise<void> {
    for (const batch of rowBatches(chunkTermsToInsert, KNOWLEDGE_WRITE_BATCH_SIZE)) {
      await this.txHost.tx.insert(chunkTerms).values([...batch]);
    }
  }

  async find(workspaceId: string, chunkId: string, term: string): Promise<ChunkTerm | null> {
    const [chunkTerm] = await this.txHost.tx
      .select()
      .from(chunkTerms)
      .where(this.termWhere(workspaceId, chunkId, term));
    return chunkTerm ?? null;
  }

  async update(
    workspaceId: string,
    chunkId: string,
    term: string,
    changes: ChunkTermChanges,
  ): Promise<ChunkTerm | null> {
    const [chunkTerm] = await this.txHost.tx
      .update(chunkTerms)
      .set(changes)
      .where(this.termWhere(workspaceId, chunkId, term))
      .returning();
    return chunkTerm ?? null;
  }

  async deleteById(workspaceId: string, chunkId: string, term: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(chunkTerms)
      .where(this.termWhere(workspaceId, chunkId, term))
      .returning({ chunkId: chunkTerms.chunkId });
    return deleted.length > 0;
  }

  async deleteByKnowledgeBase(workspaceId: string, knowledgeBaseId: string): Promise<number> {
    const deleted = await this.txHost.tx
      .delete(chunkTerms)
      .where(and(eq(chunkTerms.workspaceId, workspaceId), eq(chunkTerms.kbId, knowledgeBaseId)))
      .returning({ chunkId: chunkTerms.chunkId });
    return deleted.length;
  }

  private termWhere(workspaceId: string, chunkId: string, term: string) {
    return and(
      eq(chunkTerms.workspaceId, workspaceId),
      eq(chunkTerms.chunkId, chunkId),
      eq(chunkTerms.term, term),
    );
  }
}

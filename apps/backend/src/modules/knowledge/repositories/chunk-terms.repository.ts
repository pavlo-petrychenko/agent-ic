import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { chunkTerms } from '@/modules/knowledge/db/chunk-terms.table';
import type {
  ChunkTerm,
  ChunkTermChanges,
  NewChunkTerm,
} from '@/modules/knowledge/typedefs/chunk-term.typedefs';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChunkTermsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(chunkTerm: NewChunkTerm): Promise<ChunkTerm> {
    return storedRow(await this.txHost.tx.insert(chunkTerms).values(chunkTerm).returning());
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

  private termWhere(workspaceId: string, chunkId: string, term: string) {
    return and(
      eq(chunkTerms.workspaceId, workspaceId),
      eq(chunkTerms.chunkId, chunkId),
      eq(chunkTerms.term, term),
    );
  }
}

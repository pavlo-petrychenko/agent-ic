import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, countDistinct, eq, gt, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { chunks } from '@/modules/knowledge/db/chunks.table';
import { documents } from '@/modules/knowledge/db/documents.table';
import type { KnowledgeCounts } from '@/modules/knowledge/typedefs/knowledge-ingestion.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class KnowledgeStatsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  sourceCounts(workspaceId: string, sourceId: string): Promise<KnowledgeCounts> {
    return this.counts(workspaceId, eq(documents.sourceId, sourceId));
  }

  knowledgeBaseCounts(workspaceId: string, knowledgeBaseId: string): Promise<KnowledgeCounts> {
    return this.counts(workspaceId, eq(documents.kbId, knowledgeBaseId));
  }

  private async counts(workspaceId: string, condition: SQL): Promise<KnowledgeCounts> {
    const [row] = await this.txHost.tx
      .select({
        documentCount: countDistinct(documents.id),
        chunkCount: count(chunks.id),
      })
      .from(documents)
      .leftJoin(
        chunks,
        and(
          eq(chunks.workspaceId, documents.workspaceId),
          eq(chunks.documentId, documents.id),
          eq(chunks.generation, documents.activeGeneration),
        ),
      )
      .where(
        and(
          eq(documents.workspaceId, workspaceId),
          gt(documents.activeGeneration, 0),
          isNull(documents.deletedAt),
          condition,
        ),
      );
    return {
      documentCount: row?.documentCount ?? 0,
      chunkCount: row?.chunkCount ?? 0,
    };
  }
}

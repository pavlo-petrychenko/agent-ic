import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, countDistinct, eq, gt, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { chunks } from '@/modules/knowledge/db/chunks.table';
import { documents } from '@/modules/knowledge/db/documents.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { sourceDocuments } from '@/modules/knowledge/db/source-documents.table';
import type {
  KnowledgeCounts,
  KnowledgeSourceCounts,
} from '@/modules/knowledge/typedefs/knowledge-ingestion.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class KnowledgeStatsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async sourceCounts(workspaceId: string, sourceId: string): Promise<KnowledgeSourceCounts> {
    const [row] = await this.txHost.tx
      .select({
        documentCount: countDistinct(documents.id),
        chunkCount: count(chunks.id),
        staleDocumentCount: countDistinct(
          sql`case when ${documents.staleAt} is not null then ${documents.id} end`,
        ),
      })
      .from(documents)
      .innerJoin(
        sourceDocuments,
        and(
          eq(sourceDocuments.workspaceId, documents.workspaceId),
          eq(sourceDocuments.documentId, documents.id),
        ),
      )
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
          eq(sourceDocuments.sourceId, sourceId),
          gt(documents.activeGeneration, 0),
          isNull(documents.deletedAt),
        ),
      );
    return {
      documentCount: row?.documentCount ?? 0,
      chunkCount: row?.chunkCount ?? 0,
      staleDocumentCount: row?.staleDocumentCount ?? 0,
    };
  }

  knowledgeBaseCounts(workspaceId: string, knowledgeBaseId: string): Promise<KnowledgeCounts> {
    return this.counts(workspaceId, eq(documents.kbId, knowledgeBaseId));
  }

  async workspaceChunkCount(workspaceId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ chunkCount: count(chunks.id) })
      .from(chunks)
      .innerJoin(
        documents,
        and(eq(documents.workspaceId, chunks.workspaceId), eq(documents.id, chunks.documentId)),
      )
      .innerJoin(
        knowledgeBases,
        and(
          eq(knowledgeBases.workspaceId, documents.workspaceId),
          eq(knowledgeBases.id, documents.kbId),
        ),
      )
      .where(
        and(
          eq(chunks.workspaceId, workspaceId),
          eq(chunks.generation, documents.activeGeneration),
          gt(documents.activeGeneration, 0),
          isNull(documents.deletedAt),
          isNull(knowledgeBases.deletedAt),
        ),
      );
    return row?.chunkCount ?? 0;
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

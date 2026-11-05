import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { sourceDocuments } from '@/modules/knowledge/db/source-documents.table';
import { sources } from '@/modules/knowledge/db/sources.table';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SourceDocumentsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insertMany(
    workspaceId: string,
    knowledgeBaseId: string,
    sourceId: string,
    documentIds: readonly string[],
  ): Promise<void> {
    if (documentIds.length === 0) {
      return;
    }
    const now = this.clock.now();
    await this.txHost.tx
      .insert(sourceDocuments)
      .values(
        documentIds.map((documentId) => ({
          workspaceId,
          kbId: knowledgeBaseId,
          sourceId,
          documentId,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing();
  }

  async listOtherSourceIds(
    workspaceId: string,
    documentId: string,
    excludedSourceId: string,
  ): Promise<string[]> {
    const rows = await this.txHost.tx
      .select({ sourceId: sourceDocuments.sourceId })
      .from(sourceDocuments)
      .innerJoin(
        sources,
        and(
          eq(sources.workspaceId, sourceDocuments.workspaceId),
          eq(sources.id, sourceDocuments.sourceId),
        ),
      )
      .where(
        and(
          eq(sourceDocuments.workspaceId, workspaceId),
          eq(sourceDocuments.documentId, documentId),
          ne(sourceDocuments.sourceId, excludedSourceId),
          isNull(sources.deletedAt),
        ),
      )
      .orderBy(asc(sourceDocuments.createdAt), asc(sourceDocuments.sourceId));
    return rows.map((row) => row.sourceId);
  }

  async listSourceIdsByDocumentIds(
    workspaceId: string,
    documentIds: readonly string[],
  ): Promise<string[]> {
    if (documentIds.length === 0) {
      return [];
    }
    const rows = await this.txHost.tx
      .select({ sourceId: sourceDocuments.sourceId })
      .from(sourceDocuments)
      .innerJoin(
        sources,
        and(
          eq(sources.workspaceId, sourceDocuments.workspaceId),
          eq(sources.id, sourceDocuments.sourceId),
        ),
      )
      .where(
        and(
          eq(sourceDocuments.workspaceId, workspaceId),
          inArray(sourceDocuments.documentId, [...documentIds]),
          isNull(sources.deletedAt),
        ),
      )
      .groupBy(sourceDocuments.sourceId);
    return rows.map((row) => row.sourceId);
  }

  async deleteBySource(workspaceId: string, sourceId: string): Promise<void> {
    await this.txHost.tx
      .delete(sourceDocuments)
      .where(
        and(eq(sourceDocuments.workspaceId, workspaceId), eq(sourceDocuments.sourceId, sourceId)),
      );
  }

  async deleteLink(workspaceId: string, sourceId: string, documentId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(sourceDocuments)
      .where(
        and(
          eq(sourceDocuments.workspaceId, workspaceId),
          eq(sourceDocuments.sourceId, sourceId),
          eq(sourceDocuments.documentId, documentId),
        ),
      )
      .returning({ documentId: sourceDocuments.documentId });
    return deleted.length > 0;
  }
}

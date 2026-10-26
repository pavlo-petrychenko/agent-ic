import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { documents } from '@/modules/knowledge/db/documents.table';
import type {
  Document,
  DocumentChanges,
  NewDocument,
} from '@/modules/knowledge/typedefs/document.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class DocumentsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(document: NewDocument): Promise<Document> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(documents)
        .values({ ...document, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async insertIfAbsent(document: NewDocument): Promise<Document | null> {
    const now = this.clock.now();
    const [stored] = await this.txHost.tx
      .insert(documents)
      .values({ ...document, createdAt: now, updatedAt: now })
      .onConflictDoNothing({ target: documents.id })
      .returning();
    return stored ?? null;
  }

  async findById(workspaceId: string, documentId: string): Promise<Document | null> {
    const [document] = await this.txHost.tx
      .select()
      .from(documents)
      .where(this.activeWhere(workspaceId, eq(documents.id, documentId)));
    return document ?? null;
  }

  async findActiveBySource(workspaceId: string, sourceId: string): Promise<Document | null> {
    const [document] = await this.txHost.tx
      .select()
      .from(documents)
      .where(this.activeWhere(workspaceId, eq(documents.sourceId, sourceId)))
      .limit(1);
    return document ?? null;
  }

  async listBySource(workspaceId: string, sourceId: string): Promise<Document[]> {
    return this.txHost.tx
      .select()
      .from(documents)
      .where(this.activeWhere(workspaceId, eq(documents.sourceId, sourceId)))
      .orderBy(asc(documents.createdAt), asc(documents.id));
  }

  async update(
    workspaceId: string,
    documentId: string,
    changes: DocumentChanges,
  ): Promise<Document | null> {
    const [document] = await this.txHost.tx
      .update(documents)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(this.activeWhere(workspaceId, eq(documents.id, documentId)))
      .returning();
    return document ?? null;
  }

  async softDelete(workspaceId: string, documentId: string, deletedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, documentId, { deletedAt })) !== null;
  }

  private activeWhere(workspaceId: string, ...conditions: SQL[]): SQL | undefined {
    return and(eq(documents.workspaceId, workspaceId), isNull(documents.deletedAt), ...conditions);
  }
}

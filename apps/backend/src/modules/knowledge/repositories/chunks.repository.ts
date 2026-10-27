import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { KNOWLEDGE_WRITE_BATCH_SIZE } from '@/modules/knowledge/constants/knowledge.constants';
import { chunks } from '@/modules/knowledge/db/chunks.table';
import type { Chunk, ChunkChanges, NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { rowBatches } from '@/platform/database/helpers/row-batch.helpers';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ChunksRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(chunk: NewChunk): Promise<Chunk> {
    return storedRow(
      await this.txHost.tx
        .insert(chunks)
        .values({ ...chunk, createdAt: this.clock.now() })
        .returning(),
    );
  }

  async insertMany(chunksToInsert: readonly NewChunk[]): Promise<void> {
    const createdAt = this.clock.now();
    for (const batch of rowBatches(chunksToInsert, KNOWLEDGE_WRITE_BATCH_SIZE)) {
      await this.txHost.tx.insert(chunks).values(batch.map((chunk) => ({ ...chunk, createdAt })));
    }
  }

  async findById(workspaceId: string, chunkId: string): Promise<Chunk | null> {
    const [chunk] = await this.txHost.tx
      .select()
      .from(chunks)
      .where(and(eq(chunks.workspaceId, workspaceId), eq(chunks.id, chunkId)));
    return chunk ?? null;
  }

  async update(workspaceId: string, chunkId: string, changes: ChunkChanges): Promise<Chunk | null> {
    const [chunk] = await this.txHost.tx
      .update(chunks)
      .set(changes)
      .where(and(eq(chunks.workspaceId, workspaceId), eq(chunks.id, chunkId)))
      .returning();
    return chunk ?? null;
  }

  async deleteById(workspaceId: string, chunkId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(chunks)
      .where(and(eq(chunks.workspaceId, workspaceId), eq(chunks.id, chunkId)))
      .returning({ id: chunks.id });
    return deleted.length > 0;
  }

  async deleteByDocument(workspaceId: string, documentId: string): Promise<number> {
    const deleted = await this.txHost.tx
      .delete(chunks)
      .where(and(eq(chunks.workspaceId, workspaceId), eq(chunks.documentId, documentId)))
      .returning({ id: chunks.id });
    return deleted.length;
  }

  async deleteByKnowledgeBase(workspaceId: string, knowledgeBaseId: string): Promise<number> {
    const deleted = await this.txHost.tx
      .delete(chunks)
      .where(and(eq(chunks.workspaceId, workspaceId), eq(chunks.kbId, knowledgeBaseId)))
      .returning({ id: chunks.id });
    return deleted.length;
  }
}

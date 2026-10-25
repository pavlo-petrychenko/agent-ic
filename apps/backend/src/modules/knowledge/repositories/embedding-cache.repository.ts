import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { embeddingCache } from '@/modules/knowledge/db/embedding-cache.table';
import type {
  EmbeddingCacheChanges,
  EmbeddingCacheEntry,
  NewEmbeddingCacheEntry,
} from '@/modules/knowledge/typedefs/embedding-cache.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class EmbeddingCacheRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(entry: NewEmbeddingCacheEntry): Promise<EmbeddingCacheEntry> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(embeddingCache)
        .values({ ...entry, createdAt: now, lastUsedAt: now })
        .returning(),
    );
  }

  async find(
    workspaceId: string,
    model: string,
    dimensions: number,
    textHash: string,
  ): Promise<EmbeddingCacheEntry | null> {
    const [entry] = await this.txHost.tx
      .select()
      .from(embeddingCache)
      .where(this.entryWhere(workspaceId, model, dimensions, textHash));
    return entry ?? null;
  }

  async update(
    workspaceId: string,
    model: string,
    dimensions: number,
    textHash: string,
    changes: EmbeddingCacheChanges,
  ): Promise<EmbeddingCacheEntry | null> {
    const [entry] = await this.txHost.tx
      .update(embeddingCache)
      .set({ ...changes, lastUsedAt: this.clock.now() })
      .where(this.entryWhere(workspaceId, model, dimensions, textHash))
      .returning();
    return entry ?? null;
  }

  async deleteById(
    workspaceId: string,
    model: string,
    dimensions: number,
    textHash: string,
  ): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(embeddingCache)
      .where(this.entryWhere(workspaceId, model, dimensions, textHash))
      .returning({ textHash: embeddingCache.textHash });
    return deleted.length > 0;
  }

  private entryWhere(workspaceId: string, model: string, dimensions: number, textHash: string) {
    return and(
      eq(embeddingCache.workspaceId, workspaceId),
      eq(embeddingCache.model, model),
      eq(embeddingCache.dimensions, dimensions),
      eq(embeddingCache.textHash, textHash),
    );
  }
}

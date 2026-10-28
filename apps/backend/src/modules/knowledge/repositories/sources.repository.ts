import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { sources } from '@/modules/knowledge/db/sources.table';
import type {
  NewSource,
  Source,
  SourceChanges,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SourcesRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(source: NewSource): Promise<Source> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(sources)
        .values({ ...source, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async findById(workspaceId: string, sourceId: string): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .select()
      .from(sources)
      .where(this.activeWhere(workspaceId, sourceId));
    return source ?? null;
  }

  async update(
    workspaceId: string,
    sourceId: string,
    changes: SourceChanges,
  ): Promise<Source | null> {
    const [source] = await this.txHost.tx
      .update(sources)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(this.activeWhere(workspaceId, sourceId))
      .returning();
    return source ?? null;
  }

  async softDelete(workspaceId: string, sourceId: string, deletedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, sourceId, { deletedAt })) !== null;
  }

  private activeWhere(workspaceId: string, sourceId: string) {
    return and(
      eq(sources.workspaceId, workspaceId),
      eq(sources.id, sourceId),
      isNull(sources.deletedAt),
    );
  }
}

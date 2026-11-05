import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeLogMessage } from '@/modules/knowledge/constants/knowledge-log.constants';
import { KnowledgeScheduledSyncSkipReason } from '@/modules/knowledge/constants/knowledge-schedule.constants';
import {
  KnowledgeConnectionStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { nextSourceSyncAt } from '@/modules/knowledge/helpers/knowledge-schedule.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { KnowledgeSourceSyncService } from '@/modules/knowledge/services/knowledge-source-sync.service';
import type { ScheduledKnowledgeSourceSyncJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ScheduledKnowledgeSourceSyncUseCase {
  private readonly logger = new Logger(ScheduledKnowledgeSourceSyncUseCase.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly connections: ConnectionsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly sync: KnowledgeSourceSyncService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, { sourceId }: ScheduledKnowledgeSourceSyncJobData): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const skipped = await this.tenants.run(
      workspaceId,
      async (): Promise<KnowledgeScheduledSyncSkipReason | null> => {
        const source = await this.sources.findByIdForUpdate(workspaceId, sourceId);
        if (source === null || source.syncInterval === null) {
          return null;
        }
        const now = this.clock.now();
        if (source.nextSyncAt === null || source.nextSyncAt.getTime() > now.getTime()) {
          return null;
        }
        const nextSyncAt = nextSourceSyncAt(source, now);
        const activeRun = await this.syncRuns.findActiveBySource(workspaceId, source.id);
        if (
          activeRun !== null ||
          source.status === KnowledgeSourceStatus.Pending ||
          source.status === KnowledgeSourceStatus.Indexing
        ) {
          await this.advance(workspaceId, source.id, nextSyncAt);
          return KnowledgeScheduledSyncSkipReason.Busy;
        }
        if (
          source.kind !== KnowledgeSourceKind.GoogleDocs ||
          source.status !== KnowledgeSourceStatus.Ready ||
          source.connectionId === null
        ) {
          await this.advance(workspaceId, source.id, nextSyncAt);
          return KnowledgeScheduledSyncSkipReason.NotReady;
        }
        const connection = await this.connections.findById(workspaceId, source.connectionId);
        if (connection === null || connection.status !== KnowledgeConnectionStatus.Active) {
          await this.advance(workspaceId, source.id, nextSyncAt);
          return KnowledgeScheduledSyncSkipReason.ConnectionInactive;
        }
        const documents = await this.sync.documentsForScheduledSync(workspaceId, source);
        if (documents.length === 0) {
          await this.advance(workspaceId, source.id, nextSyncAt);
          return KnowledgeScheduledSyncSkipReason.NoDocuments;
        }
        await this.sync.queue({
          ctx,
          workspaceId,
          source,
          documents,
          resetFailedDocuments: false,
          trigger: KnowledgeSyncTrigger.Scheduled,
        });
        await this.advance(workspaceId, source.id, nextSyncAt);
        return null;
      },
    );
    if (skipped !== null) {
      this.logger.warn({
        msg: KnowledgeLogMessage.ScheduledSyncSkipped,
        sourceId,
        reason: skipped,
      });
    }
  }

  private async advance(workspaceId: string, sourceId: string, nextSyncAt: Date): Promise<void> {
    await this.sources.update(workspaceId, sourceId, { nextSyncAt });
  }
}

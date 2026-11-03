import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  KnowledgeConnectionStatus,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { KnowledgeSourceNotRetryableError } from '@/modules/knowledge/errors/knowledge-source-not-retryable.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { retryKnowledgeSourceInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceSyncService } from '@/modules/knowledge/services/knowledge-source-sync.service';
import type { RetryKnowledgeSourceInput } from '@/modules/knowledge/typedefs/source.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RetryKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly connections: ConnectionsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly sync: KnowledgeSourceSyncService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: RetryKnowledgeSourceInput,
  ): Promise<RetryKnowledgeSourceInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(retryKnowledgeSourceInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.id);

    await this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findByIdForUpdate(workspaceId, sourceId);
      if (source === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      const activeRun = await this.syncRuns.findActiveBySource(workspaceId, source.id);
      if (
        source.status === KnowledgeSourceStatus.Pending ||
        source.status === KnowledgeSourceStatus.Indexing ||
        activeRun !== null
      ) {
        throw new KnowledgeSourceBusyError();
      }
      if (source.status !== KnowledgeSourceStatus.Error) {
        throw new KnowledgeSourceNotRetryableError();
      }
      if (source.connectionId !== null) {
        const connection = await this.connections.findById(workspaceId, source.connectionId);
        if (connection === null || connection.status !== KnowledgeConnectionStatus.Active) {
          throw new GoogleReconnectRequiredError();
        }
      }

      const documents = await this.sync.documentsForManualSync(workspaceId, source);
      if (documents.length === 0) {
        throw new KnowledgeSourceNotRetryableError();
      }

      await this.sync.queue({
        ctx,
        workspaceId,
        source,
        documents,
        resetFailedDocuments: true,
      });
    });

    return { id: parsed.id };
  }
}

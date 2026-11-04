import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { WorkspacesRepository } from '@/modules/identity';
import { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { KnowledgeSourceNotSyncableError } from '@/modules/knowledge/errors/knowledge-source-not-syncable.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { sourceScheduleFields } from '@/modules/knowledge/helpers/knowledge-schedule.helpers';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { updateKnowledgeSourceScheduleInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type {
  KnowledgeSourceView,
  UpdateKnowledgeSourceScheduleInput,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateKnowledgeSourceScheduleUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: UpdateKnowledgeSourceScheduleInput,
  ): Promise<KnowledgeSourceView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(updateKnowledgeSourceScheduleInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.id);

    return this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findByIdForUpdate(workspaceId, sourceId);
      if (source === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      if (source.kind !== KnowledgeSourceKind.GoogleDocs) {
        throw new KnowledgeSourceNotSyncableError();
      }
      const workspace = await this.workspaces.findById(workspaceId);
      if (workspace === null) {
        throw new WorkspaceAccessDeniedError();
      }
      const updated = await this.sources.update(
        workspaceId,
        source.id,
        sourceScheduleFields(parsed, workspace.timeZone, this.clock.now()),
      );
      if (updated === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      return this.views.view(updated);
    });
  }
}

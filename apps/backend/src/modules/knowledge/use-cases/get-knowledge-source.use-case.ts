import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { getKnowledgeSourceInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeConnectionViewsService } from '@/modules/knowledge/services/knowledge-connection-views.service';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type {
  GetKnowledgeSourceInput,
  KnowledgeSourceDetailView,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly connections: ConnectionsRepository,
    private readonly documents: DocumentsRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly connectionViews: KnowledgeConnectionViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: GetKnowledgeSourceInput,
  ): Promise<KnowledgeSourceDetailView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    const parsed = parseKnowledgeInput(getKnowledgeSourceInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.id);

    return this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findById(workspaceId, sourceId);
      if (source === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      const connection =
        source.connectionId === null
          ? null
          : await this.connections.findById(workspaceId, source.connectionId);
      const documents = await this.documents.listBySource(workspaceId, source.id);
      return {
        source: this.views.view(source),
        connection: connection === null ? null : this.connectionViews.view(connection),
        documents: this.views.documentViews(documents),
      };
    });
  }
}

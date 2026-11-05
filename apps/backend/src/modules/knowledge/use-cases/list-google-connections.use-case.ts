import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { KnowledgeConnectionViewsService } from '@/modules/knowledge/services/knowledge-connection-views.service';
import type { KnowledgeConnectionView } from '@/modules/knowledge/typedefs/connection.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListGoogleConnectionsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly connections: ConnectionsRepository,
    private readonly views: KnowledgeConnectionViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<KnowledgeConnectionView[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    return this.tenants.run(workspaceId, async () =>
      this.views.views(await this.connections.listByWorkspace(workspaceId)),
    );
  }
}

import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeConnectionInUseError } from '@/modules/knowledge/errors/knowledge-connection-in-use.error';
import { KnowledgeConnectionNotFoundError } from '@/modules/knowledge/errors/knowledge-connection-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { disconnectGoogleConnectionInputSchema } from '@/modules/knowledge/schemas/google-oauth.schema';
import type { DisconnectGoogleConnectionInput } from '@/modules/knowledge/typedefs/connection.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DisconnectGoogleConnectionUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly connections: ConnectionsRepository,
    private readonly sources: SourcesRepository,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: DisconnectGoogleConnectionInput,
  ): Promise<DisconnectGoogleConnectionInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(disconnectGoogleConnectionInputSchema, input);
    const connectionId = this.ids.fromPublic(IdPrefix.KnowledgeConnection, parsed.id);
    await this.tenants.run(workspaceId, async () => {
      const connection = await this.connections.findByIdForUpdate(workspaceId, connectionId);
      if (connection === null) {
        throw new KnowledgeConnectionNotFoundError();
      }
      if (await this.sources.hasAnyByConnection(workspaceId, connectionId)) {
        throw new KnowledgeConnectionInUseError();
      }
      await this.connections.deleteById(workspaceId, connectionId);
    });
    return { id: parsed.id };
  }
}

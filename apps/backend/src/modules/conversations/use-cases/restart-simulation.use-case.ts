import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { simulationAgentSchema } from '@/modules/conversations/schemas/simulation.schema';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  SimulationAgentInput,
  SimulationView,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RestartSimulationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly simulations: SimulationsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SimulationAgentInput): Promise<SimulationView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    const { agentId } = parseConversationInput(simulationAgentSchema, input);
    const key = {
      workspaceId,
      agentId: this.ids.fromPublic(IdPrefix.Agent, agentId),
      endUserExternalId: userId,
    };
    return this.tenants.run(workspaceId, async () => {
      const latest = await this.simulations.findLatest(key);
      if (latest === null) {
        throw new ConversationNotFoundError(agentId);
      }
      return this.simulations.view(await this.simulations.restart(latest));
    });
  }
}

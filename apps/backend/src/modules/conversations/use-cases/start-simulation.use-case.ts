import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { hasSimulationSetup } from '@/modules/conversations/helpers/simulation.helpers';
import { startSimulationSchema } from '@/modules/conversations/schemas/simulation.schema';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  SimulationView,
  StartSimulationInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class StartSimulationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly simulations: SimulationsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: StartSimulationInput): Promise<SimulationView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    const parsed = parseConversationInput(startSimulationSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, parsed.agentId);
    const { versionId } = parsed;
    const pinned =
      versionId === null ? null : this.ids.fromPublic(IdPrefix.AgentVersion, versionId);
    const setup = { channelKind: parsed.channelKind, language: parsed.language, versionId: pinned };
    const key = { workspaceId, agentId, endUserExternalId: userId };
    return this.tenants.run(workspaceId, async () => {
      await this.agents.getAgent(workspaceId, agentId);
      if (pinned !== null) {
        await this.agents.getPublishedVersion(workspaceId, agentId, pinned);
      }
      const latest = await this.simulations.findLatest(key);
      if (latest !== null && hasSimulationSetup(latest, setup)) {
        return this.simulations.view(latest);
      }
      if (latest !== null && latest.state !== ConversationState.Closed) {
        await this.simulations.close(latest);
      }
      return this.simulations.view(await this.simulations.open(key, setup));
    });
  }
}

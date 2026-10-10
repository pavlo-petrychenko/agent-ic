import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { FlowIssueSeverity } from '@agent-ic/flow';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { SimulatorCheckStatus } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { agentDraftInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import { SimulatorTestsReader } from '@/modules/agents/services/simulator-tests-reader.service';
import type {
  PublishPreview,
  PublishPreviewInput,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PreviewAgentPublishUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly flows: AgentFlowService,
    private readonly views: AgentViewsService,
    private readonly ids: IdService,
    @Optional()
    @Inject(SimulatorTestsReader)
    private readonly simulatorTests?: SimulatorTestsReader,
  ) {}

  async execute(ctx: UseCaseCtx, input: PublishPreviewInput): Promise<PublishPreview> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Publish);
    const { agentId: publicId } = parseAgentInput(agentDraftInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, publicId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.agents.findById(workspaceId, agentId);
      if (agent === null) {
        throw new AgentNotFoundError();
      }
      const draft = await this.versions.findDraft(workspaceId, agentId);
      if (draft === null) {
        throw new AgentVersionNotFoundError();
      }
      const issues = this.flows.validate(draft.flow);
      const testedAt =
        (await this.simulatorTests?.lastTestedAt(workspaceId, agentId, draft.revision)) ?? null;
      return {
        diff: await this.views.draftDiff(agent, draft),
        errors: issues.filter((issue) => issue.severity === FlowIssueSeverity.Error),
        warnings: issues.filter((issue) => issue.severity === FlowIssueSeverity.Warning),
        simulator: {
          status: testedAt === null ? SimulatorCheckStatus.NotTested : SimulatorCheckStatus.Tested,
          testedAt,
        },
      };
    });
  }
}

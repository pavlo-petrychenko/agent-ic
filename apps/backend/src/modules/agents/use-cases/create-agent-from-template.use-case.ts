import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { createAgentFromTemplateInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import { AgentTemplatesService } from '@/modules/agents/services/agent-templates.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type { CreateAgentFromTemplateInput } from '@/modules/agents/typedefs/agent-template.typedefs';
import type { AgentView } from '@/modules/agents/typedefs/agent.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CreateAgentFromTemplateUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly templates: AgentTemplatesService,
    private readonly views: AgentViewsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateAgentFromTemplateInput): Promise<AgentView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Agents,
      PermissionAction.Edit,
    );
    authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    const { templateKey, name, knowledgeBaseIds } = parseAgentInput(
      createAgentFromTemplateInputSchema,
      input,
    );
    return this.tenantTransactions.run(workspaceId, async () => {
      const agent = await this.templates.create({
        workspaceId,
        authorId: userId,
        locale: ctx.locale,
        key: templateKey,
        name,
        knowledgeBaseIds,
      });
      return this.views.agentView(workspaceId, agent);
    });
  }
}

import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { agentTemplates, agentTemplatesOfKind } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import { toAgentTemplateView } from '@/modules/agents/helpers/agent-template.helpers';
import { listAgentTemplatesInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type {
  AgentTemplateView,
  ListAgentTemplatesInput,
} from '@/modules/agents/typedefs/agent-template.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class ListAgentTemplatesUseCase {
  execute(ctx: UseCaseCtx, input: ListAgentTemplatesInput): AgentTemplateView[] {
    authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const { kind } = parseAgentInput(listAgentTemplatesInputSchema, input);
    const templates = kind === null ? agentTemplates : agentTemplatesOfKind(kind);
    return templates.map((template) => toAgentTemplateView(template, ctx.locale));
  }
}

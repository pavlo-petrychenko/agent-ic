import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  CloseReason,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { AutoCloseOffError } from '@/modules/conversations/errors/auto-close-off.error';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotAutoClosableError } from '@/modules/conversations/errors/conversation-not-auto-closable.error';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { simulationConversationSchema } from '@/modules/conversations/schemas/simulation.schema';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  SimulationConversationInput,
  SimulationView,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CloseSimulationForInactivityUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly simulations: SimulationsService,
    private readonly conversationRuns: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
  ) {}

  async execute(ctx: UseCaseCtx, input: SimulationConversationInput): Promise<SimulationView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    const { conversationId } = parseConversationInput(simulationConversationSchema, input);
    return this.tenants.run(workspaceId, async () => {
      const found = await this.simulations.requireOwn(workspaceId, userId, conversationId);
      if (found.state === ConversationState.Closed) {
        throw new ConversationClosedError(found.id);
      }
      if (!(await this.autoCloseIsOn(found))) {
        throw new AutoCloseOffError(found.id);
      }
      if (!(await this.conversationRuns.lockIdleConversation(workspaceId, found.id))) {
        throw new ConversationNotAutoClosableError(found.id);
      }
      const locked = await this.simulations.requireOwn(workspaceId, userId, conversationId);
      if (locked.state !== ConversationState.AgentActive) {
        throw new ConversationNotAutoClosableError(locked.id);
      }
      await this.conversationRuns.close(workspaceId, locked.id, CloseReason.Inactivity);
      return this.simulations.view(
        await this.simulations.requireOwn(workspaceId, userId, conversationId),
      );
    });
  }

  private async autoCloseIsOn(conversation: Conversation): Promise<boolean> {
    const versionId =
      conversation.simulationVersionId ??
      (await this.agents.getAgent(conversation.workspaceId, conversation.agentId)).draftVersionId;
    if (versionId === null) {
      return false;
    }
    const version = await this.agents.getVersion(conversation.workspaceId, versionId);
    return version.flow.settings.autoClose !== null;
  }
}

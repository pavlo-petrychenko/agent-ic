import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { parseConversationInput } from '@/modules/conversations/helpers/conversation-input.helpers';
import { simulatorMessageSchema } from '@/modules/conversations/schemas/simulation.schema';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type {
  MessageView,
  SimulatorMessageInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class SendSimulatorMessageUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly agents: AgentRuntimeReader,
    private readonly simulations: SimulationsService,
    private readonly incoming: IncomingMessagesService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SimulatorMessageInput): Promise<MessageView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.Edit,
    );
    const { conversationId, text } = parseConversationInput(simulatorMessageSchema, input);
    return this.tenants.run(workspaceId, async () => {
      const conversation = await this.simulations.requireOwn(workspaceId, userId, conversationId);
      if (conversation.state === ConversationState.Closed) {
        throw new ConversationClosedError(conversationId);
      }
      const versionId =
        conversation.simulationVersionId ??
        (await this.agents.snapshotDraft(workspaceId, conversation.agentId)).id;
      const received = await this.incoming.handleIncomingMessage(ctx, {
        workspaceId,
        agentId: conversation.agentId,
        mode: conversation.mode,
        channelKind: conversation.channelKind,
        channelId: null,
        endUserExternalId: userId,
        endUserName: null,
        externalId: null,
        text,
        versionId,
      });
      return this.simulations.receivedMessage(workspaceId, received);
    });
  }
}

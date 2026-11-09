import { Injectable } from '@nestjs/common';
import { TelegramTakeOverOutcomeKind } from '@/modules/conversations/constants/conversation-take-over.constants';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageSystemEvent } from '@/modules/conversations/constants/message.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationTakenError } from '@/modules/conversations/errors/conversation-taken.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { ConversationTimelineService } from '@/modules/conversations/services/conversation-timeline.service';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type { TelegramTakeOverOutcome } from '@/modules/conversations/typedefs/conversation-take-over.typedefs';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { ConversationView } from '@/modules/conversations/typedefs/simulation.typedefs';
import { UsersRepository } from '@/modules/identity';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ConversationTakeOverService {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly operated: OperatorConversationsService,
    private readonly conversations: ConversationsRepository,
    private readonly users: UsersRepository,
    private readonly inboxActivity: InboxActivityService,
    private readonly timeline: ConversationTimelineService,
    private readonly views: SimulationsService,
  ) {}

  async takeOver(
    ctx: UseCaseCtx,
    access: WorkspaceAccess,
    conversationPublicId: string,
    fromOperator: boolean,
  ): Promise<ConversationView> {
    return this.tenants.run(access.workspaceId, async () => {
      const conversation = await this.operated.requireOperable(ctx, access, conversationPublicId);
      const alreadyMine =
        conversation.state === ConversationState.Handled &&
        conversation.handledBy === access.userId;
      if (!alreadyMine && conversation.state === ConversationState.Handled && !fromOperator) {
        throw new ConversationTakenError(conversation.id);
      }
      const takenOver = await this.operated.takeOver(conversation, access.userId);
      await this.afterTakeOver(conversation, takenOver, access);
      return this.views.conversationView(takenOver);
    });
  }

  async takeOverForTelegram(
    ctx: UseCaseCtx,
    access: WorkspaceAccess,
    conversationPublicId: string,
  ): Promise<TelegramTakeOverOutcome> {
    return this.tenants.run(access.workspaceId, async () => {
      let conversation: Conversation;
      try {
        conversation = await this.operated.requireOperable(ctx, access, conversationPublicId);
      } catch (error) {
        if (error instanceof ConversationClosedError) {
          return { kind: TelegramTakeOverOutcomeKind.Closed };
        }
        throw error;
      }
      if (conversation.state === ConversationState.Handled) {
        return this.handledOutcome(conversation, access);
      }
      const takenOver = await this.conversations.takeOverIfUnhandled(
        access.workspaceId,
        conversation.id,
        access.userId,
      );
      if (takenOver === null) {
        const current = await this.conversations.findById(access.workspaceId, conversation.id);
        return current === null
          ? { kind: TelegramTakeOverOutcomeKind.Closed }
          : this.handledOutcome(current, access);
      }
      await this.afterTakeOver(conversation, takenOver, access);
      return {
        kind: TelegramTakeOverOutcomeKind.TakenOver,
        conversation: this.views.conversationView(takenOver),
      };
    });
  }

  private async handledOutcome(
    conversation: Conversation,
    access: WorkspaceAccess,
  ): Promise<TelegramTakeOverOutcome> {
    if (conversation.handledBy === access.userId) {
      return { kind: TelegramTakeOverOutcomeKind.SameUser };
    }
    const user =
      conversation.handledBy === null ? null : await this.users.findById(conversation.handledBy);
    return {
      kind: TelegramTakeOverOutcomeKind.OtherUser,
      name: user?.name ?? null,
    };
  }

  private async afterTakeOver(
    previous: Conversation,
    takenOver: Conversation | null,
    access: WorkspaceAccess,
  ): Promise<void> {
    if (takenOver === null || previous.mode !== ConversationMode.Live) {
      return;
    }
    if (previous.state !== ConversationState.Handled || previous.handledBy !== access.userId) {
      await this.timeline.record(previous, MessageSystemEvent.TookOver, access.userId);
    }
    await this.inboxActivity.conversationChanged(access.workspaceId, previous.id);
  }
}

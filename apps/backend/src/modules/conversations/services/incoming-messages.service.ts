import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader, PauseMode } from '@/modules/agents';
import type { PauseSettings } from '@/modules/agents';
import {
  CONVERSATION_EVENT_EMIT_OPTIONS,
  ConversationEventName,
} from '@/modules/conversations/constants/conversation-event.constants';
import {
  ConversationMode,
  ConversationState,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import {
  IncomingMessageOutcome,
  STORE_ONLY_STATES,
} from '@/modules/conversations/constants/incoming-message.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { messageReceivedEvent } from '@/modules/conversations/events/message-received.event';
import { awayMessageKey } from '@/modules/conversations/helpers/incoming-message.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  IncomingMessageInput,
  IncomingMessageResult,
} from '@/modules/conversations/typedefs/incoming-message.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class IncomingMessagesService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly conversationRuns: ConversationRunsService,
    private readonly agents: AgentRuntimeReader,
    private readonly domainEvents: DomainEventsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  handleIncomingMessage(
    ctx: UseCaseCtx,
    input: IncomingMessageInput,
  ): Promise<IncomingMessageResult> {
    return this.tenantTransactions.run(input.workspaceId, () => this.receive(ctx, input));
  }

  private async receive(
    ctx: UseCaseCtx,
    input: IncomingMessageInput,
  ): Promise<IncomingMessageResult> {
    const pause = await this.agents.getPauseSettings(input.workspaceId, input.agentId);
    const now = this.clock.now();
    const conversation =
      (await this.conversations.findOpenForUpdate(input)) ?? (await this.open(input, now));
    const message = await this.messages.insertIfAbsent({
      id: this.ids.generate(),
      workspaceId: input.workspaceId,
      conversationId: conversation.id,
      author: MessageAuthor.Customer,
      text: input.text,
      quickReplies: [],
      externalId: input.externalId,
      createdAt: now,
    });
    if (message === null) {
      return {
        outcome: IncomingMessageOutcome.Duplicate,
        conversationId: conversation.id,
        messageId: null,
      };
    }
    await this.conversations.touch(input.workspaceId, conversation.id, now);
    const activePause = conversation.mode === ConversationMode.Live ? pause : null;
    const outcome = await this.route(ctx, conversation, message, activePause, input.versionId);
    return { outcome, conversationId: conversation.id, messageId: message.id };
  }

  private async open(input: IncomingMessageInput, now: Date): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.ids.generate(),
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      mode: input.mode,
      channelKind: input.channelKind,
      channelId: input.channelId,
      endUserExternalId: input.endUserExternalId,
      endUserName: input.endUserName,
      state: ConversationState.AgentActive,
      handledBy: null,
      activeRunId: null,
      awaySentAt: null,
      lastMessageAt: now,
      closedAt: null,
      createdAt: now,
    };
    await this.conversations.insert(conversation);
    return conversation;
  }

  private async route(
    ctx: UseCaseCtx,
    conversation: Conversation,
    message: Message,
    pause: PauseSettings | null,
    versionId: string | null,
  ): Promise<IncomingMessageOutcome> {
    if (STORE_ONLY_STATES.has(conversation.state)) {
      return IncomingMessageOutcome.Stored;
    }
    if (pause === null) {
      await this.requestRun(ctx, conversation, message, versionId);
      return IncomingMessageOutcome.RunRequested;
    }
    if (pause.mode === PauseMode.Inbox) {
      await this.conversationRuns.markWaiting(ctx, {
        workspaceId: conversation.workspaceId,
        conversationId: conversation.id,
        reason: WaitingReason.AgentPaused,
      });
      return IncomingMessageOutcome.RoutedToInbox;
    }
    return this.sendAwayMessage(ctx, conversation, pause);
  }

  private async requestRun(
    ctx: UseCaseCtx,
    conversation: Conversation,
    message: Message,
    versionId: string | null,
  ): Promise<void> {
    await this.domainEvents.emit(
      ctx,
      messageReceivedEvent,
      {
        conversationId: conversation.id,
        messageId: message.id,
        agentId: conversation.agentId,
        mode: conversation.mode,
        ...(versionId === null ? {} : { versionId }),
      },
      CONVERSATION_EVENT_EMIT_OPTIONS[ConversationEventName.MessageReceived],
    );
  }

  private async sendAwayMessage(
    ctx: UseCaseCtx,
    conversation: Conversation,
    pause: PauseSettings,
  ): Promise<IncomingMessageOutcome> {
    if (pause.awayMessage === null) {
      return IncomingMessageOutcome.Stored;
    }
    const claimed = await this.conversations.claimAwayMessage(
      conversation.workspaceId,
      conversation.id,
      pause.pausedAt,
      this.clock.now(),
    );
    if (!claimed) {
      return IncomingMessageOutcome.Stored;
    }
    await this.conversationRuns.recordOutbound(ctx, {
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      key: awayMessageKey(conversation.id, pause.pausedAt),
      author: MessageAuthor.Agent,
      text: pause.awayMessage,
      quickReplies: [],
      runId: null,
    });
    return IncomingMessageOutcome.AwayMessageQueued;
  }
}

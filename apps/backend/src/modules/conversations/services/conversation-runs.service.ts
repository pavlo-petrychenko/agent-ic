import { Injectable } from '@nestjs/common';
import {
  CONVERSATION_EVENT_EMIT_OPTIONS,
  ConversationEventName,
} from '@/modules/conversations/constants/conversation-event.constants';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { MessageDelivery } from '@/modules/conversations/constants/message.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
import { needsOperatorEvent } from '@/modules/conversations/events/needs-operator.event';
import { outboundQueuedEvent } from '@/modules/conversations/events/outbound-queued.event';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type {
  Conversation,
  WaitingRequest,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  Message,
  OutboundDelivery,
  OutboundMessageInput,
} from '@/modules/conversations/typedefs/message.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ConversationRunsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly domainEvents: DomainEventsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  getConversation(workspaceId: string, conversationId: string): Promise<Conversation> {
    return this.requireConversation(workspaceId, conversationId);
  }

  claimRun(workspaceId: string, conversationId: string, runId: string): Promise<boolean> {
    return this.conversations.claim(workspaceId, conversationId, runId);
  }

  releaseRun(workspaceId: string, conversationId: string, runId: string): Promise<boolean> {
    return this.conversations.release(workspaceId, conversationId, runId);
  }

  async messagesAfter(
    workspaceId: string,
    conversationId: string,
    messageId: string,
  ): Promise<Message[]> {
    const first = await this.messages.findById(workspaceId, messageId);
    if (first?.conversationId !== conversationId) {
      throw new MessageNotFoundError(messageId);
    }
    return this.messages.listCustomerAfter(workspaceId, conversationId, first);
  }

  async recordOutbound(ctx: UseCaseCtx, input: OutboundMessageInput): Promise<Message> {
    const recorded = await this.messages.findByIdempotencyKey(input.workspaceId, input.key);
    if (recorded !== null) {
      return recorded;
    }
    const conversation = await this.requireConversation(input.workspaceId, input.conversationId);
    if (conversation.state === ConversationState.Closed) {
      throw new ConversationClosedError(conversation.id);
    }
    const now = this.clock.now();
    const created = await this.messages.insertIfAbsent({
      id: this.ids.generate(),
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      author: input.author,
      text: input.text,
      quickReplies: [...input.quickReplies],
      idempotencyKey: input.key,
      delivery: MessageDelivery.Pending,
      runId: input.runId,
      createdAt: now,
    });
    if (created === null) {
      return this.requireByKey(input.workspaceId, input.key);
    }
    await this.conversations.touch(input.workspaceId, input.conversationId, now);
    await this.domainEvents.emit(
      ctx,
      outboundQueuedEvent,
      {
        conversationId: conversation.id,
        messageId: created.id,
        channelKind: conversation.channelKind,
        mode: conversation.mode,
      },
      CONVERSATION_EVENT_EMIT_OPTIONS[ConversationEventName.OutboundQueued],
    );
    return created;
  }

  async markWaiting(ctx: UseCaseCtx, request: WaitingRequest): Promise<void> {
    const conversation = await this.requireConversation(
      request.workspaceId,
      request.conversationId,
    );
    if (conversation.state === ConversationState.Closed) {
      throw new ConversationClosedError(conversation.id);
    }
    if (!(await this.conversations.markWaiting(request.workspaceId, conversation.id))) {
      return;
    }
    await this.domainEvents.emit(
      ctx,
      needsOperatorEvent,
      {
        conversationId: conversation.id,
        agentId: conversation.agentId,
        reason: request.reason,
        mode: conversation.mode,
      },
      CONVERSATION_EVENT_EMIT_OPTIONS[ConversationEventName.NeedsOperator],
    );
  }

  async close(workspaceId: string, conversationId: string): Promise<void> {
    await this.requireConversation(workspaceId, conversationId);
    await this.conversations.close(workspaceId, conversationId, this.clock.now());
  }

  async markDelivery(
    workspaceId: string,
    messageId: string,
    delivery: MessageDelivery,
  ): Promise<void> {
    if (!(await this.messages.updateDelivery(workspaceId, messageId, delivery))) {
      throw new MessageNotFoundError(messageId);
    }
  }

  async outboundDelivery(workspaceId: string, messageId: string): Promise<OutboundDelivery> {
    const message = await this.messages.findById(workspaceId, messageId);
    if (message === null) {
      throw new MessageNotFoundError(messageId);
    }
    const conversation = await this.requireConversation(workspaceId, message.conversationId);
    return { message, conversation };
  }

  private async requireConversation(workspaceId: string, id: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(workspaceId, id);
    if (conversation === null) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }

  private async requireByKey(workspaceId: string, key: string): Promise<Message> {
    const message = await this.messages.findByIdempotencyKey(workspaceId, key);
    if (message === null) {
      throw new MessageNotFoundError(key);
    }
    return message;
  }
}

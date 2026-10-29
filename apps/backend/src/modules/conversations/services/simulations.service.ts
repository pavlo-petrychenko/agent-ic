import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type {
  Conversation,
  SimulationKey,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type { IncomingMessageResult } from '@/modules/conversations/typedefs/incoming-message.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import type {
  ConversationView,
  MessageView,
  SimulationSetup,
  SimulationView,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SimulationsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  findOpen(key: SimulationKey): Promise<Conversation | null> {
    return this.conversations.findOpenSimulation(key);
  }

  findLatest(key: SimulationKey): Promise<Conversation | null> {
    return this.conversations.findLatestSimulation(key);
  }

  findLatestForRead(key: SimulationKey): Promise<Conversation | null> {
    return this.conversations.findLatestSimulationForRead(key);
  }

  async requireOwn(workspaceId: string, userId: string, publicId: string): Promise<Conversation> {
    const id = this.ids.fromPublic(IdPrefix.Conversation, publicId);
    const conversation = await this.conversations.findById(workspaceId, id);
    if (
      conversation?.mode !== ConversationMode.Simulation ||
      conversation.endUserExternalId !== userId
    ) {
      throw new ConversationNotFoundError(publicId);
    }
    return conversation;
  }

  async restart(open: Conversation): Promise<Conversation> {
    await this.close(open);
    return this.open(open, {
      versionId: open.simulationVersionId,
      channelKind: open.channelKind,
      language: open.endUserLanguage,
    });
  }

  async close(conversation: Conversation): Promise<void> {
    await this.conversations.close(
      conversation.workspaceId,
      conversation.id,
      this.clock.now(),
      null,
    );
  }

  open(key: SimulationKey, setup: SimulationSetup): Promise<Conversation> {
    return this.conversations.insert({
      id: this.ids.generate(),
      workspaceId: key.workspaceId,
      agentId: key.agentId,
      mode: ConversationMode.Simulation,
      channelKind: setup.channelKind,
      channelId: null,
      endUserExternalId: key.endUserExternalId,
      endUserName: null,
      endUserLanguage: setup.language,
      state: ConversationState.AgentActive,
      handledBy: null,
      activeRunId: null,
      simulationVersionId: setup.versionId,
      awaySentAt: null,
      lastMessageAt: this.clock.now(),
      closedAt: null,
      closeReason: null,
    });
  }

  async view(conversation: Conversation): Promise<SimulationView> {
    const messages = await this.messages.listByConversation(
      conversation.workspaceId,
      conversation.id,
    );
    return {
      conversation: this.conversationView(conversation),
      messages: messages.map((message) => this.messageView(message)),
    };
  }

  async receivedMessage(
    workspaceId: string,
    { conversationId, messageId }: IncomingMessageResult,
  ): Promise<MessageView> {
    const message =
      messageId === null ? null : await this.messages.findById(workspaceId, messageId);
    if (message === null) {
      throw new MessageNotFoundError(conversationId);
    }
    return this.messageView(message);
  }

  conversationView(conversation: Conversation): ConversationView {
    const { simulationVersionId } = conversation;
    return {
      id: this.ids.toPublic(IdPrefix.Conversation, conversation.id),
      state: conversation.state,
      channelKind: conversation.channelKind,
      language: conversation.endUserLanguage,
      versionId:
        simulationVersionId === null
          ? null
          : this.ids.toPublic(IdPrefix.AgentVersion, simulationVersionId),
      closeReason: conversation.closeReason,
      closedAt: conversation.closedAt,
      createdAt: conversation.createdAt,
    };
  }

  messageView(message: Message): MessageView {
    return {
      id: this.ids.toPublic(IdPrefix.Message, message.id),
      author: message.author,
      text: message.text,
      quickReplies: message.quickReplies,
      runId: message.runId === null ? null : this.ids.toPublic(IdPrefix.Run, message.runId),
      createdAt: message.createdAt,
    };
  }
}

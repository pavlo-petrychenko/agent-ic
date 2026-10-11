import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type {
  Conversation,
  SimulationKey,
} from '@/modules/conversations/typedefs/conversation.typedefs';
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

  close(conversation: Conversation): Promise<void> {
    return this.conversations.close(conversation.workspaceId, conversation.id, this.clock.now());
  }

  async open(key: SimulationKey, setup: SimulationSetup): Promise<Conversation> {
    const now = this.clock.now();
    const conversation: Conversation = {
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
      lastMessageAt: now,
      closedAt: null,
      createdAt: now,
    };
    await this.conversations.insert(conversation);
    return conversation;
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

  private conversationView(conversation: Conversation): ConversationView {
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
      createdAt: conversation.createdAt,
    };
  }

  private messageView(message: Message): MessageView {
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

import { Injectable } from '@nestjs/common';
import {
  MessageAuthor,
  MessageSystemEvent,
} from '@/modules/conversations/constants/message.constants';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ConversationTimelineService {
  constructor(
    private readonly messages: MessagesRepository,
    private readonly activity: ConversationActivityService,
    private readonly ids: IdService,
  ) {}

  async record(
    conversation: Conversation,
    event: MessageSystemEvent,
    actorUserId: string | null,
  ): Promise<void> {
    const message = await this.messages.insertIfAbsent({
      id: this.ids.generate(),
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      author: MessageAuthor.System,
      authorUserId: actorUserId,
      systemEvent: event,
      text: '',
      quickReplies: [],
      externalId: null,
      idempotencyKey: null,
      delivery: null,
      runId: null,
    });
    if (message !== null) {
      await this.activity.messageAdded(message);
    }
  }
}

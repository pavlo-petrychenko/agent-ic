import { Injectable } from '@nestjs/common';
import { conversationActivityChannel } from '@/modules/conversations/channels/conversation-activity.channel';
import { ConversationActivityKind } from '@/modules/conversations/constants/conversation-activity.constants';
import type { ConversationActivity } from '@/modules/conversations/typedefs/conversation-activity.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';

@Injectable()
export class ConversationActivityService {
  constructor(private readonly liveUpdates: LiveUpdatesService) {}

  messageAdded(message: Pick<Message, 'id' | 'conversationId' | 'runId'>): Promise<void> {
    return this.publish({
      conversationId: message.conversationId,
      kind: ConversationActivityKind.MessageAdded,
      messageId: message.id,
      runId: message.runId,
    });
  }

  runStarted(conversationId: string, runId: string): Promise<void> {
    return this.publish({
      conversationId,
      kind: ConversationActivityKind.RunStarted,
      messageId: null,
      runId,
    });
  }

  runFinished(conversationId: string, runId: string): Promise<void> {
    return this.publish({
      conversationId,
      kind: ConversationActivityKind.RunFinished,
      messageId: null,
      runId,
    });
  }

  conversationClosed(conversationId: string): Promise<void> {
    return this.publish({
      conversationId,
      kind: ConversationActivityKind.ConversationClosed,
      messageId: null,
      runId: null,
    });
  }

  private publish({ conversationId, kind, messageId, runId }: ConversationActivity): Promise<void> {
    return this.liveUpdates.publish(channelFor(conversationActivityChannel, conversationId), {
      conversationId,
      kind,
      messageId,
      runId,
    });
  }
}

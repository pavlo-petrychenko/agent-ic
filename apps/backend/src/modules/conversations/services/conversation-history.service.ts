import { Injectable } from '@nestjs/common';
import { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';

@Injectable()
export class ConversationHistoryService {
  constructor(private readonly messages: MessagesRepository) {}

  async forRun(
    workspaceId: string,
    conversationId: string,
    upToMessageId: string,
  ): Promise<Message[]> {
    const last = await this.messages.findById(workspaceId, upToMessageId);
    if (last?.conversationId !== conversationId) {
      throw new MessageNotFoundError(upToMessageId);
    }
    return this.messages.listThrough(workspaceId, conversationId, last);
  }
}

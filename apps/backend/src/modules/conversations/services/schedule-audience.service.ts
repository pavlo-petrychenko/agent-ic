import { Injectable } from '@nestjs/common';
import { toScheduleCandidateQuery } from '@/modules/conversations/helpers/schedule-audience.helpers';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { ScheduleContactsRepository } from '@/modules/conversations/repositories/schedule-contacts.repository';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  ScheduleAudienceRequest,
  ScheduleContactRequest,
} from '@/modules/conversations/typedefs/schedule-audience.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ScheduleAudienceService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly contacts: ScheduleContactsRepository,
    private readonly ids: IdService,
  ) {}

  findCandidates(workspaceId: string, request: ScheduleAudienceRequest): Promise<Conversation[]> {
    return this.conversations.findScheduleCandidates(
      workspaceId,
      toScheduleCandidateQuery(request),
    );
  }

  recordContact(workspaceId: string, request: ScheduleContactRequest): Promise<boolean> {
    return this.contacts.insertIfAbsent({
      id: this.ids.generate(),
      workspaceId,
      conversationId: request.conversationId,
      agentId: request.agentId,
      nodeId: request.node.id,
      scheduledFor: request.tick,
      oncePerConversation: request.node.config.oncePerConversation,
    });
  }
}

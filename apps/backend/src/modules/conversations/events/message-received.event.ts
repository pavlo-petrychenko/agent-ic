import { z } from 'zod';
import { ConversationEventName } from '@/modules/conversations/constants/conversation-event.constants';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const messageReceivedEvent = defineDomainEvent({
  name: ConversationEventName.MessageReceived,
  schema: z.object({
    conversationId: z.uuid(),
    messageId: z.uuid(),
    agentId: z.uuid(),
    mode: z.enum(ConversationMode),
  }),
});

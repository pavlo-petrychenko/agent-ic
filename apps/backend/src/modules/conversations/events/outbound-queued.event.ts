import { z } from 'zod';
import { ConversationEventName } from '@/modules/conversations/constants/conversation-event.constants';
import {
  ChannelKind,
  ConversationMode,
} from '@/modules/conversations/constants/conversation.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const outboundQueuedEvent = defineDomainEvent({
  name: ConversationEventName.OutboundQueued,
  schema: z.object({
    conversationId: z.uuid(),
    messageId: z.uuid(),
    channelKind: z.enum(ChannelKind),
    mode: z.enum(ConversationMode),
  }),
});

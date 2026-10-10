import { z } from 'zod';
import { ConversationEventName } from '@/modules/conversations/constants/conversation-event.constants';
import {
  ConversationMode,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const needsOperatorEvent = defineDomainEvent({
  name: ConversationEventName.NeedsOperator,
  schema: z.object({
    conversationId: z.uuid(),
    agentId: z.uuid(),
    reason: z.enum(WaitingReason),
    mode: z.enum(ConversationMode),
  }),
});

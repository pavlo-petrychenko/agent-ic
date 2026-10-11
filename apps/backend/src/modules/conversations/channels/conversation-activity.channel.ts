import { z } from 'zod';
import {
  CONVERSATION_ACTIVITY_CHANNEL_NAME,
  ConversationActivityKind,
} from '@/modules/conversations/constants/conversation-activity.constants';
import { defineChannel } from '@/platform/live-updates/helpers/channel.helpers';

export const conversationActivityChannel = defineChannel({
  name: CONVERSATION_ACTIVITY_CHANNEL_NAME,
  schema: z.object({
    conversationId: z.uuid(),
    kind: z.enum(ConversationActivityKind),
    messageId: z.uuid().nullable(),
    runId: z.uuid().nullable(),
  }),
});

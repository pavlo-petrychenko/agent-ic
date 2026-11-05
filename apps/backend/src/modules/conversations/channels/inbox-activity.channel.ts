import { z } from 'zod';
import {
  INBOX_ACTIVITY_CHANNEL_NAME,
  InboxActivityKind,
} from '@/modules/conversations/constants/inbox-activity.constants';
import { defineChannel } from '@/platform/live-updates/helpers/channel.helpers';

export const inboxActivityChannel = defineChannel({
  name: INBOX_ACTIVITY_CHANNEL_NAME,
  schema: z.object({
    conversationId: z.uuid(),
    kind: z.enum(InboxActivityKind),
  }),
});

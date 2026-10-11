import type { ConversationActivityKind } from '@/modules/conversations/constants/conversation-activity.constants';

export interface ConversationActivityInput {
  readonly conversationId: string;
}

export interface ConversationActivity {
  readonly conversationId: string;
  readonly kind: ConversationActivityKind;
  readonly messageId: string | null;
  readonly runId: string | null;
}

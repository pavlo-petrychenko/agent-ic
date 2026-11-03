import type { InboxActivityKind } from '@/modules/conversations/constants/inbox-activity.constants';

export interface InboxActivity {
  readonly conversationId: string;
  readonly kind: InboxActivityKind;
}

import type { InboxConversationProps } from '@/features/inbox/view/InboxConversation';
import type { InboxDetailsProps } from '@/features/inbox/view/InboxDetails';
import type { InboxListProps } from '@/features/inbox/view/InboxList';

export interface InboxPageModel {
  readonly list: InboxListProps;
  readonly conversation: InboxConversationProps | null;
  readonly details: InboxDetailsProps | null;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

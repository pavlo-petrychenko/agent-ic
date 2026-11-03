import type { InboxActionId } from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversationAction,
  InboxConversationBanner,
  InboxConversationFooter,
  InboxMessage,
} from '@/features/inbox/typedefs/inbox.typedefs';

export interface InboxConversationProps {
  readonly name: string;
  readonly initials: string;
  readonly subtitle: string;
  readonly actions: readonly InboxConversationAction[];
  readonly banner: InboxConversationBanner | null;
  readonly messages: readonly InboxMessage[];
  readonly footer: InboxConversationFooter;
  readonly onAction: (id: InboxActionId) => void;
}

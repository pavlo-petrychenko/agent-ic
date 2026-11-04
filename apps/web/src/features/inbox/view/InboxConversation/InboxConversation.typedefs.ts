import type { InboxActionId } from '@/features/inbox/constants/inbox.constants';
import type { InboxLoadError } from '@/features/inbox/typedefs/common.typedefs';
import type {
  InboxConversationAction,
  InboxConversationBanner,
  InboxConversationFooter,
} from '@/features/inbox/typedefs/conversationUi.typedefs';
import type { InboxMessage } from '@/features/inbox/typedefs/message.typedefs';

export interface InboxConversationProps {
  readonly conversationId: string;
  readonly name: string;
  readonly initials: string;
  readonly subtitle: string;
  readonly actions: readonly InboxConversationAction[];
  readonly banner: InboxConversationBanner | null;
  readonly messages: readonly InboxMessage[];
  readonly loading: boolean;
  readonly loadingLabel: string;
  readonly loadError: InboxLoadError | null;
  readonly footer: InboxConversationFooter;
  readonly onAction: (id: InboxActionId) => void;
}

import type { InboxTone } from '@/features/inbox/constants/inbox.constants';
import type { InboxRunStep } from '@/features/inbox/typedefs/conversation.typedefs';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface InboxGuardView {
  readonly title: string;
  readonly badge: string;
  readonly icon: IconName;
  readonly tone: InboxTone;
  readonly lines: readonly string[];
}

export interface InboxRunView {
  readonly title: string;
  readonly linkLabel: string;
  readonly steps: readonly InboxRunStep[];
  readonly footer: string;
}

export interface InboxDetailRow {
  readonly id: string;
  readonly label: string;
  readonly value: string | null;
  readonly badge: string | null;
}

interface InboxConversationDetailsView {
  readonly title: string;
  readonly rows: readonly InboxDetailRow[];
}

export interface InboxDetailsView {
  readonly label: string;
  readonly title: string;
  readonly guard: InboxGuardView | null;
  readonly run: InboxRunView | null;
  readonly conversation: InboxConversationDetailsView;
  readonly sessionLinkLabel: string | null;
}

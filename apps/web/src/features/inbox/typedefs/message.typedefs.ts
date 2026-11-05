import type {
  InboxDividerKind,
  InboxMessageKind,
} from '@/features/inbox/constants/inbox.constants';
import type { IconName } from '@/shared/ui/foundations/Icon';

interface InboxTextMessage {
  readonly kind: InboxMessageKind.Customer | InboxMessageKind.Agent | InboxMessageKind.Operator;
  readonly id: string;
  readonly author: string;
  readonly time: string;
  readonly text: string;
}

interface InboxDividerMessage {
  readonly kind: InboxMessageKind.Divider;
  readonly id: string;
  readonly text: string;
  readonly icon: IconName | null;
}

interface InboxEscalationMessage {
  readonly kind: InboxMessageKind.Escalation;
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly time: string;
  readonly linkLabel: string;
}

export type InboxMessage = InboxTextMessage | InboxDividerMessage | InboxEscalationMessage;

interface InboxStoredTextMessage {
  readonly kind: InboxMessageKind.Customer | InboxMessageKind.Agent | InboxMessageKind.Operator;
  readonly id: string;
  readonly author: string;
  readonly self: boolean;
  readonly time: string;
  readonly text: string;
}

export interface InboxStoredDividerMessage {
  readonly kind: InboxMessageKind.Divider;
  readonly id: string;
  readonly divider: InboxDividerKind;
  readonly icon: IconName | null;
  readonly name: string;
  readonly time: string;
  readonly tookAt: string | null;
}

interface InboxStoredEscalationMessage {
  readonly kind: InboxMessageKind.Escalation;
  readonly id: string;
  readonly detail: string;
  readonly time: string;
}

export type InboxStoredMessage =
  | InboxStoredTextMessage
  | InboxStoredDividerMessage
  | InboxStoredEscalationMessage;

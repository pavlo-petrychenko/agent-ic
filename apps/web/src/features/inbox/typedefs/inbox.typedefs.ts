import type { TFunction } from 'i18next';
import type {
  InboxDividerKind,
  InboxFooterKind,
  InboxMessageKind,
  InboxProvider,
  InboxReplyState,
  InboxRowStatusKind,
  InboxRunStepKind,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import type { Namespace } from '@/shared/i18n/constants/namespace.constants';
import type { ButtonVariant } from '@/shared/ui/actions/Button';
import type { BannerTone } from '@/shared/ui/display/Banner';
import type { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface InboxTextMessage {
  readonly kind: InboxMessageKind.Customer | InboxMessageKind.Agent | InboxMessageKind.Operator;
  readonly id: string;
  readonly author: string;
  readonly time: string;
  readonly text: string;
}

export interface InboxDividerMessage {
  readonly kind: InboxMessageKind.Divider;
  readonly id: string;
  readonly text: string;
  readonly icon: IconName | null;
}

export interface InboxEscalationMessage {
  readonly kind: InboxMessageKind.Escalation;
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly time: string;
  readonly linkLabel: string;
}

export type InboxMessage = InboxTextMessage | InboxDividerMessage | InboxEscalationMessage;

export interface InboxStoredTextMessage {
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

export interface InboxStoredEscalationMessage {
  readonly kind: InboxMessageKind.Escalation;
  readonly id: string;
  readonly detail: string;
  readonly time: string;
}

export type InboxStoredMessage =
  | InboxStoredTextMessage
  | InboxStoredDividerMessage
  | InboxStoredEscalationMessage;

export interface InboxGuard {
  readonly reason: string;
}

export interface InboxRunStep {
  readonly id: string;
  readonly kind: InboxRunStepKind;
  readonly value: string | null;
}

export interface InboxRun {
  readonly id: string;
  readonly time: string;
  readonly duration: string;
  readonly steps: readonly InboxRunStep[];
}

export interface InboxConversationFacts {
  readonly channel: string;
  readonly startedAt: string | null;
  readonly escalatedAt: string | null;
  readonly notified: string | null;
  readonly runs: number | null;
  readonly handledBy: string | null;
  readonly handledSince: string | null;
  readonly replyTarget: string | null;
  readonly closedAt: string | null;
  readonly agentAnswering: boolean;
}

export interface InboxConversation {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly provider: InboxProvider;
  readonly agentName: string;
  readonly agentVersion: number;
  readonly replyState: InboxReplyState;
  readonly assigneeName: string | null;
  readonly preview: string;
  readonly minutesAgo: number;
  readonly messages: readonly InboxStoredMessage[];
  readonly guard: InboxGuard | null;
  readonly run: InboxRun | null;
  readonly facts: InboxConversationFacts;
}

export interface InboxTabItem {
  readonly id: InboxTab;
  readonly label: string;
  readonly count: number;
}

export interface InboxRowStatus {
  readonly kind: InboxRowStatusKind;
  readonly label: string;
}

export interface InboxListItem {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly preview: string;
  readonly updated: string;
  readonly source: string;
  readonly status: InboxRowStatus | null;
  readonly selected: boolean;
}

export interface InboxEmptyState {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: EmptyStateTone;
}

export interface InboxListProps {
  readonly title: string;
  readonly tabs: readonly InboxTabItem[];
  readonly activeTab: InboxTab;
  readonly onTabChange: (tab: InboxTab) => void;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly searchClearLabel: string;
  readonly channelFilterLabel: string;
  readonly agentFilterLabel: string;
  readonly items: readonly InboxListItem[];
  readonly empty: InboxEmptyState;
  readonly onSelect: (id: string) => void;
}

export interface InboxConversationAction {
  readonly id: string;
  readonly label: string;
  readonly variant: ButtonVariant;
  readonly icon: IconName | null;
}

export interface InboxConversationBanner {
  readonly tone: BannerTone;
  readonly icon: IconName | null;
  readonly text: string;
}

export interface InboxComposerFooter {
  readonly kind: InboxFooterKind.Composer;
  readonly note: string;
  readonly placeholder: string;
  readonly sendLabel: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
}

export interface InboxNoteFooter {
  readonly kind: InboxFooterKind.Note;
  readonly text: string;
}

export interface InboxTakeOverFooter {
  readonly kind: InboxFooterKind.TakeOver;
  readonly label: string;
}

export type InboxConversationFooter = InboxComposerFooter | InboxNoteFooter | InboxTakeOverFooter;

export interface InboxConversationProps {
  readonly name: string;
  readonly initials: string;
  readonly subtitle: string;
  readonly actions: readonly InboxConversationAction[];
  readonly banner: InboxConversationBanner | null;
  readonly messages: readonly InboxMessage[];
  readonly footer: InboxConversationFooter;
}

export interface InboxGuardView {
  readonly title: string;
  readonly badge: string;
  readonly lines: readonly string[];
}

export interface InboxRunStepView {
  readonly id: string;
  readonly icon: IconName;
  readonly label: string;
  readonly value: string | null;
}

export interface InboxRunView {
  readonly title: string;
  readonly linkLabel: string;
  readonly steps: readonly InboxRunStepView[];
  readonly footer: string;
}

export interface InboxDetailRow {
  readonly id: string;
  readonly label: string;
  readonly value: string | null;
  readonly badge: string | null;
}

export interface InboxConversationDetailsView {
  readonly title: string;
  readonly rows: readonly InboxDetailRow[];
}

export interface InboxDetailsProps {
  readonly label: string;
  readonly title: string;
  readonly guard: InboxGuardView | null;
  readonly run: InboxRunView | null;
  readonly conversation: InboxConversationDetailsView;
  readonly sessionLinkLabel: string | null;
}

export type InboxTranslate = TFunction<Namespace.Inbox>;

export type InboxProviderLabels = Readonly<Record<InboxProvider, string>>;

export interface InboxComposerState {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
}

export interface InboxFooterContext {
  readonly providerLabels: InboxProviderLabels;
  readonly composer: InboxComposerState;
  readonly currentUserName: string;
}

export interface InboxPageModel {
  readonly list: InboxListProps;
  readonly conversation: InboxConversationProps | null;
  readonly details: InboxDetailsProps | null;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

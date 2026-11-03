import type { InboxActionId, InboxTab } from '@/features/inbox/constants/inbox.constants';
import type { CloseChatDialogProps } from '@/features/inbox/containers/CloseChatDialog';
import type {
  InboxConversation,
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';
import type { InboxConversationProps } from '@/features/inbox/view/InboxConversation';
import type { InboxDetailsProps } from '@/features/inbox/view/InboxDetails';
import type { InboxListProps } from '@/features/inbox/view/InboxList';

export interface InboxPageModel {
  readonly list: InboxListProps;
  readonly conversation: InboxConversationProps | null;
  readonly details: InboxDetailsProps | null;
  readonly closeDialog: CloseChatDialogProps | null;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

export interface InboxListState {
  readonly conversations: readonly InboxConversation[];
  readonly providerLabels: InboxProviderLabels;
  readonly counts: Readonly<Record<InboxTab, number>>;
  readonly visible: readonly InboxConversation[];
  readonly activeTab: InboxTab;
  readonly search: string;
  readonly effectiveSelectedId: string | null;
  readonly onSearchChange: (value: string) => void;
  readonly onTabChange: (tab: InboxTab) => void;
  readonly onSelect: (id: string) => void;
  readonly onClearSelection: () => void;
}

export interface InboxListResult extends InboxListState {
  readonly view: InboxListProps;
}

export interface InboxThreadState {
  readonly conversation: InboxConversation | null;
  readonly details: InboxDetailsProps | null;
}

export interface UseInboxActionsOptions {
  readonly conversations: readonly InboxConversation[];
  readonly conversation: InboxConversation | null;
  readonly onSelect: (id: string) => void;
  readonly onClosed: () => void;
}

export interface UseInboxActionsResult {
  readonly onAction: (id: InboxActionId) => void;
  readonly closeDialog: CloseChatDialogProps | null;
}

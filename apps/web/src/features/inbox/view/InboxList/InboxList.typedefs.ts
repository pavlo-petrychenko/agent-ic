import type { InboxTab } from '@/features/inbox/constants/inbox.constants';
import type { InboxLoadError } from '@/features/inbox/typedefs/common.typedefs';
import type {
  InboxEmptyState,
  InboxListItem,
  InboxRowStatus,
  InboxTabItem,
} from '@/features/inbox/typedefs/list.typedefs';

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
  readonly loading: boolean;
  readonly loadingLabel: string;
  readonly loadError: InboxLoadError | null;
  readonly onSelect: (id: string) => void;
}

export interface RowStatusProps {
  readonly status: InboxRowStatus;
}

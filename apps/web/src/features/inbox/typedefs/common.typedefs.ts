import type { TFunction } from 'i18next';
import type { InboxProvider } from '@/features/inbox/constants/inbox.constants';
import type { Namespace } from '@/shared/i18n/constants/namespace.constants';

export type InboxTranslate = TFunction<Namespace.Inbox>;

export type InboxProviderLabels = Readonly<Record<InboxProvider, string>>;

export interface InboxLoadError {
  readonly title: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}

export interface InboxCurrentUser {
  readonly id: string;
  readonly name: string;
}

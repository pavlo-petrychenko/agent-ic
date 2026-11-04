import { skipToken, useSubscription } from '@apollo/client/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InboxConversationActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxConversationActivity.generated';
import { withInboxDetail } from '@/features/inbox/communication/helpers/inboxThreadApi.helpers';
import { useInboxConversation } from '@/features/inbox/communication/hooks/useInboxConversation';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxThreadState } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { inboxDetails } from '@/features/inbox/logic/helpers/inboxDetails.helpers';
import type {
  InboxConversation,
  InboxCurrentUser,
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxThread(
  conversations: readonly InboxConversation[],
  selectedId: string | null,
  providerLabels: InboxProviderLabels,
  currentUser: InboxCurrentUser | null,
): InboxThreadState {
  const { t, i18n } = useTranslation(INBOX_NAMESPACE);
  const { detail, loading, failed, retry } = useInboxConversation(selectedId);
  useSubscription(
    InboxConversationActivityDocument,
    selectedId === null
      ? skipToken
      : { variables: { conversationId: selectedId }, onData: () => void retry() },
  );

  const conversation = useMemo(() => {
    const base = conversations.find((item) => item.id === selectedId) ?? null;
    return base === null || detail === null || detail.summary.id !== selectedId
      ? base
      : withInboxDetail(base, detail, i18n.language, t('status.operator'), currentUser);
  }, [conversations, selectedId, detail, i18n.language, t, currentUser]);

  const details = conversation === null ? null : inboxDetails(conversation, providerLabels, t);
  const loadError =
    failed && selectedId !== null
      ? {
          title: t('thread.loadError'),
          retryLabel: t('retry'),
          onRetry: () => void retry(),
        }
      : null;

  return { conversation, details, loading, loadError };
}

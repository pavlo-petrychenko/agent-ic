import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withInboxDetail } from '@/features/inbox/communication/helpers/inboxApi.helpers';
import { useInboxConversation } from '@/features/inbox/communication/hooks/useInboxConversation';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxThreadState } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { inboxDetails } from '@/features/inbox/logic/helpers/inboxDetails.helpers';
import type {
  InboxConversation,
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxThread(
  conversations: readonly InboxConversation[],
  selectedId: string | null,
  providerLabels: InboxProviderLabels,
): InboxThreadState {
  const { t, i18n } = useTranslation(INBOX_NAMESPACE);
  const { detail } = useInboxConversation(selectedId);

  const conversation = useMemo(() => {
    const base = conversations.find((item) => item.id === selectedId) ?? null;
    return base === null || detail === null || detail.summary.id !== selectedId
      ? base
      : withInboxDetail(base, detail, i18n.language, t('status.operator'));
  }, [conversations, selectedId, detail, i18n.language, t]);

  const details = conversation === null ? null : inboxDetails(conversation, providerLabels, t);

  return { conversation, details };
}

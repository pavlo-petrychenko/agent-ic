import { useTranslation } from 'react-i18next';
import type { InboxActionId } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import {
  inboxActions,
  inboxBanner,
  inboxFooter,
  inboxMessages,
} from '@/features/inbox/logic/helpers/inboxConversation.helpers';
import type {
  InboxConversation,
  InboxFooterContext,
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';
import type { InboxConversationProps } from '@/features/inbox/view/InboxConversation';

export function useInboxConversationView(
  conversation: InboxConversation | null,
  providerLabels: InboxProviderLabels,
  footerContext: InboxFooterContext,
  onAction: (id: InboxActionId) => void,
): InboxConversationProps | null {
  const { t } = useTranslation(INBOX_NAMESPACE);

  if (conversation === null) {
    return null;
  }

  return {
    name: conversation.name,
    initials: conversation.initials,
    subtitle: `${providerLabels[conversation.provider]} · ${conversation.agentName} v${conversation.agentVersion}`,
    actions: inboxActions(conversation, t),
    banner: inboxBanner(conversation, t),
    messages: inboxMessages(conversation, t),
    footer: inboxFooter(conversation, footerContext, t),
    onAction,
  };
}

import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { dateTime, minutesAgo } from '@/features/inbox/communication/helpers/inboxFormat.helpers';
import { InboxProvider, InboxReplyState } from '@/features/inbox/constants/inbox.constants';
import type { InboxConversation } from '@/features/inbox/typedefs/inbox.typedefs';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';

type ApiSummary = InboxConversationsQuery['inboxConversations'][number];

const INBOX_PROVIDER: Readonly<Record<ApiSummary['channelKind'], InboxProvider>> = {
  telegram: InboxProvider.Telegram,
  api: InboxProvider.Api,
  simulated: InboxProvider.Api,
};

const replyStateOf = (summary: ApiSummary): InboxReplyState => {
  if (summary.state === 'waiting') {
    return InboxReplyState.Waiting;
  }
  if (summary.state === 'handled') {
    return summary.handledByMe ? InboxReplyState.Mine : InboxReplyState.Operator;
  }
  if (summary.state === 'closed') {
    return InboxReplyState.Closed;
  }
  return InboxReplyState.Agent;
};

export const toInboxConversation = (
  summary: ApiSummary,
  locale: string,
  operatorLabel: string,
): InboxConversation => {
  const name = summary.endUserName ?? summary.endUserExternalId;
  const replyState = replyStateOf(summary);
  const operator =
    replyState === InboxReplyState.Operator ? (summary.handledByName ?? operatorLabel) : null;
  return {
    id: summary.id,
    name,
    initials: toInitials(name),
    provider: INBOX_PROVIDER[summary.channelKind],
    agentName: summary.agentName,
    agentVersion: summary.agentVersion,
    replyState,
    hasBeenHandled: summary.hasBeenHandled,
    assigneeName: operator,
    preview: summary.preview,
    minutesAgo: minutesAgo(summary.lastMessageAt),
    messages: [],
    guard: null,
    run: null,
    facts: {
      channel: '',
      startedAt: dateTime(summary.createdAt, locale),
      escalatedAt:
        summary.lastEscalatedAt === null ? null : dateTime(summary.lastEscalatedAt, locale),
      notified: null,
      runs: null,
      handledBy: operator,
      handledSince: null,
      handledUntil: null,
      replyTarget: null,
      closedAt: summary.closedAt === null ? null : dateTime(summary.closedAt, locale),
      agentAnswering: summary.state === 'agent_active',
    },
  };
};

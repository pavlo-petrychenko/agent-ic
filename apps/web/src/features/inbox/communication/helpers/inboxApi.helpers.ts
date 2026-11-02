import type { InboxConversationQuery } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import {
  InboxMessageKind,
  InboxProvider,
  InboxReplyState,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxCurrentUser,
  InboxStoredMessage,
} from '@/features/inbox/typedefs/inbox.typedefs';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';

type ApiSummary = InboxConversationsQuery['inboxConversations'][number];
type ApiDetail = InboxConversationQuery['inboxConversation'];
type ApiMessage = ApiDetail['messages'][number];

const INBOX_PROVIDER: Readonly<Record<ApiSummary['channelKind'], InboxProvider>> = {
  telegram: InboxProvider.Telegram,
  api: InboxProvider.Api,
  simulated: InboxProvider.Api,
};

const MILLISECONDS_PER_MINUTE = 60_000;

const MESSAGE_KIND = {
  customer: InboxMessageKind.Customer,
  agent: InboxMessageKind.Agent,
  operator: InboxMessageKind.Operator,
} as const;

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

const minutesAgo = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / MILLISECONDS_PER_MINUTE));

const dateTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );

const messageTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

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
      replyTarget: null,
      closedAt: summary.closedAt === null ? null : dateTime(summary.closedAt, locale),
      agentAnswering: summary.state === 'agent_active',
    },
  };
};

const authorOf = (
  message: ApiMessage,
  conversation: InboxConversation,
  operatorLabel: string,
): string => {
  if (message.author === 'agent') {
    return conversation.agentName;
  }
  if (message.author === 'operator') {
    return message.authorName ?? operatorLabel;
  }
  return conversation.name;
};

const toStoredMessage = (
  message: ApiMessage,
  conversation: InboxConversation,
  locale: string,
  operatorLabel: string,
  currentUser: InboxCurrentUser | null,
): InboxStoredMessage | null => {
  if (message.author === 'system') {
    return null;
  }
  const self =
    message.author === 'operator' && currentUser !== null && message.authorId === currentUser.id;
  return {
    kind: MESSAGE_KIND[message.author],
    id: message.id,
    author: self ? currentUser.name : authorOf(message, conversation, operatorLabel),
    self,
    time: messageTime(message.createdAt, locale),
    text: message.text,
  };
};

export const withInboxDetail = (
  conversation: InboxConversation,
  detail: ApiDetail,
  locale: string,
  operatorLabel: string,
  currentUser: InboxCurrentUser | null,
): InboxConversation => ({
  ...conversation,
  messages: detail.messages.flatMap((message) => {
    const stored = toStoredMessage(message, conversation, locale, operatorLabel, currentUser);
    return stored === null ? [] : [stored];
  }),
});

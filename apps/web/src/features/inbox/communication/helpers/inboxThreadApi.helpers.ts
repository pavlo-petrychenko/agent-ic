import type { InboxConversationQuery } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import {
  guardOf,
  notifiedOf,
  replyTargetOf,
  runOf,
} from '@/features/inbox/communication/helpers/inboxDetailsApi.helpers';
import { messageTime } from '@/features/inbox/communication/helpers/inboxFormat.helpers';
import { InboxDividerKind, InboxMessageKind } from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxCurrentUser,
  InboxStoredDividerMessage,
  InboxStoredMessage,
} from '@/features/inbox/typedefs/inbox.typedefs';
import type { MessageSystemEvent } from '@/shared/api/generated/schema.generated';
import { IconName } from '@/shared/ui/foundations/Icon';

type ApiDetail = InboxConversationQuery['inboxConversation'];
type ApiMessage = ApiDetail['messages'][number];

const MESSAGE_KIND = {
  customer: InboxMessageKind.Customer,
  agent: InboxMessageKind.Agent,
  operator: InboxMessageKind.Operator,
} as const;

const SYSTEM_DIVIDER: Readonly<Record<MessageSystemEvent, InboxDividerKind>> = {
  escalated: InboxDividerKind.Escalated,
  took_over: InboxDividerKind.TookOver,
  handed_back: InboxDividerKind.HandedBack,
};

const SYSTEM_DIVIDER_ICON: Readonly<Record<MessageSystemEvent, IconName>> = {
  escalated: IconName.Pause,
  took_over: IconName.Hand,
  handed_back: IconName.Hand,
};

const mergeEscalationTakeover = (messages: readonly InboxStoredMessage[]): InboxStoredMessage[] =>
  messages.reduce<InboxStoredMessage[]>((merged, message) => {
    const previous = merged.at(-1);
    if (
      previous?.kind === InboxMessageKind.Divider &&
      previous.divider === InboxDividerKind.Escalated &&
      message.kind === InboxMessageKind.Divider &&
      message.divider === InboxDividerKind.TookOver
    ) {
      merged[merged.length - 1] = {
        ...message,
        id: previous.id,
        time: previous.time,
        tookAt: message.time,
      };
      return merged;
    }
    merged.push(message);
    return merged;
  }, []);

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

const toStoredDivider = (message: ApiMessage, locale: string): InboxStoredDividerMessage | null => {
  if (message.systemEvent === null) {
    return null;
  }
  return {
    kind: InboxMessageKind.Divider,
    id: message.id,
    divider: SYSTEM_DIVIDER[message.systemEvent],
    icon: SYSTEM_DIVIDER_ICON[message.systemEvent],
    name: message.authorName ?? '',
    time: messageTime(message.createdAt, locale),
    tookAt: null,
  };
};

const toStoredMessage = (
  message: ApiMessage,
  conversation: InboxConversation,
  locale: string,
  operatorLabel: string,
  currentUser: InboxCurrentUser | null,
): InboxStoredMessage | null => {
  if (message.author === 'system') {
    return message.systemEvent === null ? null : toStoredDivider(message, locale);
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
): InboxConversation => {
  const { details } = detail;
  return {
    ...conversation,
    guard: guardOf(details.guard),
    run: runOf(details, locale),
    facts: {
      ...conversation.facts,
      channel: details.channelName ?? '',
      replyTarget: replyTargetOf(details.replyTarget),
      notified: notifiedOf(details.notified),
      runs: details.runsCount,
      handledBy: details.handled?.name ?? conversation.facts.handledBy,
      handledSince:
        details.handled?.since === null || details.handled === null
          ? null
          : messageTime(details.handled.since, locale),
      handledUntil:
        details.handled?.until === null || details.handled === null
          ? null
          : messageTime(details.handled.until, locale),
    },
    messages: mergeEscalationTakeover(
      detail.messages.flatMap((message) => {
        const stored = toStoredMessage(message, conversation, locale, operatorLabel, currentUser);
        return stored === null ? [] : [stored];
      }),
    ),
  };
};

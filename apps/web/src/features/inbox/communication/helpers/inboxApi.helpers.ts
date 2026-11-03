import type { InboxConversationQuery } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import {
  InboxDividerKind,
  InboxGuardKind,
  InboxMessageKind,
  InboxNotifyChannel,
  InboxProvider,
  InboxReplyState,
  InboxReplyTarget,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxCurrentUser,
  InboxNotified,
  InboxRun,
  InboxStoredMessage,
} from '@/features/inbox/typedefs/inbox.typedefs';
import {
  ApiReplyMode,
  InboxNotifyChannel as ApiInboxNotifyChannel,
  InboxRunNodeType,
} from '@/shared/api/generated/schema.generated';
import type { MessageSystemEvent } from '@/shared/api/generated/schema.generated';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';
import { IconName } from '@/shared/ui/foundations/Icon';

type ApiSummary = InboxConversationsQuery['inboxConversations'][number];
type ApiDetail = InboxConversationQuery['inboxConversation'];
type ApiMessage = ApiDetail['messages'][number];
type ApiDetails = ApiDetail['details'];
type ApiNotified = ApiDetails['notified'];

type InboxStoredDivider = Extract<InboxStoredMessage, { readonly kind: InboxMessageKind.Divider }>;

const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_DAY = 86_400_000;

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

const INBOX_PROVIDER: Readonly<Record<ApiSummary['channelKind'], InboxProvider>> = {
  telegram: InboxProvider.Telegram,
  api: InboxProvider.Api,
  simulated: InboxProvider.Api,
};

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

const RUN_NODE_ICON: Readonly<Record<InboxRunNodeType, IconName>> = {
  trigger_message: IconName.Msg,
  trigger_external_event: IconName.Bolt,
  trigger_schedule: IconName.Cal,
  trigger_inactivity: IconName.Hour,
  agent: IconName.Agent,
  completion: IconName.Compl,
  router: IconName.Router,
  parallel: IconName.Par,
  api_request: IconName.Api,
  send_message: IconName.Send,
  escalation: IconName.Hand,
};

const REPLY_TARGET: Readonly<Record<ApiReplyMode, InboxReplyTarget>> = {
  [ApiReplyMode.Response]: InboxReplyTarget.Response,
  [ApiReplyMode.Webhook]: InboxReplyTarget.Webhook,
};

const NOTIFY_CHANNEL: Readonly<Record<ApiInboxNotifyChannel, InboxNotifyChannel>> = {
  [ApiInboxNotifyChannel.InPlatform]: InboxNotifyChannel.InPlatform,
  [ApiInboxNotifyChannel.Email]: InboxNotifyChannel.Email,
  [ApiInboxNotifyChannel.Telegram]: InboxNotifyChannel.Telegram,
};

const GUARD_KIND: Readonly<Partial<Record<InboxRunNodeType, InboxGuardKind>>> = {
  [InboxRunNodeType.Completion]: InboxGuardKind.Completion,
  [InboxRunNodeType.Agent]: InboxGuardKind.Agent,
  [InboxRunNodeType.Escalation]: InboxGuardKind.Escalation,
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

const minutesAgo = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / MILLISECONDS_PER_MINUTE));

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const relativeDay = (iso: string, locale: string): string => {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / MILLISECONDS_PER_DAY);
  if (days === 0 || days === 1) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day');
    return relative.charAt(0).toLocaleUpperCase(locale) + relative.slice(1);
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const dateTime = (iso: string, locale: string): string =>
  `${relativeDay(iso, locale)}, ${messageTime(iso, locale)}`;

const messageTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const duration = (durationMs: number | null, locale: string): string =>
  durationMs === null
    ? '—'
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(durationMs / MILLISECONDS_PER_SECOND)} s`;

const runTime = (startedAt: string | null, locale: string): string =>
  startedAt === null ? '—' : messageTime(startedAt, locale);

const guardOf = (
  guard: ApiDetails['guard'],
): {
  readonly label: string;
  readonly kind: InboxGuardKind;
  readonly reason: string | null;
} | null =>
  guard === null
    ? null
    : {
        label: guard.label,
        kind: GUARD_KIND[guard.nodeType] ?? InboxGuardKind.Completion,
        reason: guard.reason,
      };

const notifiedOf = (notified: ApiNotified): InboxNotified | null =>
  notified === null
    ? null
    : {
        names: notified.names,
        allOperators: notified.allOperators,
        channels: notified.channels.map((channel) => NOTIFY_CHANNEL[channel]),
      };

const runOf = (details: ApiDetails, locale: string): InboxRun | null =>
  details.run === null
    ? null
    : {
        id: details.run.id,
        agentVersion: details.run.agentVersion,
        time: runTime(details.run.startedAt, locale),
        duration: duration(details.run.durationMs, locale),
        steps: details.run.steps.map((step) => ({
          id: step.id,
          icon: step.nodeType === null ? IconName.Box : RUN_NODE_ICON[step.nodeType],
          label: step.label,
          value: step.value,
        })),
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

const toStoredDivider = (message: ApiMessage, locale: string): InboxStoredDivider | null => {
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
      replyTarget: details.replyTarget === null ? null : REPLY_TARGET[details.replyTarget],
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

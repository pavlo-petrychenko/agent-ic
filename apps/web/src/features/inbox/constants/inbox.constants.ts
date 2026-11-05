import { SIMULATOR_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { ConversationState, InboxQueue } from '@/shared/api/generated/schema.generated';
import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';

export enum InboxTab {
  NeedsYou = 'needsYou',
  Live = 'live',
  Closed = 'closed',
}

export const INBOX_TABS: readonly InboxTab[] = [InboxTab.NeedsYou, InboxTab.Live, InboxTab.Closed];

export const INBOX_QUEUE_BY_TAB: Readonly<Record<InboxTab, InboxQueue>> = {
  [InboxTab.NeedsYou]: InboxQueue.NeedsYou,
  [InboxTab.Live]: InboxQueue.Live,
  [InboxTab.Closed]: InboxQueue.Closed,
};

export const INBOX_TAB_BY_STATE: Readonly<Record<ConversationState, InboxTab>> = {
  [ConversationState.Waiting]: InboxTab.NeedsYou,
  [ConversationState.Handled]: InboxTab.NeedsYou,
  [ConversationState.AgentActive]: InboxTab.Live,
  [ConversationState.Closed]: InboxTab.Closed,
};

export enum InboxProvider {
  Telegram = 'telegram',
  Api = 'api',
}

export enum InboxReplyState {
  Waiting = 'waiting',
  Mine = 'mine',
  Operator = 'operator',
  Agent = 'agent',
  Closed = 'closed',
}

export enum InboxMessageKind {
  Customer = 'customer',
  Agent = 'agent',
  Operator = 'operator',
  Divider = 'divider',
  Escalation = 'escalation',
}

export enum InboxGuardKind {
  Completion = 'completion',
  Agent = 'agent',
  Escalation = 'escalation',
}

export enum InboxTone {
  Neutral = 'neutral',
  Dark = 'dark',
  Accent = 'accent',
  Violet = 'violet',
  Ok = 'ok',
  Warn = 'warn',
  Err = 'err',
}

export enum InboxDividerKind {
  FlowPaused = 'flowPaused',
  Escalated = 'escalated',
  TookOver = 'tookOver',
  HandedBack = 'handedBack',
}

export const INBOX_TAB_BY_REPLY_STATE: Readonly<Record<InboxReplyState, InboxTab>> = {
  [InboxReplyState.Waiting]: InboxTab.NeedsYou,
  [InboxReplyState.Mine]: InboxTab.NeedsYou,
  [InboxReplyState.Operator]: InboxTab.NeedsYou,
  [InboxReplyState.Agent]: InboxTab.Live,
  [InboxReplyState.Closed]: InboxTab.Closed,
};

export enum InboxReplyTarget {
  Response = 'response',
  Webhook = 'webhook',
}

export enum InboxNotifyChannel {
  InPlatform = 'in_platform',
  Email = 'email',
  Telegram = 'telegram',
}

export enum InboxActionId {
  Close = 'close',
  HandBack = 'hand-back',
  TakeOver = 'take-over',
}

export enum InboxRowStatusKind {
  Waiting = 'waiting',
  Mine = 'mine',
  Operator = 'operator',
  Agent = 'agent',
}

export enum InboxFooterKind {
  Composer = 'composer',
  Note = 'note',
  TakeOver = 'takeOver',
}

export const INBOX_MINUTES_PER_HOUR = 60;

export const INBOX_MINUTES_PER_DAY = 1440;

export const INBOX_CONVERSATIONS_PAGE_SIZE = 30;

export const INBOX_BADGE_POLL_INTERVAL_MS = 30_000;

export const INBOX_CLOSING_MESSAGE_MAX_LENGTH = SIMULATOR_MESSAGE_MAX_LENGTH;

export const INBOX_CHAT_FROM: Readonly<
  Record<
    InboxMessageKind.Customer | InboxMessageKind.Agent | InboxMessageKind.Operator,
    ChatBubbleFrom
  >
> = {
  [InboxMessageKind.Customer]: ChatBubbleFrom.Customer,
  [InboxMessageKind.Agent]: ChatBubbleFrom.Agent,
  [InboxMessageKind.Operator]: ChatBubbleFrom.Operator,
};

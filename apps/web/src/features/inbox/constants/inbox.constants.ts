import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { IconName } from '@/shared/ui/foundations/Icon';

export enum InboxTab {
  NeedsYou = 'needsYou',
  Live = 'live',
  Closed = 'closed',
}

export const INBOX_TABS: readonly InboxTab[] = [InboxTab.NeedsYou, InboxTab.Live, InboxTab.Closed];

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

export enum InboxRunStepKind {
  IncomingMessage = 'incomingMessage',
  Parallel = 'parallel',
  Guard = 'guard',
  NeedsPerson = 'needsPerson',
  NotifyOperator = 'notifyOperator',
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

export const INBOX_MINUTES_PER_DAY = 1440;

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

export const INBOX_RUN_STEP_ICON: Readonly<Record<InboxRunStepKind, IconName>> = {
  [InboxRunStepKind.IncomingMessage]: IconName.Msg,
  [InboxRunStepKind.Parallel]: IconName.Par,
  [InboxRunStepKind.Guard]: IconName.Compl,
  [InboxRunStepKind.NeedsPerson]: IconName.Hand,
  [InboxRunStepKind.NotifyOperator]: IconName.User,
};

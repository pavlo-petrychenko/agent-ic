import {
  ACTIVE_RUN_STATUSES,
  CONVERSATION_EVENT_ID,
  ChatEventKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
  EVENT_ID_SEPARATOR,
  MESSAGE_SPEAKERS,
} from '@/features/testing/constants/simulator.constants';
import { CLOSABLE_RUN_STATUSES, TurnOutcome } from '@/features/testing/constants/trace.constants';
import type {
  ChatConversation,
  ChatEventItem,
  ChatItem,
  ChatMessageItem,
  ChatTurnItem,
  SimulatorConversation,
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import type { TurnStatus } from '@/features/testing/typedefs/trace.typedefs';
import {
  ConversationCloseReason,
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export const turnStatus = (
  status: RunStatus,
  handedBack: boolean,
  closing: TurnOutcome | null,
): TurnStatus => {
  if (closing !== null && CLOSABLE_RUN_STATUSES.has(status)) {
    return closing;
  }
  return status === RunStatus.Escalated && handedBack ? TurnOutcome.HandedBack : status;
};

export const closingOutcome = (conversation: ChatConversation): TurnOutcome | null => {
  if (conversation.state !== ConversationState.Closed) {
    return null;
  }
  return conversation.closeReason === ConversationCloseReason.Inactivity
    ? TurnOutcome.ClosedInactive
    : TurnOutcome.Ended;
};

export const runTexts = (
  messages: readonly SimulatorMessage[],
  runId: string | null,
): readonly string[] =>
  runId === null
    ? []
    : messages.flatMap((message) => (message.runId === runId ? [message.text] : []));

export const isActiveRun = (run: SimulatorRun): boolean => ACTIVE_RUN_STATUSES.has(run.status);

const runOutcome = (run: SimulatorRun | null) => ({
  failed: run?.status === RunStatus.Failed,
  escalated: run?.status === RunStatus.Escalated,
  escalatedByStep: run?.escalatedByStep ?? false,
  escalationMessageCount: run?.escalationMessageCount ?? 0,
  errorMessage: run?.errorMessage ?? null,
  finishedAt: run?.finishedAt ?? null,
});

const isOperatorLine = (item: ChatItem | undefined): boolean =>
  item?.kind === ChatItemKind.Message && item.speaker === ChatSpeaker.Operator;

const eventAfter = (anchorId: string, kind: ChatEventKind, at: string | null): ChatEventItem => ({
  kind: ChatItemKind.Event,
  id: [anchorId, kind].join(EVENT_ID_SEPARATOR),
  at,
  event: kind,
});

const turnEnd = (turn: ChatTurnItem): string =>
  turn.finishedAt ?? turn.messages.at(-1)?.createdAt ?? turn.at;

const withEvents = (items: readonly ChatItem[], state: ConversationState): ChatItem[] =>
  items.flatMap((item, index) => {
    const next = items.at(index + 1);
    const handedBack =
      next === undefined ? state === ConversationState.AgentActive : !isOperatorLine(next);
    const handBack = handedBack ? [eventAfter(item.id, ChatEventKind.HandedBack, null)] : [];
    if (item.kind === ChatItemKind.Turn && item.escalated) {
      const kind = item.escalatedByStep ? ChatEventKind.Escalated : ChatEventKind.HandedOff;
      return [item, eventAfter(item.id, kind, turnEnd(item)), ...handBack];
    }
    if (isOperatorLine(item)) {
      const takeOver =
        index > 0 && isOperatorLine(items.at(index - 1))
          ? []
          : [eventAfter(item.id, ChatEventKind.TakenOver, item.at)];
      return [...takeOver, item, ...handBack];
    }
    return [item];
  });

const closing = (conversation: ChatConversation): ChatEventItem[] => {
  if (conversation.state !== ConversationState.Closed) {
    return [];
  }
  const kind =
    conversation.closeReason === ConversationCloseReason.Inactivity
      ? ChatEventKind.ClosedInactive
      : ChatEventKind.Ended;
  return [eventAfter(CONVERSATION_EVENT_ID, kind, conversation.closedAt)];
};

const startsNewExchange = (item: ChatItem): boolean =>
  item.kind === ChatItemKind.Turn ||
  (item.kind === ChatItemKind.Message && item.speaker === ChatSpeaker.User);

const withHandedBackTurns = (items: readonly ChatItem[]): ChatItem[] =>
  items.map((item, index) => {
    if (item.kind !== ChatItemKind.Turn || !item.escalated) {
      return item;
    }
    const following = items.slice(index + 1);
    const end = following.findIndex(startsNewExchange);
    const exchange = end === -1 ? following : following.slice(0, end);
    return {
      ...item,
      handedBack: exchange.some(
        (next) => next.kind === ChatItemKind.Event && next.event === ChatEventKind.HandedBack,
      ),
    };
  });

export const composerMode = (state: ConversationState, takingOver: boolean): ComposerMode => {
  if (state === ConversationState.Closed) {
    return ComposerMode.Ended;
  }
  if (state === ConversationState.Handled) {
    return ComposerMode.Operator;
  }
  if (state === ConversationState.Waiting) {
    return takingOver ? ComposerMode.Operator : ComposerMode.Escalated;
  }
  return ComposerMode.User;
};

export const toChatItems = ({
  messages,
  runs,
  ...conversation
}: SimulatorConversation): ChatItem[] => {
  const runById = new Map(runs.map((run) => [run.id, run]));
  const items: (ChatMessageItem | ChatTurnItem)[] = [];
  for (const message of messages) {
    const last = items.at(-1);
    if (message.author !== MessageAuthor.Agent || message.runId === null) {
      items.push({
        kind: ChatItemKind.Message,
        id: message.id,
        at: message.createdAt,
        speaker: MESSAGE_SPEAKERS[message.author],
        text: message.text,
      });
    } else if (last?.kind === ChatItemKind.Turn && last.id === message.runId) {
      items[items.length - 1] = { ...last, messages: [...last.messages, message] };
    } else {
      items.push({
        kind: ChatItemKind.Turn,
        id: message.runId,
        at: message.createdAt,
        messages: [message],
        handedBack: false,
        ...runOutcome(runById.get(message.runId) ?? null),
      });
    }
  }
  const grouped = new Set(items.map((item) => item.id));
  const silent: ChatTurnItem[] = runs
    .filter((run) => !grouped.has(run.id) && !isActiveRun(run))
    .map((run) => ({
      kind: ChatItemKind.Turn,
      id: run.id,
      at: run.createdAt,
      messages: [],
      handedBack: false,
      ...runOutcome(run),
    }));
  return withHandedBackTurns([
    ...withEvents(
      [...items, ...silent].toSorted((a, b) => a.at.localeCompare(b.at)),
      conversation.state,
    ),
    ...closing(conversation),
  ]);
};

export const handedBackRunIds = (conversation: SimulatorConversation): ReadonlySet<string> =>
  new Set(
    toChatItems(conversation).flatMap((item) =>
      item.kind === ChatItemKind.Turn && item.handedBack ? [item.id] : [],
    ),
  );

export const latestRunId = (runs: readonly SimulatorRun[]): string | null =>
  runs.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.id ?? null;

export const turnNumber = (runs: readonly SimulatorRun[], runId: string | null): number | null => {
  const index = runs
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .findIndex((run) => run.id === runId);
  return index === -1 ? null : index + 1;
};

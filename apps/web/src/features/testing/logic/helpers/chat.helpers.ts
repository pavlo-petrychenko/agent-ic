import {
  ACTIVE_RUN_STATUSES,
  ChatDividerKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
  DIVIDER_ID_SEPARATOR,
  MESSAGE_SPEAKERS,
} from '@/features/testing/constants/simulator.constants';
import { HandedBackStatus } from '@/features/testing/constants/trace.constants';
import type {
  ChatItem,
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import type { TurnStatus } from '@/features/testing/typedefs/trace.typedefs';
import {
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export const turnStatus = (status: RunStatus, handedBack: boolean): TurnStatus =>
  status === RunStatus.Escalated && handedBack ? HandedBackStatus.HandedBack : status;

export const isActiveRun = (run: SimulatorRun): boolean => ACTIVE_RUN_STATUSES.has(run.status);

const runOutcome = (run: SimulatorRun | null) => ({
  failed: run?.status === RunStatus.Failed,
  escalated: run?.status === RunStatus.Escalated,
  escalationMessageCount: run?.escalationMessageCount ?? 0,
  errorMessage: run?.errorMessage ?? null,
});

const isOperatorLine = (item: ChatItem | undefined): boolean =>
  item?.kind === ChatItemKind.Message && item.speaker === ChatSpeaker.Operator;

const divider = (item: ChatItem, kind: ChatDividerKind): ChatItem => ({
  kind: ChatItemKind.Divider,
  id: [item.id, kind].join(DIVIDER_ID_SEPARATOR),
  at: item.at,
  divider: kind,
});

const withDividers = (items: readonly ChatItem[], state: ConversationState): ChatItem[] =>
  items.flatMap((item, index) => {
    const next = items.at(index + 1);
    const handedBack =
      next === undefined ? state === ConversationState.AgentActive : !isOperatorLine(next);
    const escalated = item.kind === ChatItemKind.Turn && item.escalated;
    if (escalated) {
      const escalation = divider(item, ChatDividerKind.Escalated);
      return handedBack
        ? [item, escalation, divider(item, ChatDividerKind.HandedBack)]
        : [item, escalation];
    }
    if (isOperatorLine(item) && handedBack) {
      return [item, divider(item, ChatDividerKind.HandedBack)];
    }
    return [item];
  });

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
        (next) => next.kind === ChatItemKind.Divider && next.divider === ChatDividerKind.HandedBack,
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

export const toChatItems = (
  messages: readonly SimulatorMessage[],
  runs: readonly SimulatorRun[],
  state: ConversationState,
): ChatItem[] => {
  const runById = new Map(runs.map((run) => [run.id, run]));
  const items: ChatItem[] = [];
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
  const silent: ChatItem[] = runs
    .filter((run) => !grouped.has(run.id) && !isActiveRun(run))
    .map((run) => ({
      kind: ChatItemKind.Turn,
      id: run.id,
      at: run.createdAt,
      messages: [],
      handedBack: false,
      ...runOutcome(run),
    }));
  return withHandedBackTurns(
    withDividers(
      [...items, ...silent].toSorted((a, b) => a.at.localeCompare(b.at)),
      state,
    ),
  );
};

export const handedBackRunIds = (
  messages: readonly SimulatorMessage[],
  runs: readonly SimulatorRun[],
  state: ConversationState,
): ReadonlySet<string> =>
  new Set(
    toChatItems(messages, runs, state).flatMap((item) =>
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

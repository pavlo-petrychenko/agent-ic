import {
  ACTIVE_RUN_STATUSES,
  ChatDividerKind,
  ChatItemKind,
  ChatSpeaker,
  ComposerMode,
  DIVIDER_ID_SEPARATOR,
  MESSAGE_SPEAKERS,
} from '@/features/testing/constants/simulator.constants';
import type {
  ChatItem,
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import {
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export const isActiveRun = (run: SimulatorRun): boolean => ACTIVE_RUN_STATUSES.has(run.status);

const runOutcome = (run: SimulatorRun | null) => ({
  failed: run?.status === RunStatus.Failed,
  escalated: run?.status === RunStatus.Escalated,
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

export const composerMode = (state: ConversationState, takingOver: boolean): ComposerMode => {
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
      ...runOutcome(run),
    }));
  return withDividers(
    [...items, ...silent].toSorted((a, b) => a.at.localeCompare(b.at)),
    state,
  );
};

export const latestRunId = (runs: readonly SimulatorRun[]): string | null =>
  runs.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.id ?? null;

export const turnNumber = (runs: readonly SimulatorRun[], runId: string | null): number | null => {
  const index = runs
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .findIndex((run) => run.id === runId);
  return index === -1 ? null : index + 1;
};

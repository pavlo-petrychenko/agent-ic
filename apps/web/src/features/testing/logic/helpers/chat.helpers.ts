import {
  ACTIVE_RUN_STATUSES,
  ChatItemKind,
  MESSAGE_SPEAKERS,
} from '@/features/testing/constants/simulator.constants';
import type {
  ChatItem,
  SimulatorMessage,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import { MessageAuthor, RunStatus } from '@/shared/api/generated/schema.generated';

export const isActiveRun = (run: SimulatorRun): boolean => ACTIVE_RUN_STATUSES.has(run.status);

const runOutcome = (run: SimulatorRun | null) => ({
  failed: run?.status === RunStatus.Failed,
  errorMessage: run?.errorMessage ?? null,
});

export const toChatItems = (
  messages: readonly SimulatorMessage[],
  runs: readonly SimulatorRun[],
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
  return [...items, ...silent].toSorted((a, b) => a.at.localeCompare(b.at));
};

export const latestRunId = (runs: readonly SimulatorRun[]): string | null =>
  runs.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.id ?? null;

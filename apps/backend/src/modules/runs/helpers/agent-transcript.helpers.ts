import { AGENT_MESSAGES_FIELD_NAME } from '@agent-ic/flow';
import { MessageAuthor } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import type {
  RunTranscript,
  StepTrace,
  StepTranscript,
} from '@/modules/runs/typedefs/agent-transcript.typedefs';
import type { RunStepResult, StepData } from '@/modules/runs/typedefs/run-step.typedefs';

export const earlierRunIds = (history: readonly Message[], currentRunId: string): string[] => [
  ...new Set(
    history.flatMap(({ runId }) => (runId === null || runId === currentRunId ? [] : [runId])),
  ),
];

export const sentTextsOf = (output: StepData | null): string[] => {
  const messages = output?.[AGENT_MESSAGES_FIELD_NAME];
  return Array.isArray(messages)
    ? messages.filter((text): text is string => typeof text === 'string')
    : [];
};

export const transcriptsByRun = (
  steps: readonly StepTranscript[],
  nodeId: string,
): ReadonlyMap<string, RunTranscript> => {
  const byRun = new Map<string, RunTranscript>();
  for (const step of steps) {
    if (step.nodeId !== nodeId) {
      continue;
    }
    const before = byRun.get(step.runId);
    byRun.set(step.runId, {
      transcript: [...(before?.transcript ?? []), ...step.transcript],
      sentTexts: new Set([...(before?.sentTexts ?? []), ...sentTextsOf(step.output)]),
    });
  }
  return byRun;
};

export const agentRunOf = (
  message: Message,
  transcripts: ReadonlyMap<string, RunTranscript>,
): RunTranscript | null =>
  message.author === MessageAuthor.Agent && message.runId !== null
    ? (transcripts.get(message.runId) ?? null)
    : null;

export const stepTraceColumns = (
  trace: StepTrace | null,
): Pick<RunStepResult, 'toolCalls' | 'transcript'> => ({
  toolCalls: trace?.toolCalls ?? null,
  transcript: trace?.transcript ?? null,
});

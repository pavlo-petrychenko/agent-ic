import { EscalationMode } from '@agent-ic/flow';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEscalationOutput = (output: unknown): output is Record<string, unknown> =>
  isRecord(output) && output.mode === EscalationMode.Escalate;

export const escalatedByStep = (outputs: readonly unknown[]): boolean =>
  outputs.some(isEscalationOutput);

export const escalationMessageCount = (outputs: readonly unknown[]): number =>
  outputs.reduce<number>(
    (count, output) =>
      isEscalationOutput(output) && Array.isArray(output.messageIds)
        ? count + output.messageIds.length
        : count,
    0,
  );

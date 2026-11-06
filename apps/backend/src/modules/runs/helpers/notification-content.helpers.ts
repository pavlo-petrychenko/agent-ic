import { AGENT_OUTCOME_REASON_FIELD_NAME } from '@agent-ic/flow';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

export const notificationReasonOf = (step: RunStep | null): string | null => {
  if (step === null) {
    return null;
  }
  return (
    textOf(step.output?.['reason']) ??
    textOf(step.output?.[AGENT_OUTCOME_REASON_FIELD_NAME]) ??
    textOf(step.error?.message)
  );
};

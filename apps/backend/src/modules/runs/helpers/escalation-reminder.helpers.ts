import { EscalationMode, NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import {
  ESCALATION_FALLBACK_JOB_PREFIX,
  ESCALATION_FALLBACK_NODE_PREFIX,
  ESCALATION_REMINDER_JOB_PREFIX,
} from '@/modules/runs/constants/escalation-reminder.constants';
import type { EscalationHandoff } from '@/modules/runs/typedefs/escalation-reminder.typedefs';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';

export interface HandoffTimingSource {
  readonly reminderAfterMinutes: number | null;
  readonly fallbackAfterMinutes: number | null;
}

export interface HandoffTiming {
  readonly reminderAfterMinutes: number | null;
  readonly fallbackAfterMinutes: number | null;
}

export const NO_HANDOFF_TIMING: HandoffTiming = {
  reminderAfterMinutes: null,
  fallbackAfterMinutes: null,
};

export const handoffTimingOf = (handoff: HandoffTimingSource | null): HandoffTiming =>
  handoff === null
    ? NO_HANDOFF_TIMING
    : {
        reminderAfterMinutes: handoff.reminderAfterMinutes,
        fallbackAfterMinutes: handoff.fallbackAfterMinutes,
      };

export const handoffOfStep = (flow: FlowDocument, step: RunStep): EscalationHandoff | null => {
  const node: FlowNode | undefined = flow.nodes.find((candidate) => candidate.id === step.nodeId);
  const handoff =
    node?.type === NodeType.Escalation && node.config.mode === EscalationMode.Escalate
      ? node.config
      : flow.settings.handoff;
  if (handoff === null) {
    return null;
  }
  return {
    reminderAfterMinutes: handoff.reminderAfterMinutes,
    fallbackAfterMinutes: handoff.fallbackAfterMinutes,
    fallbackTemplate: handoff.fallbackMessage,
  };
};

export const isEscalationReminderDue = (
  escalatedAt: Date,
  afterMinutes: number,
  now: Date,
): boolean =>
  escalatedAt.getTime() + afterMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND <=
  now.getTime();

export const escalationFallbackNodeId = (runStepId: string): string =>
  `${ESCALATION_FALLBACK_NODE_PREFIX}:${runStepId}`;

export const escalationReminderJobId = (runStepId: string): string =>
  `${ESCALATION_REMINDER_JOB_PREFIX}:${runStepId}`;

export const escalationFallbackJobId = (runStepId: string): string =>
  `${ESCALATION_FALLBACK_JOB_PREFIX}:${runStepId}`;

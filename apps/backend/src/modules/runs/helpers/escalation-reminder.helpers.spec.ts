import {
  AgentExitKind,
  EscalationMode,
  NodeType,
  NotifyChannel,
  RecipientsKind,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  escalationFallbackJobId,
  escalationReminderJobId,
  handoffOfStep,
  handoffTimingOf,
} from '@/modules/runs/helpers/escalation-reminder.helpers';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';

const handoff = {
  notify: {
    recipients: { kind: RecipientsKind.Operators } as const,
    channels: [NotifyChannel.InPlatform],
  },
  reminderAfterMinutes: 5,
  fallbackAfterMinutes: 30,
  fallbackMessage: 'Fallback',
};

const step = (nodeId: string): RunStep =>
  ({
    id: 'step-1',
    nodeId,
    status: 'succeeded',
    input: {},
    output: { outcome: AgentExitKind.Handoff },
    error: null,
  }) as unknown as RunStep;

const flow = (overrides: Partial<FlowDocument> = {}): FlowDocument =>
  ({
    schemaVersion: 1,
    nodes: [],
    edges: [],
    settings: { handoff, onUnhandledFailure: null, autoClose: null },
    ...overrides,
  }) as unknown as FlowDocument;

describe('handoffOfStep', () => {
  it('uses the Escalation config for an Escalation step', () => {
    const escalation = flow({
      nodes: [
        {
          id: 'node-1',
          type: NodeType.Escalation,
          config: { mode: EscalationMode.Escalate, ...handoff },
        },
      ] as unknown as FlowDocument['nodes'],
      settings: { handoff: null, onUnhandledFailure: null, autoClose: null },
    });

    expect(handoffOfStep(escalation, step('node-1'))).toEqual({
      reminderAfterMinutes: 5,
      fallbackAfterMinutes: 30,
      fallbackTemplate: 'Fallback',
    });
  });

  it('uses the flow handoff settings for an Agent step', () => {
    const agentFlow = flow({
      nodes: [{ id: 'node-1', type: NodeType.Agent }] as unknown as FlowDocument['nodes'],
    });

    expect(handoffOfStep(agentFlow, step('node-1'))).toMatchObject({
      reminderAfterMinutes: 5,
      fallbackAfterMinutes: 30,
      fallbackTemplate: 'Fallback',
    });
  });

  it('returns null when there are no handoff settings', () => {
    const noHandoff = flow({
      nodes: [{ id: 'node-1', type: NodeType.Agent }] as unknown as FlowDocument['nodes'],
      settings: { handoff: null, onUnhandledFailure: null, autoClose: null },
    });

    expect(handoffOfStep(noHandoff, step('node-1'))).toBeNull();
  });
});

describe('handoffTimingOf', () => {
  it('copies the configured minutes and returns nulls without settings', () => {
    expect(handoffTimingOf(handoff)).toEqual({
      reminderAfterMinutes: 5,
      fallbackAfterMinutes: 30,
    });
    expect(handoffTimingOf(null)).toEqual({
      reminderAfterMinutes: null,
      fallbackAfterMinutes: null,
    });
  });
});

describe('escalation timer job ids', () => {
  it('derives stable ids from the run step', () => {
    expect(escalationReminderJobId('step-1')).toBe('escalation-reminder-step-1');
    expect(escalationFallbackJobId('step-1')).toBe('escalation-fallback-step-1');
  });
});

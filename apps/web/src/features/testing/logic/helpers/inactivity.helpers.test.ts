import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import {
  FLOW_SCHEMA_VERSION,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
  NO_FLOW_SETTINGS,
  NodeType,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  InactivityAction,
  InactivityRefusal,
} from '@/features/testing/constants/inactivity.constants';
import {
  followUpsSent,
  inactivityOffsets,
  inactivityRefusal,
  nextInactivity,
} from '@/features/testing/logic/helpers/inactivity.helpers';
import type {
  SimulatorConversation,
  SimulatorRun,
} from '@/features/testing/typedefs/simulator.typedefs';
import { AppError } from '@/shared/api/errors/app.error';
import { MessageAuthor, RunStatus, RunTrigger } from '@/shared/api/generated/schema.generated';

const DAY_MINUTES = 1440;

const INACTIVITY_NODE: FlowNode = {
  id: 'node_inactivity',
  key: 'inactivity',
  label: 'Inactivity',
  position: { x: 0, y: 0 },
  type: NodeType.TriggerInactivity,
  config: {
    silence: { amount: 2, unit: InactivityUnit.Hours },
    activity: InactivityActivity.Any,
    repeat: {
      kind: InactivityRepeatKind.Every,
      every: { amount: 2, unit: InactivityUnit.Hours },
      maxTimes: 2,
    },
    conditions: { notEscalated: true, channelTypes: [] },
  },
};

const flow = (autoCloseMinutes: number | null, nodes: FlowNode[] = []): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings: {
    ...NO_FLOW_SETTINGS,
    autoClose: autoCloseMinutes === null ? null : { afterMinutes: autoCloseMinutes },
  },
  nodes,
  edges: [],
});

const run = (id: string, trigger: RunTrigger, createdAt: string): SimulatorRun => ({
  id,
  trigger,
  inactivityAttempt: null,
  status: RunStatus.Succeeded,
  createdAt,
  finishedAt: null,
  errorMessage: null,
  escalationMessageCount: 0,
  escalatedByStep: false,
});

const CUSTOMER = {
  id: 'm1',
  author: MessageAuthor.Customer,
  text: 'Hi',
  runId: null,
  createdAt: '2026-10-11T10:00:00Z',
};

const chat = (runs: SimulatorRun[]): Pick<SimulatorConversation, 'messages' | 'runs'> => ({
  messages: [CUSTOMER],
  runs,
});

const REPLY = run('r1', RunTrigger.Message, '2026-10-11T10:00:01Z');
const FIRST_FOLLOW_UP = run('r2', RunTrigger.Inactivity, '2026-10-11T12:00:00Z');
const SECOND_FOLLOW_UP = run('r3', RunTrigger.Inactivity, '2026-10-11T14:00:00Z');

describe('nextInactivity', () => {
  it('fires the inactivity trigger first when it is due before auto-close', () => {
    expect(nextInactivity(flow(DAY_MINUTES, [INACTIVITY_NODE]), chat([REPLY]))).toEqual({
      action: InactivityAction.Trigger,
      afterMinutes: 120,
      attempt: 1,
    });
    expect(nextInactivity(flow(null, [INACTIVITY_NODE]), chat([REPLY, FIRST_FOLLOW_UP]))).toEqual({
      action: InactivityAction.Trigger,
      afterMinutes: 240,
      attempt: 2,
    });
  });

  it('closes the chat once every follow-up is sent or auto-close comes first', () => {
    expect(
      nextInactivity(
        flow(DAY_MINUTES, [INACTIVITY_NODE]),
        chat([REPLY, FIRST_FOLLOW_UP, SECOND_FOLLOW_UP]),
      ),
    ).toEqual({ action: InactivityAction.AutoClose, afterMinutes: DAY_MINUTES });
    expect(nextInactivity(flow(60, [INACTIVITY_NODE]), chat([REPLY]))).toEqual({
      action: InactivityAction.AutoClose,
      afterMinutes: 60,
    });
  });

  it('has nothing to simulate without auto-close and follow-ups left, or without a flow', () => {
    expect(
      nextInactivity(flow(null, [INACTIVITY_NODE]), chat([FIRST_FOLLOW_UP, SECOND_FOLLOW_UP])),
    ).toBeNull();
    expect(nextInactivity(flow(null), chat([REPLY]))).toBeNull();
    expect(nextInactivity(null, chat([REPLY]))).toBeNull();
  });
});

describe('followUpsSent', () => {
  it('counts the follow-ups since the last customer message or agent turn', () => {
    expect(followUpsSent(chat([REPLY, FIRST_FOLLOW_UP, SECOND_FOLLOW_UP]))).toBe(2);
    expect(
      followUpsSent(chat([FIRST_FOLLOW_UP, run('r4', RunTrigger.Message, '2026-10-11T13:00:00Z')])),
    ).toBe(0);
    expect(
      followUpsSent({
        messages: [{ ...CUSTOMER, createdAt: '2026-10-11T13:00:00Z' }],
        runs: [FIRST_FOLLOW_UP],
      }),
    ).toBe(0);
  });
});

describe('inactivityOffsets', () => {
  it('lists when each follow-up fires', () => {
    expect(inactivityOffsets(flow(null, [INACTIVITY_NODE]))).toEqual([120, 240]);
    expect(inactivityOffsets(null)).toEqual([]);
  });
});

describe('inactivityRefusal', () => {
  const refused = (reason: ErrorReason, outcome: string) =>
    new AppError('refused', { code: ErrorCode.Conflict, reason, details: { outcome } });

  it('names the condition that stopped the follow-up', () => {
    expect(inactivityRefusal(refused(ErrorReason.InactivityConditionsNotMet, 'escalated'))).toBe(
      InactivityRefusal.Escalated,
    );
  });

  it('leaves other errors to the generic message', () => {
    expect(inactivityRefusal(refused(ErrorReason.InactivityConditionsNotMet, 'odd'))).toBeNull();
    expect(inactivityRefusal(refused(ErrorReason.ConversationBusy, 'escalated'))).toBeNull();
  });
});

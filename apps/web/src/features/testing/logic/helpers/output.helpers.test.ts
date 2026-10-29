import {
  AgentExitKind,
  EscalationMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NO_FLOW_SETTINGS,
  NodeType,
  NotifyChannel,
  QuickRepliesKind,
  RecipientsKind,
  RetrievalMode,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode, HandoffSettings } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  ExitPath,
  OutputViewKind,
  StepSection,
} from '@/features/testing/constants/trace.constants';
import {
  autoCloseView,
  formatSeconds,
  inspectStep,
  toOutputView,
  toStepView,
  withHandBack,
} from '@/features/testing/logic/helpers/output.helpers';
import type { EscalationView, StepContext } from '@/features/testing/typedefs/trace.typedefs';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

const step = {
  id: 'step_1',
  nodeId: 'node_1',
  status: RunStepStatus.Succeeded,
  input: { message: { text: 'Hi' } },
  output: { ok: true },
  errorMessage: null,
};

const NOTHING: StepContext = { node: null, flow: null, texts: [] };

const NODE_BASE = { key: 'step', position: { x: 0, y: 0 } };

const HANDOFF: HandoffSettings = {
  notify: { recipients: { kind: RecipientsKind.Operators }, channels: [NotifyChannel.InPlatform] },
  reminderAfterMinutes: null,
  fallbackAfterMinutes: null,
  fallbackMessage: '',
};

const REPLY: FlowNode = {
  ...NODE_BASE,
  id: 'node_reply',
  label: 'Send replies',
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.Text, text: 'Hi' },
    typing: true,
    waitForDelivery: false,
    quickReplies: { kind: QuickRepliesKind.None },
  },
};

const ESCALATION: FlowNode = {
  ...NODE_BASE,
  id: 'node_escalation',
  label: 'Notify operator',
  type: NodeType.Escalation,
  config: { mode: EscalationMode.Escalate, customerMessage: null, reason: 'Complaint', ...HANDOFF },
};

const AGENT: FlowNode = {
  ...NODE_BASE,
  id: 'node_agent',
  label: 'Receptionist',
  type: NodeType.Agent,
  config: {
    prompt: null,
    model: null,
    reasoning: null,
    knowledgeBaseIds: [],
    retrievalMode: RetrievalMode.Tools,
    output: [],
    retries: 0,
    exits: { end: { when: 'Goodbye' }, handoff: { when: 'Asks for a person' } },
  },
};

const FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings: { ...NO_FLOW_SETTINGS, handoff: HANDOFF, autoClose: { afterMinutes: 1440 } },
  nodes: [AGENT, ESCALATION, REPLY],
  edges: [{ id: 'edge_end', source: AGENT.id, sourcePort: AgentExitKind.End, target: REPLY.id }],
};

const at = (node: FlowNode, texts: readonly string[] = []): StepContext => ({
  node,
  flow: FLOW,
  texts,
});

const escalationView: EscalationView = {
  kind: OutputViewKind.Escalation,
  mode: EscalationMode.Escalate,
  reason: null,
  recipients: null,
  wouldNotify: null,
  message: null,
  resumed: false,
};

describe('toOutputView', () => {
  it('shows a flat object as fields, with a dash for empty values', () => {
    expect(toOutputView({ needs_human: false, reason: null }, 'en', NOTHING)).toEqual({
      kind: OutputViewKind.Fields,
      fields: [
        { label: 'needs_human', value: 'false' },
        { label: 'reason', value: '—' },
      ],
    });
  });

  it('shows nested output as JSON, also for an agent that did not exit', () => {
    expect(toOutputView({ messages: ['Hi'], outcome: 'continue' }, 'en', at(AGENT))).toEqual({
      kind: OutputViewKind.Json,
      code: '{\n  "messages": [\n    "Hi"\n  ],\n  "outcome": "continue"\n}',
    });
  });

  it('shows nothing for a step without output', () => {
    expect(toOutputView(null, 'en', NOTHING)).toBeNull();
    expect(toOutputView({}, 'en', NOTHING)).toBeNull();
  });

  it('reads an escalation as mode, reason, recipients, who it would notify and its message', () => {
    const output = { mode: 'escalate', messageIds: ['m1'], reason: 'Complaint' };

    expect(
      toOutputView(
        { ...output, wouldNotify: ['Pavlo', 'Oksana'] },
        'en',
        at(ESCALATION, ['Bringing in our manager.']),
      ),
    ).toEqual({
      ...escalationView,
      reason: 'Complaint',
      recipients: { kind: RecipientsKind.Operators },
      wouldNotify: 'Pavlo, Oksana',
      message: 'Bringing in our manager.',
    });
    expect(toOutputView({ ...output, wouldNotify: [] }, 'uk', at(ESCALATION))).toMatchObject({
      wouldNotify: null,
      message: null,
    });
  });

  it('marks an escalation as resumed only after a hand back', () => {
    expect(withHandBack(escalationView, true)).toEqual({ ...escalationView, resumed: true });
    expect(withHandBack(escalationView, false)).toBe(escalationView);
  });

  it('shows another node output with wouldNotify as JSON, not as an escalation', () => {
    expect(toOutputView({ wouldNotify: ['Pavlo'] }, 'en', NOTHING)).toEqual({
      kind: OutputViewKind.Json,
      code: '{\n  "wouldNotify": [\n    "Pavlo"\n  ]\n}',
    });
  });

  it('reads a default hand-off of an agent with the flow settings recipients', () => {
    expect(
      toOutputView(
        { messages: ['A manager will reply.'], outcome: 'handoff', outcome_reason: 'Refund' },
        'en',
        at(AGENT),
      ),
    ).toEqual({
      kind: OutputViewKind.AgentExit,
      outcome: AgentExitKind.Handoff,
      reason: 'Refund',
      path: ExitPath.Default,
      next: null,
      recipients: { kind: RecipientsKind.Operators },
      message: 'A manager will reply.',
    });
  });

  it('names the step a connected exit port goes on to', () => {
    expect(
      toOutputView({ messages: ['Bye'], outcome: 'end', outcome_reason: '' }, 'en', at(AGENT)),
    ).toMatchObject({
      outcome: AgentExitKind.End,
      reason: null,
      path: ExitPath.Connected,
      next: REPLY.label,
      recipients: null,
      message: null,
    });
  });
});

describe('autoCloseView', () => {
  it('says after how long the flow closes a quiet chat', () => {
    expect(autoCloseView(FLOW, 'en')).toEqual({
      kind: OutputViewKind.AutoClose,
      after: '1 day',
    });
    expect(autoCloseView({ ...FLOW, settings: NO_FLOW_SETTINGS }, 'en')).toEqual({
      kind: OutputViewKind.AutoClose,
      after: null,
    });
  });
});

describe('toStepView', () => {
  it('leaves out what a send message step did inside', () => {
    expect(toStepView(step, 'en', at(REPLY))).toBeNull();
    expect(toStepView(step, 'en', at(AGENT))).toMatchObject({ kind: OutputViewKind.Fields });
  });

  it('shows the error of a failed step', () => {
    expect(
      toStepView(
        { ...step, status: RunStepStatus.Failed, output: null, errorMessage: 'Timed out' },
        'en',
        at(AGENT),
      ),
    ).toEqual({ kind: OutputViewKind.Error, message: 'Timed out' });
  });
});

describe('inspectStep', () => {
  it('shows the input and the output of a step, even a quiet one', () => {
    expect(inspectStep(step, 'en', at(REPLY))).toEqual([
      {
        section: StepSection.Input,
        view: { kind: OutputViewKind.Json, code: expect.stringContaining('"text": "Hi"') },
      },
      {
        section: StepSection.Output,
        view: { kind: OutputViewKind.Fields, fields: [{ label: 'ok', value: 'true' }] },
      },
    ]);
  });

  it('shows the error of a failed step instead of its output', () => {
    const failed = { ...step, status: RunStepStatus.Failed, errorMessage: 'Timed out' };

    expect(inspectStep(failed, 'en', at(AGENT)).map(({ section }) => section)).toEqual([
      StepSection.Input,
      StepSection.Error,
    ]);
  });
});

describe('formatSeconds', () => {
  it('formats milliseconds as seconds with exactly one locale decimal', () => {
    expect(formatSeconds(2100, 'en')).toBe('2.1');
    expect(formatSeconds(2100, 'uk')).toBe('2,1');
    expect(formatSeconds(3000, 'en')).toBe('3.0');
    expect(formatSeconds(40, 'en')).toBe('0.0');
  });
});

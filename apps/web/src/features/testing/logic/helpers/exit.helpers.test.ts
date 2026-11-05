import {
  AgentExitKind,
  EscalationMode,
  FLOW_SCHEMA_VERSION,
  NO_FLOW_SETTINGS,
  NodeType,
  RetrievalMode,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { TraceExit } from '@/features/testing/constants/trace.constants';
import { traceExit } from '@/features/testing/logic/helpers/exit.helpers';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

const AGENT: FlowNode = {
  id: 'node_agent',
  key: 'receptionist',
  label: 'Receptionist',
  position: { x: 0, y: 0 },
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

const END: FlowNode = {
  id: 'node_end',
  key: 'end',
  label: 'End chat',
  position: { x: 0, y: 0 },
  type: NodeType.Escalation,
  config: { mode: EscalationMode.End, customerMessage: null },
};

const FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings: NO_FLOW_SETTINGS,
  nodes: [AGENT, END],
  edges: [{ id: 'edge_end', source: AGENT.id, sourcePort: AgentExitKind.End, target: END.id }],
};

const stepWith = (output: unknown, status = RunStepStatus.Succeeded) => ({
  id: 'step_1',
  nodeId: AGENT.id,
  status,
  input: null,
  output,
  errorMessage: null,
});

describe('traceExit', () => {
  it('marks an agent that ran its default exit', () => {
    expect(traceExit(stepWith({ outcome: 'handoff' }), AGENT, FLOW)).toBe(TraceExit.DefaultHandoff);
  });

  it('leaves an agent whose exit port is connected, or that went on, as a normal step', () => {
    expect(traceExit(stepWith({ outcome: 'end' }), AGENT, FLOW)).toBeNull();
    expect(traceExit(stepWith({ outcome: 'continue' }), AGENT, FLOW)).toBeNull();
  });

  it('marks the default end once nothing is connected', () => {
    expect(traceExit(stepWith({ outcome: 'end' }), AGENT, { ...FLOW, edges: [] })).toBe(
      TraceExit.DefaultEnd,
    );
  });

  it('marks an escalation step by its mode, and never a failed step', () => {
    expect(traceExit(stepWith({ mode: 'end' }), END, FLOW)).toBe(TraceExit.Ended);
    expect(traceExit(stepWith(null, RunStepStatus.Failed), END, FLOW)).toBeNull();
  });
});

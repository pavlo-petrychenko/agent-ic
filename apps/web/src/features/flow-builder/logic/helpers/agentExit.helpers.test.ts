import {
  AgentExitKind,
  EscalationMode,
  FlowIssueCode,
  MessageContentKind,
  NodeType,
  NotifyChannel,
  PortName,
  RecipientsKind,
  validateFlow,
} from '@agent-ic/flow';
import type { FlowDocument, HandoffSettings } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { DEFAULT_HANDOFF } from '@/features/flow-builder/constants/nodeTemplate.constants';
import {
  customizeExit,
  defaultExitPorts,
  setAgentExit,
  withAgentExits,
} from '@/features/flow-builder/logic/helpers/agentExit.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';

const LABELS = { send: 'Send note', finish: 'Hand to a person' };

const ids = () => {
  let next = 0;
  return () => {
    next += 1;
    return `id${next}`;
  };
};

const agentFlow = (): FlowDocument => {
  const document = addNode(
    addNode(EMPTY_FLOW, NodeType.TriggerMessage, { x: 0, y: 0 }, 'trigger'),
    NodeType.Agent,
    { x: 10, y: 200 },
    'agent',
  );
  return {
    ...document,
    nodes: document.nodes.map((node) =>
      withAgentExits(node, { end: { when: 'bye' }, handoff: { when: 'help' } }),
    ),
    edges: [{ id: 'e1', source: 'trigger', sourcePort: PortName.Next, target: 'agent' }],
  };
};

describe('setAgentExit', () => {
  it('turns an exit off together with the edges of its port', () => {
    const wired: FlowDocument = {
      ...agentFlow(),
      edges: [
        ...agentFlow().edges,
        { id: 'e2', source: 'agent', sourcePort: AgentExitKind.End, target: 'trigger' },
      ],
    };

    const off = setAgentExit(wired, 'agent', AgentExitKind.End, null);

    expect(off.nodes[1]).toMatchObject({
      config: { exits: { end: null, handoff: { when: 'help' } } },
    });
    expect(off.edges.map((edge) => edge.id)).toEqual(['e1']);
  });
});

describe('defaultExitPorts', () => {
  it('lists the enabled exits that have no edge', () => {
    const flow = agentFlow();

    expect(defaultExitPorts(flow, 'agent')).toEqual([AgentExitKind.End, AgentExitKind.Handoff]);
    expect(defaultExitPorts(setAgentExit(flow, 'agent', AgentExitKind.End, null), 'agent')).toEqual(
      [AgentExitKind.Handoff],
    );
    expect(defaultExitPorts(flow, 'trigger')).toEqual([]);
  });
});

describe('customizeExit', () => {
  it('inserts the agent messages and a hand-off without its own message', () => {
    const { document, nodeIds } = customizeExit(
      agentFlow(),
      'agent',
      AgentExitKind.Handoff,
      LABELS,
      ids(),
    );

    expect(nodeIds).toEqual(['id1', 'id2']);
    expect(document.nodes.slice(2)).toMatchObject([
      {
        id: 'id1',
        label: 'Send note',
        position: { x: 610, y: 440 },
        config: { content: { kind: MessageContentKind.List, variable: 'agent.messages' } },
      },
      {
        id: 'id2',
        label: 'Hand to a person',
        config: {
          mode: EscalationMode.Escalate,
          customerMessage: null,
          reason: '{{agent.outcome_reason}}',
          ...DEFAULT_HANDOFF,
        },
      },
    ]);
    expect(document.edges.slice(1)).toEqual([
      { id: 'id3', source: 'agent', sourcePort: AgentExitKind.Handoff, target: 'id1' },
      { id: 'id4', source: 'id1', sourcePort: PortName.Next, target: 'id2' },
    ]);
    expect(defaultExitPorts(document, 'agent')).toEqual([AgentExitKind.End]);
    expect(
      validateFlow(document).some((issue) => issue.code === FlowIssueCode.ExitEscalationMessage),
    ).toBe(false);
  });

  it('takes the hand-off from the flow settings and ends the chat for the end exit', () => {
    const handoff: HandoffSettings = {
      notify: { recipients: { kind: RecipientsKind.Operators }, channels: [NotifyChannel.Email] },
      reminderAfterMinutes: null,
      fallbackAfterMinutes: 15,
      fallbackMessage: 'We will be right back',
    };
    const flow = { ...agentFlow(), settings: { ...agentFlow().settings, handoff } };

    const handedOff = customizeExit(flow, 'agent', AgentExitKind.Handoff, LABELS, ids());
    const ended = customizeExit(flow, 'agent', AgentExitKind.End, LABELS, ids());

    expect(handedOff.document.nodes[3]).toMatchObject({ config: handoff });
    expect(ended.document.nodes[3]).toMatchObject({
      config: { mode: EscalationMode.End, customerMessage: null },
    });
  });

  it('moves the new steps right of a step that stands where they would go', () => {
    const flow = addNode(agentFlow(), NodeType.SendMessage, { x: 560, y: 600 }, 'busy');

    const { document } = customizeExit(flow, 'agent', AgentExitKind.Handoff, LABELS, ids());

    expect(document.nodes.slice(3).map((node) => node.position)).toEqual([
      { x: 910, y: 440 },
      { x: 910, y: 600 },
    ]);
  });

  it('leaves a connected or disabled exit alone', () => {
    const flow = agentFlow();
    const once = customizeExit(flow, 'agent', AgentExitKind.End, LABELS, ids()).document;
    const off = setAgentExit(flow, 'agent', AgentExitKind.Handoff, null);

    expect(customizeExit(once, 'agent', AgentExitKind.End, LABELS, ids())).toEqual({
      document: once,
      nodeIds: [],
    });
    expect(customizeExit(off, 'agent', AgentExitKind.Handoff, LABELS, ids()).nodeIds).toEqual([]);
  });
});

import {
  ChannelSelectionMode,
  FlowIssueCode,
  FlowIssueSeverity,
  NodeType,
  PortName,
  WaitFor,
} from '@agent-ic/flow';
import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { documentToCanvas } from '@/features/flow-builder/logic/helpers/canvas.helpers';

const ORIGIN = { x: 0, y: 0 };
const EDGE = { id: 'e1', source: 't', sourcePort: PortName.Next, target: 'p' };
const DOCUMENT: FlowDocument = {
  ...EMPTY_FLOW,
  nodes: [
    {
      id: 't',
      key: 'trigger',
      label: '',
      position: ORIGIN,
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
    {
      id: 'p',
      key: 'checks',
      label: 'Checks',
      position: ORIGIN,
      type: NodeType.Parallel,
      config: { waitFor: WaitFor.All },
    },
  ],
  edges: [EDGE],
};
const ISSUE: FlowIssue = {
  code: FlowIssueCode.TooFewBranches,
  severity: FlowIssueSeverity.Error,
  nodeId: 'p',
  edgeId: null,
  path: [],
  params: {},
};

describe('documentToCanvas', () => {
  it('maps steps to canvas nodes with their ports, labels and issues', () => {
    const canvas = documentToCanvas(DOCUMENT, [ISSUE]);

    expect(canvas.nodes).toEqual([
      expect.objectContaining({
        label: 'trigger',
        hasInPort: false,
        outPorts: [PortName.Next],
        issues: [],
      }),
      expect.objectContaining({
        label: 'Checks',
        hasInPort: true,
        outPorts: [PortName.Branches, PortName.Next],
        issues: [ISSUE],
      }),
    ]);
    expect(canvas.edges).toEqual([EDGE]);
  });
});

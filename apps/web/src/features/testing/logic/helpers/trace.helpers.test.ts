import {
  ChannelSelectionMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NodeType,
  PortName,
  QuickRepliesKind,
  WaitFor,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { TRACE_MIN_SCALE, TRACE_NODE } from '@/features/testing/constants/trace.constants';
import {
  drawTrace,
  fitTraceScale,
  focusNodeId,
  layoutTrace,
  nodeState,
  traceEdges,
} from '@/features/testing/logic/helpers/trace.helpers';
import type { RunDetails } from '@/features/testing/typedefs/trace.typedefs';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { RunNodeState } from '@/shared/ui/flow/RunNode';
import { IconName } from '@/shared/ui/foundations/Icon';

const ORIGIN = { x: 0, y: 0 };

const TRACE_TRIGGER: FlowNode = {
  id: 'trigger',
  key: 'trigger',
  label: 'Incoming message',
  position: ORIGIN,
  type: NodeType.TriggerMessage,
  config: { channels: { mode: ChannelSelectionMode.All } },
};

const TRACE_REPLY: FlowNode = {
  id: 'reply',
  key: 'reply',
  label: 'Send replies',
  position: ORIGIN,
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.Text, text: 'Hi' },
    typing: true,
    waitForDelivery: false,
    quickReplies: { kind: QuickRepliesKind.None },
  },
};

const flowOf = (nodes: FlowNode[], edges: FlowDocument['edges']): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes,
  edges,
});

const node = (id: string, base: FlowNode = TRACE_REPLY): FlowNode => ({
  ...base,
  id,
  key: id,
  label: id,
});

const edge = (source: string, target: string) => ({
  id: `${source}-${target}`,
  source,
  sourcePort: 'next',
  target,
});

const step = (nodeId: string, status: RunStepStatus) => ({
  id: nodeId,
  nodeId,
  status,
  input: {},
  output: null,
  errorMessage: null,
});

describe('layoutTrace', () => {
  it('stacks a chain in one column and puts branches side by side', () => {
    const flow = flowOf(
      [node('a', TRACE_TRIGGER), node('b'), node('c'), node('d')],
      [edge('a', 'b'), edge('b', 'c'), edge('b', 'd')],
    );

    expect(layoutTrace(flow).map(({ id, row, column }) => [id, row, column])).toEqual([
      ['a', 0, 0],
      ['b', 1, 0],
      ['c', 2, 0],
      ['d', 2, 1],
    ]);
  });

  it('starts every trigger below the previous one and keeps unconnected steps', () => {
    const flow = flowOf([node('loose'), node('t1', TRACE_TRIGGER), node('t2', TRACE_TRIGGER)], []);

    expect(layoutTrace(flow).map(({ id, row }) => [id, row])).toEqual([
      ['t1', 0],
      ['t2', 1],
      ['loose', 2],
    ]);
    expect(layoutTrace(flow)[0]?.type).toBe(NodeType.TriggerMessage);
  });
});

describe('layoutTrace with a parallel', () => {
  const parallel: FlowNode = {
    ...TRACE_REPLY,
    type: NodeType.Parallel,
    config: { waitFor: WaitFor.All },
  };
  const branch = (source: string, target: string, background = false) => ({
    ...edge(source, target),
    sourcePort: PortName.Branches,
    ...(background ? { background } : {}),
  });
  const flow = flowOf(
    [
      node('a', TRACE_TRIGGER),
      node('p', parallel),
      node('answer'),
      node('hand_off'),
      node('score'),
      node('save'),
      node('reply'),
    ],
    [
      edge('a', 'p'),
      branch('p', 'answer'),
      { ...edge('answer', 'hand_off'), sourcePort: PortName.Error },
      branch('p', 'score', true),
      edge('score', 'save'),
      edge('p', 'reply'),
    ],
  );
  const slots = layoutTrace(flow);
  const at = (id: string) => slots.find((slot) => slot.id === id);

  it('places the join target below every branch, centered under them', () => {
    const deepestBranchRow = Math.max(
      ...['answer', 'hand_off', 'score', 'save'].map((id) => at(id)?.row ?? -1),
    );

    expect(at('answer')?.row).toBe(at('score')?.row);
    expect(at('reply')?.row).toBe(deepestBranchRow + 1);
    expect(at('reply')?.column).toBe(
      ((at('answer')?.column ?? 0) + (at('score')?.column ?? 0)) / 2,
    );
  });

  it('keeps every node within the computed width of the drawing', () => {
    const cells = slots.map((slot) => ({
      ...slot,
      kind: NodeKind.Agent,
      icon: IconName.Msg,
      state: RunNodeState.Done,
      selectable: true,
      selected: false,
    }));
    const drawing = drawTrace(cells, traceEdges(flow, slots));

    expect(drawing.size.x).toBe(398);
    for (const placed of drawing.nodes) {
      expect(placed.x).toBeGreaterThanOrEqual(0);
      expect(placed.x + TRACE_NODE.width).toBeLessThanOrEqual(drawing.size.x);
    }
  });
});

describe('fitTraceScale', () => {
  it('keeps the full size when the trace fits the panel', () => {
    expect(fitTraceScale(500, 398)).toBe(1);
    expect(fitTraceScale(398, 398)).toBe(1);
    expect(fitTraceScale(300, 0)).toBe(1);
  });

  it('shrinks the trace to the panel width', () => {
    expect(fitTraceScale(300, 400)).toBe(0.75);
  });

  it('stops at the minimum scale so the panel scrolls instead', () => {
    expect(fitTraceScale(100, 400)).toBe(TRACE_MIN_SCALE);
    expect(fitTraceScale(-5, 400)).toBe(TRACE_MIN_SCALE);
  });
});

describe('traceEdges', () => {
  const flow = flowOf(
    [node('a', TRACE_TRIGGER), node('b'), node('c'), node('d')],
    [edge('a', 'b'), edge('b', 'c'), edge('b', 'd'), edge('b', 'gone')],
  );
  const edges = traceEdges(flow, layoutTrace(flow));

  it('connects every placed source to every placed target, branches included', () => {
    expect(edges.map(({ id, source, target }) => [id, source.column, target.column])).toEqual([
      ['a-b', 0, 0],
      ['b-c', 0, 0],
      ['b-d', 0, 1],
    ]);
  });

  it('marks only a background branch of a parallel node as dashed', () => {
    const parallel: FlowNode = {
      ...TRACE_REPLY,
      type: NodeType.Parallel,
      config: { waitFor: WaitFor.All },
    };
    const branches = flowOf(
      [node('a', TRACE_TRIGGER), node('p', parallel), node('b'), node('c')],
      [
        edge('a', 'p'),
        { ...edge('p', 'b'), sourcePort: PortName.Branches, background: true },
        { ...edge('p', 'c'), sourcePort: PortName.Branches },
      ],
    );

    expect(
      traceEdges(branches, layoutTrace(branches)).map(({ id, dashed }) => [id, dashed]),
    ).toEqual([
      ['a-p', false],
      ['p-b', true],
      ['p-c', false],
    ]);
  });
});

describe('drawTrace', () => {
  const flow = flowOf(
    [node('a', TRACE_TRIGGER), node('b'), node('c'), node('d')],
    [edge('a', 'b'), edge('b', 'c'), edge('b', 'd')],
  );
  const cells = layoutTrace(flow).map((slot) => ({
    ...slot,
    kind: NodeKind.Agent,
    icon: IconName.Msg,
    state: RunNodeState.Done,
    selectable: true,
    selected: false,
  }));
  const drawing = drawTrace(cells, traceEdges(flow, cells));

  it('draws a straight line down a column and a curve into another column', () => {
    expect(drawing.paths.map((path) => path.d)).toEqual([
      'M97 36 V54',
      'M97 90 V108',
      'M97 90 C97 108 301 90 301 108',
    ]);
  });

  it('places every node on its cell and sizes the trace to the farthest one', () => {
    expect(drawing.nodes.map(({ id, x, y }) => [id, x, y]).at(-1)).toEqual(['d', 204, 108]);
    expect(drawing.size).toEqual({ x: 398, y: 144 });
    expect(drawTrace([], []).size).toEqual({ x: 0, y: 0 });
  });
});

describe('nodeState', () => {
  const steps = [step('a', RunStepStatus.Succeeded), step('b', RunStepStatus.Failed)];

  it('follows the latest step of the node', () => {
    expect(nodeState(steps, 'a', false)).toBe(RunNodeState.Done);
    expect(nodeState(steps, 'b', false)).toBe(RunNodeState.Failed);
  });

  it('marks a node without a step as waiting while the run is active, else not reached', () => {
    expect(nodeState(steps, 'c', true)).toBe(RunNodeState.Waiting);
    expect(nodeState(steps, 'c', false)).toBe(RunNodeState.Skipped);
  });
});

describe('focusNodeId', () => {
  const run = (failedNodeId: string | null, status: RunStepStatus): RunDetails => ({
    id: 'run',
    status: RunStatus.Running,
    durationMs: null,
    failedNodeId,
    totals: { stepsRun: 1, stepsInFlow: 2, messagesSent: 0 },
    steps: [step('a', RunStepStatus.Succeeded), step('b', status)],
  });

  it('points at the failed node, else the running one, else nothing', () => {
    expect(focusNodeId(run('x', RunStepStatus.Succeeded))).toBe('x');
    expect(focusNodeId(run(null, RunStepStatus.Running))).toBe('b');
    expect(focusNodeId(run(null, RunStepStatus.Succeeded))).toBeNull();
    expect(focusNodeId(null)).toBeNull();
  });
});

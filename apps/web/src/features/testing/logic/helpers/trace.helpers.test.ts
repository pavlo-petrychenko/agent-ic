import {
  ChannelSelectionMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NodeType,
  QuickRepliesKind,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  drawTrace,
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

describe('traceEdges', () => {
  const flow = flowOf(
    [node('a', TRACE_TRIGGER), node('b'), node('c'), node('d')],
    [edge('a', 'b'), edge('b', 'c'), edge('b', 'd'), edge('b', 'gone')],
  );
  const edges = traceEdges(flow.edges, layoutTrace(flow));

  it('connects every placed source to every placed target, branches included', () => {
    expect(edges.map(({ id, source, target }) => [id, source.column, target.column])).toEqual([
      ['a-b', 0, 0],
      ['b-c', 0, 0],
      ['b-d', 0, 1],
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
  }));
  const drawing = drawTrace(cells, traceEdges(flow.edges, cells));

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

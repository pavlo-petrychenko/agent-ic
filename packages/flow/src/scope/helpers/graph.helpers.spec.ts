import { describe, expect, it } from 'vitest';
import { PortName } from '@flow/document/constants/flow.constants';
import { WaitFor } from '@flow/nodes/constants/step.constants';
import {
  branchNodes,
  branchStarts,
  buildFlowGraph,
  findCycleEdges,
  nodesInParallelBranches,
  outgoingEdges,
  reachableFrom,
} from '@flow/scope/helpers/graph.helpers';
import {
  agent,
  flowOf,
  link,
  messageTrigger,
  parallel,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const trigger = messageTrigger('incoming');
const fork = parallel('fork', WaitFor.All);
const left = agent('left');
const leftNext = sendText('left_next', 'x');
const right = agent('right');
const after = sendText('after', 'y');
const orphan = agent('orphan');

const flow = flowOf(
  [trigger, fork, left, leftNext, right, after, orphan],
  [
    link(trigger, PortName.Next, fork),
    link(fork, PortName.Branches, left),
    link(fork, PortName.Branches, right),
    link(left, PortName.Next, leftNext),
    link(fork, PortName.Next, after),
    { id: 'e_dangling', source: after.id, sourcePort: PortName.Next, target: 'n_missing' },
  ],
);

describe('graph helpers', () => {
  const graph = buildFlowGraph(flow);

  it('indexes edges by port and drops edges to missing nodes', () => {
    expect(outgoingEdges(graph, fork.id).map((edge) => edge.target)).toEqual([
      left.id,
      right.id,
      after.id,
    ]);
    expect(outgoingEdges(graph, fork.id, PortName.Next).map((edge) => edge.target)).toEqual([
      after.id,
    ]);
    expect(outgoingEdges(graph, after.id)).toEqual([]);
  });

  it('finds what a trigger reaches', () => {
    expect([...reachableFrom(graph, [trigger.id])].sort()).toEqual(
      [trigger.id, fork.id, left.id, leftNext.id, right.id, after.id].sort(),
    );
  });

  it('finds the nodes of each parallel branch', () => {
    const [first, second] = branchStarts(graph, fork.id);
    expect(first === undefined ? [] : [...branchNodes(graph, first)]).toEqual([
      left.id,
      leftNext.id,
    ]);
    expect(second === undefined ? [] : [...branchNodes(graph, second)]).toEqual([right.id]);
    expect([...nodesInParallelBranches(graph)].sort()).toEqual(
      [left.id, leftNext.id, right.id].sort(),
    );
  });

  it('finds the edges that close a cycle', () => {
    expect(findCycleEdges(graph)).toEqual([]);
    const looped = buildFlowGraph({
      ...flow,
      edges: [...flow.edges, link(leftNext, PortName.Next, left)],
    });
    expect(findCycleEdges(looped).map((edge) => edge.id)).toEqual(['e_left_next_next_left']);
  });
});

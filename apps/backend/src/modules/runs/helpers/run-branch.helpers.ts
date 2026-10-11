import { CompletionRole, NodeType, WaitFor, branchNodes, branchStarts } from '@agent-ic/flow';
import type { FlowGraph, FlowNode, ParallelNode } from '@agent-ic/flow';
import { BRANCH_KEY_SEPARATOR } from '@/modules/runs/constants/run.constants';
import type {
  BranchSettlement,
  ForkedBranch,
  RunBranch,
} from '@/modules/runs/typedefs/run-branch.typedefs';
import type { RunEnd } from '@/modules/runs/typedefs/run.typedefs';

const isObserver = (node: FlowNode | undefined): boolean =>
  node?.type === NodeType.Completion && node.config.role === CompletionRole.Observer;

export const branchKeyOf = (parallelId: string, startId: string): string =>
  `${parallelId}${BRANCH_KEY_SEPARATOR}${startId}`;

export const parallelBranches = (graph: FlowGraph, parallel: ParallelNode): RunBranch[] =>
  branchStarts(graph, parallel.id).flatMap((edge) => {
    const start = graph.nodes.get(edge.target);
    if (start === undefined) {
      return [];
    }
    const observer = [...branchNodes(graph, edge)].some((id) => isObserver(graph.nodes.get(id)));
    return [{ key: branchKeyOf(parallel.id, start.id), start, observer }];
  });

export const settleBranch = (end: Promise<RunEnd>): Promise<BranchSettlement> =>
  end.then(
    (value) => ({ ok: true, end: value }),
    (error: unknown) => ({ ok: false, error }),
  );

export const joinBranches = (
  waitFor: WaitFor,
  branches: readonly ForkedBranch[],
): Promise<readonly BranchSettlement[]> => {
  switch (waitFor) {
    case WaitFor.All:
      return Promise.all(branches.map((branch) => branch.settled));
    case WaitFor.Guards:
      return Promise.all(
        branches.filter((branch) => !branch.observer).map((branch) => branch.settled),
      );
    case WaitFor.First:
      return branches.length === 0
        ? Promise.resolve([])
        : Promise.race(branches.map((branch) => branch.settled)).then((first) => [first]);
  }
};

import {
  WaitFor,
  branchNodes,
  branchStarts,
  isBackgroundBranch,
  isObserverNode,
} from '@agent-ic/flow';
import type { FlowGraph, ParallelNode } from '@agent-ic/flow';
import { BRANCH_KEY_SEPARATOR } from '@/modules/runs/constants/run.constants';
import type {
  BranchSettlement,
  ForkedBranch,
  RunBranch,
} from '@/modules/runs/typedefs/run-branch.typedefs';
import type { RunEnd } from '@/modules/runs/typedefs/run.typedefs';

export const branchKeyOf = (parallelId: string, startId: string): string =>
  `${parallelId}${BRANCH_KEY_SEPARATOR}${startId}`;

export const parallelBranches = (graph: FlowGraph, parallel: ParallelNode): RunBranch[] =>
  branchStarts(graph, parallel.id).flatMap((edge) => {
    const start = graph.nodes.get(edge.target);
    if (start === undefined) {
      return [];
    }
    const observer = [...branchNodes(graph, edge)].some((id) => {
      const node = graph.nodes.get(id);
      return node !== undefined && isObserverNode(node);
    });
    const background = isBackgroundBranch(graph, edge);
    return [{ key: branchKeyOf(parallel.id, start.id), start, observer, background }];
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
  const waited = branches.filter((branch) => !branch.background);
  switch (waitFor) {
    case WaitFor.All:
      return Promise.all(waited.map((branch) => branch.settled));
    case WaitFor.Guards:
      return Promise.all(
        waited.filter((branch) => !branch.observer).map((branch) => branch.settled),
      );
    case WaitFor.First:
      return waited.length === 0
        ? Promise.resolve([])
        : Promise.race(waited.map((branch) => branch.settled)).then((first) => [first]);
  }
};

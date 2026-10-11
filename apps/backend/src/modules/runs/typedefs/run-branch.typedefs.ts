import type { FlowNode } from '@agent-ic/flow';
import type { RunEnd } from '@/modules/runs/typedefs/run.typedefs';

export interface RunBranch {
  readonly key: string;
  readonly start: FlowNode;
  readonly observer: boolean;
}

export type BranchSettlement =
  | { readonly ok: true; readonly end: RunEnd }
  | { readonly ok: false; readonly error: unknown };

export interface ForkedBranch extends RunBranch {
  readonly settled: Promise<BranchSettlement>;
}

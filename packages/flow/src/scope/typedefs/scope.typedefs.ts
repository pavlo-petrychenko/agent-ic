import type { FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import type {
  Presence,
  VariableSourceKind,
  VariableType,
} from '@flow/scope/constants/scope.constants';

export interface TriggerVariable {
  readonly path: string;
  readonly type: VariableType;
  readonly open: boolean;
}

export interface ResolvedVariable {
  readonly type: VariableType;
  readonly nullable: boolean;
  readonly values: readonly string[] | null;
}

export interface VisibleVariable extends ResolvedVariable {
  readonly path: string;
  readonly open: boolean;
  readonly source: VariableSourceKind;
  readonly nodeId: string | null;
}

export type StepPresence = ReadonlyMap<string, Presence>;

export interface FlowGraph {
  readonly nodes: ReadonlyMap<string, FlowNode>;
  readonly outgoing: ReadonlyMap<string, readonly FlowEdge[]>;
  readonly incoming: ReadonlyMap<string, readonly FlowEdge[]>;
}

export type ScopeLookup = (nodeId: string) => readonly VisibleVariable[];

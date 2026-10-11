import type { Condition, ConditionOperator, NodeType, VariableType } from '@agent-ic/flow';
import type {
  BranchRole,
  FieldHint,
  ValueInput,
} from '@/features/flow-builder/constants/inspector.constants';
import type { NodePresentation } from '@/features/flow-builder/typedefs/nodePresentation.typedefs';

export interface FieldRow {
  path: string;
  type: VariableType;
  hint: FieldHint | null;
  values: readonly string[] | null;
}

export interface PortTarget {
  nodeId: string;
  label: string;
}

export interface BranchRow extends PortTarget, NodePresentation {
  role: BranchRole;
}

export interface KeyRename {
  nodeId: string;
  from: string;
  to: string;
}

export interface ConditionPatch {
  variable?: string;
  operator?: ConditionOperator;
  text?: string;
}

export interface ConditionView {
  condition: Condition;
  operators: readonly ConditionOperator[];
  input: ValueInput;
  values: readonly string[] | null;
  text: string;
}

export type DescribedNodeType = NodeType.TriggerMessage | NodeType.Router | NodeType.Parallel;

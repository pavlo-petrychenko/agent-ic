import type { NodeType, VariableType } from '@agent-ic/flow';
import type { FieldHint } from '@/features/flow-builder/constants/inspector.constants';

export interface FieldRow {
  path: string;
  type: VariableType;
  hint: FieldHint | null;
  values: readonly string[] | null;
}

export interface KeyRename {
  nodeId: string;
  from: string;
  to: string;
}

export type DescribedNodeType = NodeType.TriggerMessage | NodeType.Router | NodeType.Parallel;

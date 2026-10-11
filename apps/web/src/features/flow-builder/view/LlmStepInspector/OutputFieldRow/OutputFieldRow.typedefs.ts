import type { FlowIssue, OutputField } from '@agent-ic/flow';
import type { OutputFieldPatch } from '@/features/flow-builder/typedefs/llmStep.typedefs';

export interface OutputFieldRowProps {
  field: OutputField;
  issue: FlowIssue | null;
  canRemove: boolean;
  onChange: (patch: OutputFieldPatch) => void;
  onRemove: () => void;
}

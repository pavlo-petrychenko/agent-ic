import type { FlowIssue } from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface TemplateFieldProps {
  label: string;
  value: string;
  variables: readonly VariableOption[];
  hint: string | null;
  issue: FlowIssue | null;
  placeholder: string | null;
  onChange: (value: string) => void;
  onCommit: () => void;
}

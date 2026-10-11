import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface TemplateFieldProps {
  label: string;
  value: string;
  variables: readonly VariableOption[];
  hint: string | null;
  error: string | null;
  placeholder: string | null;
  onChange: (value: string) => void;
  onCommit: () => void;
}

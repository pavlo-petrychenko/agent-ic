export interface VariableOption {
  id: string;
  label: string;
  group: string;
}

export interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: readonly VariableOption[];
  label: string;
  menuLabel: string;
  height?: number | null;
  invalid?: boolean;
  error?: string | null;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  disabled?: boolean;
  placeholder?: string | null;
  className?: string;
}

export interface VariableTrigger {
  from: number;
  to: number;
  query: string;
  anchor: DOMRect;
}

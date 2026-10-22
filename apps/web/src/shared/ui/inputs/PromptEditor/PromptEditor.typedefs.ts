import type { PathNormalizer } from '@/shared/prompt/typedefs/promptDocument.typedefs';

export interface VariableOption {
  id: string;
  label: string;
  group?: string;
  open?: boolean;
}

export interface PromptEditorProps {
  value: string;
  onChange?: ((value: string) => void) | null;
  variables: readonly VariableOption[];
  label: string;
  menuLabel: string;
  normalizeVariable?: PathNormalizer | null;
  height?: number | null;
  invalid?: boolean;
  error?: string | null;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  fill?: boolean;
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

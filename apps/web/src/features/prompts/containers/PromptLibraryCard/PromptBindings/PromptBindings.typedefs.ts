import type { PromptBindings } from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface PromptBindingsProps {
  readonly paths: readonly string[];
  readonly options: readonly VariableOption[];
  readonly bindings: PromptBindings;
  readonly onChange: (bindings: PromptBindings) => void;
}

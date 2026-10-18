import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface UsePromptVariablesResult {
  readonly options: readonly VariableOption[];
  readonly paths: readonly string[];
}

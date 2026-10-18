import type { PromptSource } from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface PromptFieldProps {
  readonly workspaceId: string;
  readonly source: PromptSource | null;
  readonly variables: readonly VariableOption[];
  readonly label: string;
  readonly menuLabel: string;
  readonly error: string | null;
  readonly onChange: (source: PromptSource) => void;
}

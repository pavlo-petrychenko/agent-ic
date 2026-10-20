import type { PromptSource, PromptSourceKind } from '@agent-ic/flow';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface PromptLibraryCardProps {
  readonly workspaceId: string;
  readonly source: Extract<PromptSource, { kind: PromptSourceKind.Library }>;
  readonly variables: readonly VariableOption[];
  readonly error: string | null;
  readonly onChange: (source: PromptSource) => void;
}

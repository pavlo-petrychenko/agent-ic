import type { PromptSource } from '@agent-ic/flow';

export interface PromptFieldProps {
  readonly workspaceId: string;
  readonly source: PromptSource | null;
  readonly error: string | null;
  readonly onChange: (source: PromptSource) => void;
}

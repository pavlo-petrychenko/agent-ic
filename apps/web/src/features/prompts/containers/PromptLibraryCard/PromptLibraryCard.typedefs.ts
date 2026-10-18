import type { PromptSource, PromptSourceKind } from '@agent-ic/flow';

export interface PromptLibraryCardProps {
  readonly workspaceId: string;
  readonly source: Extract<PromptSource, { kind: PromptSourceKind.Library }>;
  readonly error: string | null;
  readonly onChange: (source: PromptSource) => void;
}

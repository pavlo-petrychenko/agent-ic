import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface PromptDraftEditorProps {
  readonly draftNumber: number;
  readonly baseVersionNumber: number | null;
  readonly savedAtLabel: string;
  readonly text: string;
  readonly variables: readonly VariableOption[];
  readonly onChange: (text: string) => void;
}

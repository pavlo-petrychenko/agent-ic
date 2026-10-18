import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';

export interface DeletePromptDialogProps {
  readonly workspaceId: string;
  readonly prompt: PromptListItem;
  readonly onClose: () => void;
}

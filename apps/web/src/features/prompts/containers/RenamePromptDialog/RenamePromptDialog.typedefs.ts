import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';

export interface RenamePromptDialogProps {
  readonly prompt: PromptListItem;
  readonly onClose: () => void;
}

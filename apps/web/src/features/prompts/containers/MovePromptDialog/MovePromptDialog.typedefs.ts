import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface MovePromptDialogProps {
  readonly prompt: PromptListItem;
  readonly folders: readonly PromptFolderListItem[];
  readonly onClose: () => void;
}

import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface NewPromptDialogProps {
  readonly folders: readonly PromptFolderListItem[];
  readonly onClose: () => void;
}

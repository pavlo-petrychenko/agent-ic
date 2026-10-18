import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface DeletePromptFolderDialogProps {
  readonly folder: PromptFolderListItem;
  readonly promptCount: number;
  readonly onClose: () => void;
}

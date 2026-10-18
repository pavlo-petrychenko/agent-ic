import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface RenamePromptFolderDialogProps {
  readonly folder: PromptFolderListItem;
  readonly onClose: () => void;
}

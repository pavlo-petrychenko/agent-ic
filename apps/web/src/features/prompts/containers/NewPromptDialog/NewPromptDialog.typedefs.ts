import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface NewPromptDialogProps {
  readonly workspaceId: string;
  readonly folders: readonly PromptFolderListItem[];
  readonly onClose: () => void;
}

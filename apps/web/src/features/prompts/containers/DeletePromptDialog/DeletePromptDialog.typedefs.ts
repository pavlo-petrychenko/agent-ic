import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface DeletePromptDialogProps {
  readonly workspaceId: string;
  readonly prompt: PromptListItem;
  readonly usages: readonly PromptUsageItem[];
  readonly onClose: () => void;
}

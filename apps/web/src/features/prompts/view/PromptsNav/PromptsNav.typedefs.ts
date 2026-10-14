import type { PromptTreeGroup } from '@/features/prompts/typedefs/promptsTree.typedefs';

export interface PromptsNavProps {
  readonly groups: readonly PromptTreeGroup[];
  readonly loading: boolean;
  readonly onOpenChange: (folderId: string, open: boolean) => void;
}

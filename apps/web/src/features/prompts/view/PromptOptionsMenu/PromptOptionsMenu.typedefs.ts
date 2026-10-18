import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';

export interface PromptOptionsMenuProps {
  readonly actions: readonly PromptMenuAction[];
  readonly currentFolderName: string | null;
  readonly onSelect: (action: PromptMenuAction) => void;
}

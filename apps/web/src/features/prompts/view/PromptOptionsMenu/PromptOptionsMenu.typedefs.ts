import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';

export interface PromptOptionsMenuProps {
  readonly actions: readonly PromptMenuAction[];
  readonly onSelect: (action: PromptMenuAction) => void;
}

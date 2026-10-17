import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';

export interface PromptPageProps {
  readonly workspaceId: string;
  readonly promptId: string;
}

export interface UsePromptOptionsResult {
  readonly onSelect: (action: PromptMenuAction) => void;
  readonly renaming: boolean;
  readonly deleting: boolean;
  readonly closeRename: () => void;
  readonly closeDelete: () => void;
}

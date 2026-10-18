import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';

export interface PromptPageHeaderProps {
  readonly name: string;
  readonly subtitle: string | null;
  readonly editing: boolean;
  readonly draftNumber: number;
  readonly canEdit: boolean;
  readonly menuActions: readonly PromptMenuAction[];
  readonly currentFolderName: string | null;
  readonly onSelect: (action: PromptMenuAction) => void;
  readonly onEdit: () => void;
  readonly onDiscard: () => void;
  readonly onSave: () => void;
}

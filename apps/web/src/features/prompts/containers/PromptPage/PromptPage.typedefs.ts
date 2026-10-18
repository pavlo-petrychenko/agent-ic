import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import type { PromptDraft } from '@/features/prompts/typedefs/promptDraft.typedefs';

export interface PromptPageProps {
  readonly workspaceId: string;
  readonly promptId: string;
}

export interface UsePromptOptionsResult {
  readonly onSelect: (action: PromptMenuAction) => void;
  readonly renaming: boolean;
  readonly moving: boolean;
  readonly deleting: boolean;
  readonly closeRename: () => void;
  readonly closeMove: () => void;
  readonly closeDelete: () => void;
}

export interface UsePromptDraftSessionResult {
  readonly editing: boolean;
  readonly draft: PromptDraft | null;
  readonly draftNumber: number;
  readonly editorText: string;
  readonly saving: boolean;
  readonly discarding: boolean;
  readonly startEditing: () => void;
  readonly changeText: (text: string) => void;
  readonly openSaveDialog: () => void;
  readonly closeSaveDialog: () => void;
  readonly finishSaving: () => void;
  readonly openDiscardDialog: () => void;
  readonly closeDiscardDialog: () => void;
  readonly finishDiscarding: () => void;
}

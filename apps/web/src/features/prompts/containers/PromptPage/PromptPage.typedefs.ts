import type { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import type { PromptVersion } from '@/features/prompts/typedefs/prompt.typedefs';
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

export interface UsePromptDraftResult {
  readonly draft: PromptDraft | null;
  readonly beginDraft: (version: PromptVersion | null) => void;
  readonly updateDraft: (text: string) => void;
  readonly discardDraft: () => void;
}

export interface UsePromptDraftSessionResult {
  readonly editing: boolean;
  readonly draft: PromptDraft | null;
  readonly draftNumber: number;
  readonly editorText: string;
  readonly saving: boolean;
  readonly discarding: boolean;
  readonly startEditing: (version?: PromptVersion | null) => void;
  readonly changeText: (text: string) => void;
  readonly openSaveDialog: () => void;
  readonly closeSaveDialog: () => void;
  readonly finishSaving: () => void;
  readonly openDiscardDialog: () => void;
  readonly closeDiscardDialog: () => void;
  readonly finishDiscarding: () => void;
}

export interface UsePromptVersionViewResult {
  readonly olderVersionId: string | null;
  readonly olderVersion: PromptVersion | null;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
  readonly select: (versionId: string) => void;
  readonly clearSelection: () => void;
}

export interface PromptComparePair {
  readonly fromId: string;
  readonly toId: string;
}

export interface UsePromptCompareResult {
  readonly pair: PromptComparePair | null;
  readonly begin: (fromId: string, toId: string) => void;
  readonly close: () => void;
  readonly selectFrom: (versionId: string) => void;
  readonly selectTo: (versionId: string) => void;
  readonly from: PromptVersion | null;
  readonly to: PromptVersion | null;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

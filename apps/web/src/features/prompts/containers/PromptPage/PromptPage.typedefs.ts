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

export interface UsePromptVersionViewResult {
  readonly olderVersionId: string | null;
  readonly olderVersion: PromptVersion | null;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
  readonly select: (versionId: string) => void;
  readonly clearSelection: () => void;
}

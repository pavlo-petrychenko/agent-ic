import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface PromptListItem {
  readonly id: string;
  readonly name: string;
  readonly folderId: string;
}

export interface PromptLibrary {
  readonly folders: readonly PromptFolderListItem[];
  readonly prompts: readonly PromptListItem[];
}

export interface UsePromptLibraryResult {
  readonly folders: readonly PromptFolderListItem[];
  readonly prompts: readonly PromptListItem[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

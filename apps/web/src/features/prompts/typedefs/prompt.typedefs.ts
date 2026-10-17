import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface PromptListItem {
  readonly id: string;
  readonly name: string;
  readonly folderId: string;
  readonly latestVersionNumber: number | null;
  readonly updatedAt: string;
}

export interface PromptLibrary {
  readonly folders: readonly PromptFolderListItem[];
  readonly prompts: readonly PromptListItem[];
}

export interface PromptVersion {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly savedAt: string;
  readonly author: string | null;
}

export interface PromptDetail {
  readonly prompt: PromptListItem;
  readonly latestVersion: PromptVersion | null;
}

export interface PromptVersionListItem {
  readonly id: string;
  readonly number: number;
  readonly note: string | null;
  readonly savedAt: string;
}

export interface UsePromptLibraryResult {
  readonly folders: readonly PromptFolderListItem[];
  readonly prompts: readonly PromptListItem[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UsePromptDetailResult {
  readonly detail: PromptDetail | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UsePromptVersionsResult {
  readonly versions: readonly PromptVersionListItem[] | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UsePromptVersionResult {
  readonly version: PromptVersion | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface CreatePromptValues {
  readonly name: string;
  readonly folderId: string;
}

export interface SavePromptVersionValues {
  readonly id: string;
  readonly text: string;
  readonly note: string | null;
}

export interface UseSavePromptVersionResult {
  readonly savePromptVersion: (values: SavePromptVersionValues) => Promise<number | null>;
  readonly saving: boolean;
}

export interface PromptFormValues {
  readonly name: string;
  readonly folder: string;
}

export interface UseCreatePromptResult {
  readonly createPrompt: (values: CreatePromptValues) => Promise<string | null>;
  readonly creating: boolean;
}

export interface UseCreatePromptFolderResult {
  readonly createPromptFolder: (name: string) => Promise<string | null>;
  readonly creating: boolean;
}

export interface RenamePromptFolderValues {
  readonly id: string;
  readonly name: string;
}

export interface UseRenamePromptFolderResult {
  readonly renamePromptFolder: (values: RenamePromptFolderValues) => Promise<string | null>;
  readonly renaming: boolean;
}

export interface UseDeletePromptFolderResult {
  readonly deletePromptFolder: (id: string) => Promise<void>;
  readonly deleting: boolean;
}

export interface RenamePromptValues {
  readonly id: string;
  readonly name: string;
}

export interface UseRenamePromptResult {
  readonly renamePrompt: (values: RenamePromptValues) => Promise<string | null>;
  readonly renaming: boolean;
}

export interface UseDeletePromptResult {
  readonly deletePrompt: (id: string) => Promise<void>;
  readonly deleting: boolean;
}

export interface MovePromptToFolderValues {
  readonly id: string;
  readonly folderId: string;
}

export interface UseMovePromptToFolderResult {
  readonly movePromptToFolder: (values: MovePromptToFolderValues) => Promise<string | null>;
  readonly moving: boolean;
}

export interface DuplicatePromptValues {
  readonly id: string;
  readonly folderId: string;
}

export interface DuplicatePromptResult {
  readonly id: string;
  readonly name: string;
}

export interface UseDuplicatePromptResult {
  readonly duplicatePrompt: (
    values: DuplicatePromptValues,
  ) => Promise<DuplicatePromptResult | null>;
  readonly duplicating: boolean;
}

export interface UsePromptFormErrorsResult {
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly formError: string | null;
  readonly reportName: (error: unknown) => void;
  readonly reportFolder: (error: unknown) => void;
  readonly reportMessage: (message: string) => void;
  readonly clearField: (field: string) => void;
}

export interface UsePromptCreateResult {
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly formError: string | null;
  readonly submit: (values: PromptFormValues) => Promise<string | null>;
  readonly clearField: (field: string) => void;
}

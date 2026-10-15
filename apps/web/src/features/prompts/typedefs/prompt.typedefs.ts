import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export interface PromptListItem {
  readonly id: string;
  readonly name: string;
}

export interface PromptFolderWithPrompts extends PromptFolderListItem {
  readonly prompts: readonly PromptListItem[];
}

export interface PromptLibrary {
  readonly folders: readonly PromptFolderWithPrompts[];
}

export interface UsePromptLibraryResult {
  readonly folders: readonly PromptFolderWithPrompts[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface CreatePromptValues {
  readonly name: string;
  readonly folderId: string;
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
  readonly submit: (values: PromptFormValues) => Promise<boolean>;
  readonly clearField: (field: string) => void;
}

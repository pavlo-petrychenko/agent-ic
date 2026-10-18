export interface PromptDraft {
  readonly text: string;
  readonly baseVersionNumber: number | null;
}

export interface PromptDraftsStore {
  readonly drafts: Readonly<Record<string, PromptDraft>>;
  readonly load: () => void;
  readonly begin: (promptId: string, draft: PromptDraft) => void;
  readonly update: (promptId: string, text: string) => void;
  readonly discard: (promptId: string) => void;
}

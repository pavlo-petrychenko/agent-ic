export interface PromptDraft {
  readonly text: string;
  readonly baseVersionNumber: number | null;
}

export interface PromptDraftSeed {
  readonly text: string;
  readonly baseVersionNumber: number | null;
}

export interface PromptDraftsStore {
  readonly drafts: Readonly<Record<string, PromptDraft>>;
  readonly load: () => void;
  readonly begin: (promptId: string, seed: PromptDraftSeed) => void;
  readonly update: (promptId: string, text: string) => void;
  readonly discard: (promptId: string) => void;
}

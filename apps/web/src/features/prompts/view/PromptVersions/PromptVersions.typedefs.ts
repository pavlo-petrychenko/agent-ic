export interface PromptVersionRow {
  readonly id: string;
  readonly number: number;
  readonly note: string | null;
  readonly date: string;
}

export interface PromptVersionsProps {
  readonly versions: readonly PromptVersionRow[];
  readonly activeId: string | null;
}

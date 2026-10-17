export interface ResolvedPrompt {
  readonly promptRef: string;
  readonly versionNumber: number;
  readonly text: string;
}

export type ResolvedPrompts = ReadonlyMap<string, ResolvedPrompt>;

export interface UseResumeAgentResult {
  readonly resumeAgent: (id: string) => Promise<void>;
  readonly resuming: boolean;
}

export interface UseDuplicateAgentResult {
  readonly duplicateAgent: (id: string) => Promise<string | null>;
  readonly duplicating: boolean;
}

import type { PauseMode } from '@/shared/api/generated/schema.generated';

export interface UsePauseAgentResult {
  readonly pauseAgent: (id: string, mode: PauseMode, awayMessage: string | null) => Promise<void>;
  readonly pausing: boolean;
}

export interface UseResumeAgentResult {
  readonly resumeAgent: (id: string) => Promise<void>;
  readonly resuming: boolean;
}

export interface UseDeleteAgentResult {
  readonly deleteAgent: (id: string) => Promise<void>;
  readonly deleting: boolean;
}

export interface UseDuplicateAgentResult {
  readonly duplicateAgent: (id: string) => Promise<string | null>;
  readonly duplicating: boolean;
}

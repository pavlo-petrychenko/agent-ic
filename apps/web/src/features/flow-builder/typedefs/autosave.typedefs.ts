import type { FlowIssue } from '@agent-ic/flow';

export interface SavedDraft {
  revision: number;
  issues: readonly FlowIssue[];
}

export interface DraftConflict {
  savedBy: string | null;
  savedAt: string | null;
}

export interface DraftAutosave {
  conflict: DraftConflict | null;
  retry: () => void;
}

import type { FlowDocument } from '@agent-ic/flow';

export interface TestingAgent {
  id: string;
  name: string;
  draftNumber: number;
}

export interface TestingVersion {
  id: string;
  number: number;
  live: boolean;
  flow: FlowDocument | null;
}

export interface TestingAgentsResult {
  agents: readonly TestingAgent[] | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface TestingVersionsResult {
  versions: readonly TestingVersion[];
  draftIssues: readonly unknown[];
  draftBroken: boolean;
  draftChangeCount: number | null;
  draftFlow: FlowDocument | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

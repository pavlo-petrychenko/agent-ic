export interface TestingAgent {
  id: string;
  name: string;
  draftNumber: number;
}

export interface TestingVersion {
  id: string;
  number: number;
  live: boolean;
}

export interface TestingAgentsResult {
  agents: readonly TestingAgent[] | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface TestingVersionsResult {
  versions: readonly TestingVersion[];
  draftBroken: boolean;
  loading: boolean;
}

import type { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';

export interface GoogleConnection {
  readonly id: string;
  readonly accountEmail: string;
  readonly status: KnowledgeConnectionStatus;
}

export interface GoogleConnectionReturn {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
}

export interface GoogleCallbackInput {
  readonly code: string | null;
  readonly state: string | null;
  readonly error: string | null;
}

export interface UseKnowledgeConnectionsResult {
  readonly connections: readonly GoogleConnection[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseStartGoogleConnectionResult {
  readonly startGoogleConnection: () => Promise<string>;
  readonly starting: boolean;
}

export interface UseCompleteGoogleConnectionResult {
  readonly completeGoogleConnection: (input: {
    readonly code: string;
    readonly state: string;
  }) => Promise<void>;
}

export interface UseDisconnectGoogleConnectionResult {
  readonly disconnectGoogleConnection: (id: string) => Promise<void>;
  readonly disconnectingId: string | null;
}

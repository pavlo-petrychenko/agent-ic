import type { ApiRequestNode } from '@agent-ic/flow';
import type { ApiRequestTestOutcome } from '@/shared/api/generated/schema.generated';

export type ApiRequestConfig = ApiRequestNode['config'];

export type RequestHeader = ApiRequestConfig['headers'][number];

export interface ApiTestResult {
  readonly outcome: ApiRequestTestOutcome;
  readonly status: number | null;
  readonly body: string | null;
  readonly bodyTruncated: boolean;
  readonly durationMs: number;
}

export interface ApiTestState {
  readonly result: ApiTestResult | null;
  readonly running: boolean;
  readonly failed: boolean;
}

export interface UseTestApiRequestResult {
  readonly stateOf: (node: ApiRequestNode) => ApiTestState;
  readonly run: (node: ApiRequestNode) => void;
}

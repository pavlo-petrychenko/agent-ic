import type { OutboundHttpResult } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export interface TestApiRequestInput {
  readonly agentId: string;
  readonly nodeId: string;
  readonly variables?: unknown;
}

export type ApiRequestTestResult = OutboundHttpResult;

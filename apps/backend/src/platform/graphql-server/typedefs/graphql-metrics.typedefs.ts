import type { GraphqlOutcome } from '@/platform/graphql-server/constants/graphql-metrics.constants';

export interface GraphqlOperationSample {
  readonly type: string;
  readonly rootField: string;
  readonly outcome: GraphqlOutcome;
  readonly startedAt: number;
}

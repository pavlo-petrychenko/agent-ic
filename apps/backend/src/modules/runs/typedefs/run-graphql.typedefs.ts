import type {
  Run,
  ScheduleConditionCheck,
} from '@/platform/graphql-server/generated/schema.generated';
import type { GraphqlParent } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export type RunParent = GraphqlParent<Run, 'steps' | 'totals'>;

export interface SimulatorScheduleRunParent {
  readonly run: RunParent;
  readonly conditions: readonly ScheduleConditionCheck[];
}

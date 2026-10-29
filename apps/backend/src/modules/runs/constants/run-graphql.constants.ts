import { ScheduleConditionKind } from '@/modules/runs/constants/schedule-tick.constants';
import { ScheduleConditionKind as GraphqlScheduleConditionKind } from '@/platform/graphql-server/generated/schema.generated';

export enum RunGraphqlField {
  RunSteps = 'runSteps',
}

export enum RunGraphqlArgument {
  RunId = 'runId',
  Id = 'id',
  Input = 'input',
}

export enum RunGraphqlParent {
  Agent = 'Agent',
  Run = 'Run',
  Simulation = 'Simulation',
}

export const GRAPHQL_SCHEDULE_CONDITION_KIND: Readonly<
  Record<ScheduleConditionKind, GraphqlScheduleConditionKind>
> = {
  [ScheduleConditionKind.CustomerWrote]: GraphqlScheduleConditionKind.CustomerWrote,
  [ScheduleConditionKind.SilentFor]: GraphqlScheduleConditionKind.SilentFor,
  [ScheduleConditionKind.NotEscalated]: GraphqlScheduleConditionKind.NotEscalated,
  [ScheduleConditionKind.ChannelType]: GraphqlScheduleConditionKind.ChannelType,
};

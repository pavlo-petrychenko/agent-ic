import { GRAPHQL_SCHEDULE_CONDITION_KIND } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRun } from '@/modules/runs/helpers/run-graphql.helpers';
import type { SimulatorScheduleRunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import type { SimulatorScheduleRun } from '@/modules/runs/typedefs/simulator-schedule.typedefs';

export const toGraphqlSimulatorScheduleRun = ({
  run,
  conditions,
}: SimulatorScheduleRun): SimulatorScheduleRunParent => ({
  run: toGraphqlRun(run),
  conditions: conditions.map(({ kind, met }) => ({
    kind: GRAPHQL_SCHEDULE_CONDITION_KIND[kind],
    met,
  })),
});

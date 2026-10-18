import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RunGraphqlParent } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlSimulationRunSummary } from '@/modules/runs/helpers/run-graphql.helpers';
import { ListLastSimulationRunsUseCase } from '@/modules/runs/use-cases/list-last-simulation-runs.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type {
  Agent,
  SimulationRunSummary,
} from '@/platform/graphql-server/generated/schema.generated';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Resolver(RunGraphqlParent.Agent)
export class LastSimulationRunResolver {
  @ResolveField()
  async lastSimulationRun(
    @Parent() agent: Pick<Agent, 'id'>,
    @Loader(ListLastSimulationRunsUseCase) lastRuns: LoaderOf<ListLastSimulationRunsUseCase>,
  ): Promise<SimulationRunSummary | null> {
    const summary = await lastRuns.load(agent.id);
    return summary === null ? null : toGraphqlSimulationRunSummary(summary);
  }
}

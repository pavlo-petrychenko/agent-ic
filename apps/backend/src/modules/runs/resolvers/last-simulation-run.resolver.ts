import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RunGraphqlParent } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlSimulationRunSummary } from '@/modules/runs/helpers/run-graphql.helpers';
import { GetLastSimulationRunUseCase } from '@/modules/runs/use-cases/get-last-simulation-run.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  SimulationRunSummary,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver(RunGraphqlParent.Agent)
export class LastSimulationRunResolver {
  constructor(private readonly getLastSimulationRunUseCase: GetLastSimulationRunUseCase) {}

  @ResolveField()
  async lastSimulationRun(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Parent() agent: Agent,
  ): Promise<SimulationRunSummary | null> {
    const summary = await this.getLastSimulationRunUseCase.execute(ctx, { agentId: agent.id });
    return summary === null ? null : toGraphqlSimulationRunSummary(summary);
  }
}

import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RunGraphqlParent } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRun } from '@/modules/runs/helpers/run-graphql.helpers';
import type { RunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import { ListSimulationRunsUseCase } from '@/modules/runs/use-cases/list-simulation-runs.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Simulation } from '@/platform/graphql-server/generated/schema.generated';

@Resolver(RunGraphqlParent.Simulation)
export class SimulationRunsResolver {
  constructor(private readonly listSimulationRunsUseCase: ListSimulationRunsUseCase) {}

  @ResolveField()
  async runs(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Parent() simulation: Simulation,
  ): Promise<RunParent[]> {
    const runs = await this.listSimulationRunsUseCase.execute(ctx, {
      conversationId: simulation.conversation.id,
    });
    return runs.map(toGraphqlRun);
  }
}

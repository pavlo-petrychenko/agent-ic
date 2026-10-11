import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import { toGraphqlSimulation } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Simulation,
  StartSimulationInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SimulationResolver {
  constructor(private readonly startSimulationUseCase: StartSimulationUseCase) {}

  @Mutation()
  async startSimulation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: StartSimulationInput,
  ): Promise<Simulation> {
    return toGraphqlSimulation(await this.startSimulationUseCase.execute(ctx, input));
  }
}

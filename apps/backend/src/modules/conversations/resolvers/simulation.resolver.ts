import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ConversationGraphqlArgument } from '@/modules/conversations/constants/conversation-graphql.constants';
import {
  toGraphqlMessage,
  toGraphqlSimulation,
} from '@/modules/conversations/helpers/simulation-graphql.helpers';
import { GetSimulationUseCase } from '@/modules/conversations/use-cases/get-simulation.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Message,
  RestartSimulationInput,
  SendSimulatorMessageInput,
  Simulation,
  StartSimulationInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SimulationResolver {
  constructor(
    private readonly getSimulationUseCase: GetSimulationUseCase,
    private readonly startSimulationUseCase: StartSimulationUseCase,
    private readonly restartSimulationUseCase: RestartSimulationUseCase,
    private readonly sendSimulatorMessageUseCase: SendSimulatorMessageUseCase,
  ) {}

  @Query()
  async simulation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.AgentId) agentId: string,
  ): Promise<Simulation | null> {
    const simulation = await this.getSimulationUseCase.execute(ctx, { agentId });
    return simulation === null ? null : toGraphqlSimulation(simulation);
  }

  @Mutation()
  async startSimulation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: StartSimulationInput,
  ): Promise<Simulation> {
    return toGraphqlSimulation(await this.startSimulationUseCase.execute(ctx, input));
  }

  @Mutation()
  async restartSimulation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: RestartSimulationInput,
  ): Promise<Simulation> {
    return toGraphqlSimulation(await this.restartSimulationUseCase.execute(ctx, input));
  }

  @Mutation()
  async sendSimulatorMessage(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ConversationGraphqlArgument.Input) input: SendSimulatorMessageInput,
  ): Promise<Message> {
    return toGraphqlMessage(await this.sendSimulatorMessageUseCase.execute(ctx, input));
  }
}

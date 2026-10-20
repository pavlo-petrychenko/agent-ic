import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent, toPauseAgentInput } from '@/modules/agents/helpers/agent-graphql.helpers';
import type { AgentParent } from '@/modules/agents/typedefs/agent-graphql.typedefs';
import { PauseAgentUseCase } from '@/modules/agents/use-cases/pause-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { PauseAgentInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class PauseAgentResolver {
  constructor(private readonly pauseAgentUseCase: PauseAgentUseCase) {}

  @Mutation()
  async pauseAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: PauseAgentInput,
  ): Promise<AgentParent> {
    return toGraphqlAgent(await this.pauseAgentUseCase.execute(ctx, toPauseAgentInput(input)));
  }
}

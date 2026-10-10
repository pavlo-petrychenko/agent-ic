import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Agent, CreateAgentInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateAgentResolver {
  constructor(private readonly createAgentUseCase: CreateAgentUseCase) {}

  @Mutation()
  async createAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: CreateAgentInput,
  ): Promise<Agent> {
    return toGraphqlAgent(await this.createAgentUseCase.execute(ctx, input));
  }
}

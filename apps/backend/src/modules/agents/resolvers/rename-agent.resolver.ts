import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { RenameAgentUseCase } from '@/modules/agents/use-cases/rename-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Agent, RenameAgentInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenameAgentResolver {
  constructor(private readonly renameAgentUseCase: RenameAgentUseCase) {}

  @Mutation()
  async renameAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: RenameAgentInput,
  ): Promise<Agent> {
    return toGraphqlAgent(await this.renameAgentUseCase.execute(ctx, input));
  }
}

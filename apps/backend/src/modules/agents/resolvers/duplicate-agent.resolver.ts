import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { DuplicateAgentUseCase } from '@/modules/agents/use-cases/duplicate-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  DuplicateAgentInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DuplicateAgentResolver {
  constructor(private readonly duplicateAgentUseCase: DuplicateAgentUseCase) {}

  @Mutation()
  async duplicateAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: DuplicateAgentInput,
  ): Promise<Agent> {
    return toGraphqlAgent(await this.duplicateAgentUseCase.execute(ctx, input));
  }
}

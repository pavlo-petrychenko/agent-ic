import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { DescribeAgentUseCase } from '@/modules/agents/use-cases/describe-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  DescribeAgentInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DescribeAgentResolver {
  constructor(private readonly describeAgentUseCase: DescribeAgentUseCase) {}

  @Mutation()
  async describeAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: DescribeAgentInput,
  ): Promise<Agent> {
    return toGraphqlAgent(await this.describeAgentUseCase.execute(ctx, input));
  }
}

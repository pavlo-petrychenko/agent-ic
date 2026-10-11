import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlPublishedAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { PublishAgentUseCase } from '@/modules/agents/use-cases/publish-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  PublishAgentInput,
  PublishAgentPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class PublishAgentResolver {
  constructor(private readonly publishAgentUseCase: PublishAgentUseCase) {}

  @Mutation()
  async publishAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: PublishAgentInput,
  ): Promise<PublishAgentPayload> {
    return toGraphqlPublishedAgent(await this.publishAgentUseCase.execute(ctx, input));
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlRolledBackAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import type { RollbackAgentPayloadParent } from '@/modules/agents/typedefs/agent-graphql.typedefs';
import { RollbackAgentUseCase } from '@/modules/agents/use-cases/rollback-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { RollbackAgentInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RollbackAgentResolver {
  constructor(private readonly rollbackAgentUseCase: RollbackAgentUseCase) {}

  @Mutation()
  async rollbackAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: RollbackAgentInput,
  ): Promise<RollbackAgentPayloadParent> {
    return toGraphqlRolledBackAgent(await this.rollbackAgentUseCase.execute(ctx, input));
  }
}

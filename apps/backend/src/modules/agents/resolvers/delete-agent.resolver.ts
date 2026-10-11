import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { DeleteAgentUseCase } from '@/modules/agents/use-cases/delete-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DeleteAgentInput,
  DeleteAgentPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeleteAgentResolver {
  constructor(private readonly deleteAgentUseCase: DeleteAgentUseCase) {}

  @Mutation()
  deleteAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: DeleteAgentInput,
  ): Promise<DeleteAgentPayload> {
    return this.deleteAgentUseCase.execute(ctx, input);
  }
}

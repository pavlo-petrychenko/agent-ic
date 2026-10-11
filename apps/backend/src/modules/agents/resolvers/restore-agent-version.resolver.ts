import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgentDraft } from '@/modules/agents/helpers/agent-graphql.helpers';
import { RestoreAgentVersionUseCase } from '@/modules/agents/use-cases/restore-agent-version.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  AgentDraft,
  RestoreAgentVersionInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RestoreAgentVersionResolver {
  constructor(private readonly restoreAgentVersionUseCase: RestoreAgentVersionUseCase) {}

  @Mutation()
  async restoreAgentVersion(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: RestoreAgentVersionInput,
  ): Promise<AgentDraft> {
    return toGraphqlAgentDraft(await this.restoreAgentVersionUseCase.execute(ctx, input));
  }
}

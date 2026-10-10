import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgentDraft } from '@/modules/agents/helpers/agent-graphql.helpers';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  AgentDraft,
  SaveAgentDraftInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SaveAgentDraftResolver {
  constructor(private readonly saveAgentDraftUseCase: SaveAgentDraftUseCase) {}

  @Mutation()
  async saveAgentDraft(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: SaveAgentDraftInput,
  ): Promise<AgentDraft> {
    return toGraphqlAgentDraft(await this.saveAgentDraftUseCase.execute(ctx, input));
  }
}

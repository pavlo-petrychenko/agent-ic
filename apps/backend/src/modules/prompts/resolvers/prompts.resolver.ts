import { Args, Query, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPrompts } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { ListPromptsUseCase } from '@/modules/prompts/use-cases/list-prompts.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Prompt,
  QueryPromptsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class PromptsResolver {
  constructor(private readonly listPromptsUseCase: ListPromptsUseCase) {}

  @Query()
  async prompts(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.FolderId) folderId: QueryPromptsArgs['folderId'],
    @Args(PromptGraphqlArgument.Search) search: QueryPromptsArgs['search'],
  ): Promise<Prompt[]> {
    return toGraphqlPrompts(await this.listPromptsUseCase.execute(ctx, { folderId, search }));
  }
}

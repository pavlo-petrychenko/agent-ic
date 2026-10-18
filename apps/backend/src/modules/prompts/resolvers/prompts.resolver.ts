import { Args, Query, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import {
  toGraphqlPromptDetail,
  toGraphqlPrompts,
  toGraphqlPromptUsage,
  toGraphqlPromptVersion,
} from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { GetPromptVersionUseCase } from '@/modules/prompts/use-cases/get-prompt-version.use-case';
import { GetPromptUseCase } from '@/modules/prompts/use-cases/get-prompt.use-case';
import { ListPromptUsagesUseCase } from '@/modules/prompts/use-cases/list-prompt-usages.use-case';
import { ListPromptVersionsUseCase } from '@/modules/prompts/use-cases/list-prompt-versions.use-case';
import { ListPromptsUseCase } from '@/modules/prompts/use-cases/list-prompts.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Prompt,
  PromptDetail,
  PromptUsage,
  PromptVersion,
  QueryPromptArgs,
  QueryPromptsArgs,
  QueryPromptUsagesArgs,
  QueryPromptVersionArgs,
  QueryPromptVersionsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class PromptsResolver {
  constructor(
    private readonly listPromptsUseCase: ListPromptsUseCase,
    private readonly getPromptUseCase: GetPromptUseCase,
    private readonly getPromptVersionUseCase: GetPromptVersionUseCase,
    private readonly listPromptVersionsUseCase: ListPromptVersionsUseCase,
    private readonly listPromptUsagesUseCase: ListPromptUsagesUseCase,
  ) {}

  @Query()
  async prompts(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.FolderId) folderId: QueryPromptsArgs['folderId'],
    @Args(PromptGraphqlArgument.Search) search: QueryPromptsArgs['search'],
  ): Promise<Prompt[]> {
    return toGraphqlPrompts(await this.listPromptsUseCase.execute(ctx, { folderId, search }));
  }

  @Query()
  async prompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Id) id: QueryPromptArgs['id'],
  ): Promise<PromptDetail> {
    return toGraphqlPromptDetail(await this.getPromptUseCase.execute(ctx, { id }));
  }

  @Query()
  async promptVersion(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Id) id: QueryPromptVersionArgs['id'],
  ): Promise<PromptVersion> {
    return toGraphqlPromptVersion(await this.getPromptVersionUseCase.execute(ctx, { id }));
  }

  @Query()
  async promptVersions(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.PromptId) promptId: QueryPromptVersionsArgs['promptId'],
  ): Promise<PromptVersion[]> {
    const versions = await this.listPromptVersionsUseCase.execute(ctx, { promptId });
    return versions.map(toGraphqlPromptVersion);
  }

  @Query()
  async promptUsages(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.PromptId) promptId: QueryPromptUsagesArgs['promptId'],
  ): Promise<PromptUsage[]> {
    const usages = await this.listPromptUsagesUseCase.execute(ctx, { id: promptId });
    return usages.map(toGraphqlPromptUsage);
  }
}

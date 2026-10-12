import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPromptDetail } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { SavePromptVersionUseCase } from '@/modules/prompts/use-cases/save-prompt-version.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  PromptDetail,
  SavePromptVersionInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SavePromptVersionResolver {
  constructor(private readonly savePromptVersionUseCase: SavePromptVersionUseCase) {}

  @Mutation()
  async savePromptVersion(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: SavePromptVersionInput,
  ): Promise<PromptDetail> {
    return toGraphqlPromptDetail(await this.savePromptVersionUseCase.execute(ctx, input));
  }
}

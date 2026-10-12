import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPrompt } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { RenamePromptUseCase } from '@/modules/prompts/use-cases/rename-prompt.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Prompt,
  RenamePromptInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenamePromptResolver {
  constructor(private readonly renamePromptUseCase: RenamePromptUseCase) {}

  @Mutation()
  async renamePrompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: RenamePromptInput,
  ): Promise<Prompt> {
    return toGraphqlPrompt(await this.renamePromptUseCase.execute(ctx, input));
  }
}

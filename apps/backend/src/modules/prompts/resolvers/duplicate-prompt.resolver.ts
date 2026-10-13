import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPrompt } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { DuplicatePromptUseCase } from '@/modules/prompts/use-cases/duplicate-prompt.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DuplicatePromptInput,
  Prompt,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DuplicatePromptResolver {
  constructor(private readonly duplicatePromptUseCase: DuplicatePromptUseCase) {}

  @Mutation()
  async duplicatePrompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: DuplicatePromptInput,
  ): Promise<Prompt> {
    return toGraphqlPrompt(await this.duplicatePromptUseCase.execute(ctx, input));
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPrompt } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { CreatePromptUseCase } from '@/modules/prompts/use-cases/create-prompt.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CreatePromptInput,
  Prompt,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreatePromptResolver {
  constructor(private readonly createPromptUseCase: CreatePromptUseCase) {}

  @Mutation()
  async createPrompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: CreatePromptInput,
  ): Promise<Prompt> {
    return toGraphqlPrompt(await this.createPromptUseCase.execute(ctx, input));
  }
}

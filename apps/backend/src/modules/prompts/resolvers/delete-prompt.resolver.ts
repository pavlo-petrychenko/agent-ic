import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { DeletePromptUseCase } from '@/modules/prompts/use-cases/delete-prompt.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DeletePromptInput,
  DeletePromptPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeletePromptResolver {
  constructor(private readonly deletePromptUseCase: DeletePromptUseCase) {}

  @Mutation()
  deletePrompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: DeletePromptInput,
  ): Promise<DeletePromptPayload> {
    return this.deletePromptUseCase.execute(ctx, input);
  }
}

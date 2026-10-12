import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DeletePromptFolderInput,
  DeletePromptFolderPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeletePromptFolderResolver {
  constructor(private readonly deletePromptFolderUseCase: DeletePromptFolderUseCase) {}

  @Mutation()
  deletePromptFolder(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: DeletePromptFolderInput,
  ): Promise<DeletePromptFolderPayload> {
    return this.deletePromptFolderUseCase.execute(ctx, input);
  }
}

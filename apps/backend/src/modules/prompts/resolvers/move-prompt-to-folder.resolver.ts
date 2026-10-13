import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPrompt } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import { MovePromptToFolderUseCase } from '@/modules/prompts/use-cases/move-prompt-to-folder.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  MovePromptToFolderInput,
  Prompt,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class MovePromptToFolderResolver {
  constructor(private readonly movePromptToFolderUseCase: MovePromptToFolderUseCase) {}

  @Mutation()
  async movePromptToFolder(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: MovePromptToFolderInput,
  ): Promise<Prompt> {
    return toGraphqlPrompt(await this.movePromptToFolderUseCase.execute(ctx, input));
  }
}

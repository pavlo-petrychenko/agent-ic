import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPromptFolder } from '@/modules/prompts/helpers/prompt-folder-graphql.helpers';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  PromptFolder,
  RenamePromptFolderInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenamePromptFolderResolver {
  constructor(private readonly renamePromptFolderUseCase: RenamePromptFolderUseCase) {}

  @Mutation()
  async renamePromptFolder(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: RenamePromptFolderInput,
  ): Promise<PromptFolder> {
    return toGraphqlPromptFolder(await this.renamePromptFolderUseCase.execute(ctx, input));
  }
}

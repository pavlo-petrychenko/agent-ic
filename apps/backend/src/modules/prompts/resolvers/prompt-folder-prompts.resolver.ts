import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PromptFolderGraphqlParent } from '@/modules/prompts/constants/prompt-folder-graphql.constants';
import { toGraphqlPrompt } from '@/modules/prompts/helpers/prompt-graphql.helpers';
import type { PromptFolderParent } from '@/modules/prompts/typedefs/prompt-folder-graphql.typedefs';
import { ListPromptsByFoldersUseCase } from '@/modules/prompts/use-cases/list-prompts-by-folders.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { Prompt } from '@/platform/graphql-server/generated/schema.generated';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Resolver(PromptFolderGraphqlParent.PromptFolder)
export class PromptFolderPromptsResolver {
  @ResolveField()
  async prompts(
    @Parent() folder: PromptFolderParent,
    @Loader(ListPromptsByFoldersUseCase) prompts: LoaderOf<ListPromptsByFoldersUseCase>,
  ): Promise<Prompt[]> {
    return (await prompts.load(folder.id)).map(toGraphqlPrompt);
  }
}

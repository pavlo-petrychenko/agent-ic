import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlPromptFolder } from '@/modules/prompts/helpers/prompt-folder-graphql.helpers';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { PromptFolder } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class PromptFoldersResolver {
  constructor(private readonly listPromptFoldersUseCase: ListPromptFoldersUseCase) {}

  @Query()
  async promptFolders(@GraphqlCtx() ctx: UseCaseCtx): Promise<PromptFolder[]> {
    const folders = await this.listPromptFoldersUseCase.execute(ctx);
    return folders.map(toGraphqlPromptFolder);
  }
}

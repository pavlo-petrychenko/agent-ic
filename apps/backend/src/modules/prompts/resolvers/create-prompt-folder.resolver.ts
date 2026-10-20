import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPromptFolder } from '@/modules/prompts/helpers/prompt-folder-graphql.helpers';
import type { PromptFolderParent } from '@/modules/prompts/typedefs/prompt-folder-graphql.typedefs';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { CreatePromptFolderInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreatePromptFolderResolver {
  constructor(private readonly createPromptFolderUseCase: CreatePromptFolderUseCase) {}

  @Mutation()
  async createPromptFolder(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: CreatePromptFolderInput,
  ): Promise<PromptFolderParent> {
    return toGraphqlPromptFolder(await this.createPromptFolderUseCase.execute(ctx, input));
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeBase } from '@/modules/knowledge/helpers/knowledge-base-graphql.helpers';
import { RenameKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-base.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeBase,
  RenameKnowledgeBaseInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenameKnowledgeBaseResolver {
  constructor(private readonly renameKnowledgeBaseUseCase: RenameKnowledgeBaseUseCase) {}

  @Mutation()
  async renameKnowledgeBase(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: RenameKnowledgeBaseInput,
  ): Promise<KnowledgeBase> {
    return toGraphqlKnowledgeBase(await this.renameKnowledgeBaseUseCase.execute(ctx, input));
  }
}

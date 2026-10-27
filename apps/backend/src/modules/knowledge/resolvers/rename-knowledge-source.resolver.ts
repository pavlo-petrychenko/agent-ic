import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeSource } from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { RenameKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-source.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeSource,
  RenameSourceInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenameKnowledgeSourceResolver {
  constructor(private readonly renameKnowledgeSourceUseCase: RenameKnowledgeSourceUseCase) {}

  @Mutation()
  async renameSource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: RenameSourceInput,
  ): Promise<KnowledgeSource> {
    return toGraphqlKnowledgeSource(await this.renameKnowledgeSourceUseCase.execute(ctx, input));
  }
}

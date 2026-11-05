import { Args, Query, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeSearchResults } from '@/modules/knowledge/helpers/knowledge-search-graphql.helpers';
import { SearchKnowledgeUseCase } from '@/modules/knowledge/use-cases/search-knowledge.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeSearchResult,
  QuerySearchKnowledgeArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SearchKnowledgeResolver {
  constructor(private readonly searchKnowledgeUseCase: SearchKnowledgeUseCase) {}

  @Query()
  async searchKnowledge(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: QuerySearchKnowledgeArgs['input'],
  ): Promise<KnowledgeSearchResult[]> {
    return toGraphqlKnowledgeSearchResults(await this.searchKnowledgeUseCase.execute(ctx, input));
  }
}

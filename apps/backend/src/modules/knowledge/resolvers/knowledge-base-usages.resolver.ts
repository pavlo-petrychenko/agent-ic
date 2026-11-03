import { Args, Query, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeBaseUsage } from '@/modules/knowledge/helpers/knowledge-usage-graphql.helpers';
import { ListKnowledgeBaseUsagesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-base-usages.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeBaseUsage,
  QueryKnowledgeBaseUsagesArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgeBaseUsagesResolver {
  constructor(private readonly listKnowledgeBaseUsagesUseCase: ListKnowledgeBaseUsagesUseCase) {}

  @Query()
  async knowledgeBaseUsages(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.KnowledgeBaseId)
    knowledgeBaseId: QueryKnowledgeBaseUsagesArgs['knowledgeBaseId'],
  ): Promise<KnowledgeBaseUsage[]> {
    const usages = await this.listKnowledgeBaseUsagesUseCase.execute(ctx, { knowledgeBaseId });
    return usages.map(toGraphqlKnowledgeBaseUsage);
  }
}

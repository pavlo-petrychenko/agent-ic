import { Args, Query, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  toGraphqlKnowledgeSourceDetail,
  toGraphqlKnowledgeSources,
} from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { GetKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/get-knowledge-source.use-case';
import { ListKnowledgeSourcesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-sources.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeSource,
  KnowledgeSourceDetail,
  QueryKnowledgeSourceArgs,
  QueryKnowledgeSourcesArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgeSourcesResolver {
  constructor(
    private readonly getKnowledgeSourceUseCase: GetKnowledgeSourceUseCase,
    private readonly listKnowledgeSourcesUseCase: ListKnowledgeSourcesUseCase,
  ) {}

  @Query()
  async knowledgeSource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Id) id: QueryKnowledgeSourceArgs['id'],
  ): Promise<KnowledgeSourceDetail> {
    return toGraphqlKnowledgeSourceDetail(
      await this.getKnowledgeSourceUseCase.execute(ctx, { id }),
    );
  }

  @Query()
  async knowledgeSources(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.KnowledgeBaseId)
    knowledgeBaseId: QueryKnowledgeSourcesArgs['knowledgeBaseId'],
  ): Promise<KnowledgeSource[]> {
    return toGraphqlKnowledgeSources(
      await this.listKnowledgeSourcesUseCase.execute(ctx, { knowledgeBaseId }),
    );
  }
}

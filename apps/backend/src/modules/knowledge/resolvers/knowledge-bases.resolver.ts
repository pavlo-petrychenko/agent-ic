import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlKnowledgeBases } from '@/modules/knowledge/helpers/knowledge-base-graphql.helpers';
import { ListKnowledgeBasesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-bases.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { KnowledgeBase } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgeBasesResolver {
  constructor(private readonly listKnowledgeBasesUseCase: ListKnowledgeBasesUseCase) {}

  @Query()
  async knowledgeBases(@GraphqlCtx() ctx: UseCaseCtx): Promise<KnowledgeBase[]> {
    return toGraphqlKnowledgeBases(await this.listKnowledgeBasesUseCase.execute(ctx));
  }
}

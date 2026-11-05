import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeSourceDocument } from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { UpdateDocumentSummaryUseCase } from '@/modules/knowledge/use-cases/update-document-summary.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeSourceDocument,
  UpdateDocumentSummaryInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateDocumentSummaryResolver {
  constructor(private readonly updateDocumentSummaryUseCase: UpdateDocumentSummaryUseCase) {}

  @Mutation()
  async updateDocumentSummary(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: UpdateDocumentSummaryInput,
  ): Promise<KnowledgeSourceDocument> {
    return toGraphqlKnowledgeSourceDocument(
      await this.updateDocumentSummaryUseCase.execute(ctx, input),
    );
  }
}

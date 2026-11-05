import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { RemoveSourceDocumentUseCase } from '@/modules/knowledge/use-cases/remove-source-document.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  RemoveSourceDocumentInput,
  RemoveSourceDocumentPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RemoveSourceDocumentResolver {
  constructor(private readonly removeSourceDocumentUseCase: RemoveSourceDocumentUseCase) {}

  @Mutation()
  removeSourceDocument(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: RemoveSourceDocumentInput,
  ): Promise<RemoveSourceDocumentPayload> {
    return this.removeSourceDocumentUseCase.execute(ctx, input);
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { DeleteKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-base.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DeleteKnowledgeBaseInput,
  DeleteKnowledgeBasePayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeleteKnowledgeBaseResolver {
  constructor(private readonly deleteKnowledgeBaseUseCase: DeleteKnowledgeBaseUseCase) {}

  @Mutation()
  deleteKnowledgeBase(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: DeleteKnowledgeBaseInput,
  ): Promise<DeleteKnowledgeBasePayload> {
    return this.deleteKnowledgeBaseUseCase.execute(ctx, input);
  }
}

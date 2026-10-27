import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { DeleteKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-source.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  DeleteSourceInput,
  DeleteSourcePayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeleteKnowledgeSourceResolver {
  constructor(private readonly deleteKnowledgeSourceUseCase: DeleteKnowledgeSourceUseCase) {}

  @Mutation()
  deleteSource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: DeleteSourceInput,
  ): Promise<DeleteSourcePayload> {
    return this.deleteKnowledgeSourceUseCase.execute(ctx, input);
  }
}

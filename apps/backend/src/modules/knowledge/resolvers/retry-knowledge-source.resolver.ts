import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { RetryKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/retry-knowledge-source.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  RetrySourceInput,
  RetrySourcePayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RetryKnowledgeSourceResolver {
  constructor(private readonly retryKnowledgeSourceUseCase: RetryKnowledgeSourceUseCase) {}

  @Mutation()
  retrySource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: RetrySourceInput,
  ): Promise<RetrySourcePayload> {
    return this.retryKnowledgeSourceUseCase.execute(ctx, input);
  }
}

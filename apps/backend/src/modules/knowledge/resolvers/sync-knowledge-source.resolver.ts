import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { SyncKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/sync-knowledge-source.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  SyncSourceInput,
  SyncSourcePayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SyncKnowledgeSourceResolver {
  constructor(private readonly syncKnowledgeSourceUseCase: SyncKnowledgeSourceUseCase) {}

  @Mutation()
  syncSource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: SyncSourceInput,
  ): Promise<SyncSourcePayload> {
    return this.syncKnowledgeSourceUseCase.execute(ctx, input);
  }
}

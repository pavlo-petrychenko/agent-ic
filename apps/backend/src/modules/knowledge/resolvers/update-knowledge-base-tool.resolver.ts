import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeBase } from '@/modules/knowledge/helpers/knowledge-base-graphql.helpers';
import { UpdateKnowledgeBaseToolUseCase } from '@/modules/knowledge/use-cases/update-knowledge-base-tool.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeBase,
  UpdateKnowledgeBaseToolInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateKnowledgeBaseToolResolver {
  constructor(private readonly updateKnowledgeBaseToolUseCase: UpdateKnowledgeBaseToolUseCase) {}

  @Mutation()
  async updateKnowledgeBaseTool(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: UpdateKnowledgeBaseToolInput,
  ): Promise<KnowledgeBase> {
    return toGraphqlKnowledgeBase(await this.updateKnowledgeBaseToolUseCase.execute(ctx, input));
  }
}

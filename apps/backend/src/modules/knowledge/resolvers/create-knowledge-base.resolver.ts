import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeBase } from '@/modules/knowledge/helpers/knowledge-base-graphql.helpers';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CreateKnowledgeBaseInput,
  KnowledgeBase,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateKnowledgeBaseResolver {
  constructor(private readonly createKnowledgeBaseUseCase: CreateKnowledgeBaseUseCase) {}

  @Mutation()
  async createKnowledgeBase(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: CreateKnowledgeBaseInput,
  ): Promise<KnowledgeBase> {
    return toGraphqlKnowledgeBase(await this.createKnowledgeBaseUseCase.execute(ctx, input));
  }
}

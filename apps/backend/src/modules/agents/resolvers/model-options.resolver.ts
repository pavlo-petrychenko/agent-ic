import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlModelOption } from '@/modules/agents/helpers/model-option-graphql.helpers';
import { ListModelOptionsUseCase } from '@/modules/agents/use-cases/list-model-options.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { ModelOption } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ModelOptionsResolver {
  constructor(private readonly listModelOptionsUseCase: ListModelOptionsUseCase) {}

  @Query()
  modelOptions(@GraphqlCtx() ctx: UseCaseCtx): ModelOption[] {
    return this.listModelOptionsUseCase.execute(ctx).map(toGraphqlModelOption);
  }
}

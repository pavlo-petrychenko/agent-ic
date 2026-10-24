import { Args, Query, Resolver } from '@nestjs/graphql';
import { LlmKeyGraphqlArgument } from '@/modules/llm-keys/constants/llm-key-input.constants';
import { ListLlmKeyModelsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-models.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { QueryLlmKeyModelsArgs } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class LlmKeyModelsResolver {
  constructor(private readonly listLlmKeyModelsUseCase: ListLlmKeyModelsUseCase) {}

  @Query()
  async llmKeyModels(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(LlmKeyGraphqlArgument.KeyId) keyId: QueryLlmKeyModelsArgs['keyId'],
  ): Promise<string[]> {
    return [...(await this.listLlmKeyModelsUseCase.execute(ctx, { id: keyId }))];
  }
}

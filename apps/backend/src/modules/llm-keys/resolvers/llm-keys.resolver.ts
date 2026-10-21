import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlLlmKey } from '@/modules/llm-keys/helpers/llm-key-graphql.helpers';
import { ListLlmKeysUseCase } from '@/modules/llm-keys/use-cases/list-llm-keys.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { LlmKey } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class LlmKeysResolver {
  constructor(private readonly listLlmKeysUseCase: ListLlmKeysUseCase) {}

  @Query()
  async llmKeys(@GraphqlCtx() ctx: UseCaseCtx): Promise<LlmKey[]> {
    return (await this.listLlmKeysUseCase.execute(ctx)).map(toGraphqlLlmKey);
  }
}

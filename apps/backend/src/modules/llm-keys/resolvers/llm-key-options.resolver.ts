import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlLlmKeyOption } from '@/modules/llm-keys/helpers/llm-key-graphql.helpers';
import { ListLlmKeyOptionsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-options.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { LlmKeyOption } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class LlmKeyOptionsResolver {
  constructor(private readonly listLlmKeyOptionsUseCase: ListLlmKeyOptionsUseCase) {}

  @Query()
  async llmKeyOptions(@GraphqlCtx() ctx: UseCaseCtx): Promise<LlmKeyOption[]> {
    return (await this.listLlmKeyOptionsUseCase.execute(ctx)).map(toGraphqlLlmKeyOption);
  }
}

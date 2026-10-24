import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LlmKeyGraphqlArgument } from '@/modules/llm-keys/constants/llm-key-input.constants';
import { toGraphqlLlmKey } from '@/modules/llm-keys/helpers/llm-key-graphql.helpers';
import { SetLlmKeyFallbackUseCase } from '@/modules/llm-keys/use-cases/set-llm-key-fallback.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  LlmKey,
  MutationSetLlmKeyFallbackArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SetLlmKeyFallbackResolver {
  constructor(private readonly setLlmKeyFallbackUseCase: SetLlmKeyFallbackUseCase) {}

  @Mutation()
  async setLlmKeyFallback(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(LlmKeyGraphqlArgument.Id) id: MutationSetLlmKeyFallbackArgs['id'],
    @Args(LlmKeyGraphqlArgument.Enabled) enabled: MutationSetLlmKeyFallbackArgs['enabled'],
  ): Promise<LlmKey> {
    return toGraphqlLlmKey(await this.setLlmKeyFallbackUseCase.execute(ctx, { id, enabled }));
  }
}

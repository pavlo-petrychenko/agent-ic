import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LlmKeyGraphqlArgument } from '@/modules/llm-keys/constants/llm-key-input.constants';
import { RemoveLlmKeyUseCase } from '@/modules/llm-keys/use-cases/remove-llm-key.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { MutationRemoveLlmKeyArgs } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RemoveLlmKeyResolver {
  constructor(private readonly removeLlmKeyUseCase: RemoveLlmKeyUseCase) {}

  @Mutation()
  removeLlmKey(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(LlmKeyGraphqlArgument.Id) id: MutationRemoveLlmKeyArgs['id'],
  ): Promise<boolean> {
    return this.removeLlmKeyUseCase.execute(ctx, { id });
  }
}

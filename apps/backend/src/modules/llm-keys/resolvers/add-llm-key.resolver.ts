import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LlmKeyGraphqlArgument } from '@/modules/llm-keys/constants/llm-key-input.constants';
import { toGraphqlLlmKey } from '@/modules/llm-keys/helpers/llm-key-graphql.helpers';
import { AddLlmKeyUseCase } from '@/modules/llm-keys/use-cases/add-llm-key.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { AddLlmKeyInput, LlmKey } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AddLlmKeyResolver {
  constructor(private readonly addLlmKeyUseCase: AddLlmKeyUseCase) {}

  @Mutation()
  async addLlmKey(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(LlmKeyGraphqlArgument.Input) input: AddLlmKeyInput,
  ): Promise<LlmKey> {
    return toGraphqlLlmKey(await this.addLlmKeyUseCase.execute(ctx, input));
  }
}

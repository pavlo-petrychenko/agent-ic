import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LlmKeyGraphqlArgument } from '@/modules/llm-keys/constants/llm-key-input.constants';
import { toGraphqlLlmKeyCheck } from '@/modules/llm-keys/helpers/llm-key-graphql.helpers';
import { CheckLlmKeyUseCase } from '@/modules/llm-keys/use-cases/check-llm-key.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CheckLlmKeyInput,
  LlmKeyCheck,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CheckLlmKeyResolver {
  constructor(private readonly checkLlmKeyUseCase: CheckLlmKeyUseCase) {}

  @Mutation()
  async checkLlmKey(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(LlmKeyGraphqlArgument.Input) input: CheckLlmKeyInput,
  ): Promise<LlmKeyCheck> {
    return toGraphqlLlmKeyCheck(await this.checkLlmKeyUseCase.execute(ctx, input));
  }
}

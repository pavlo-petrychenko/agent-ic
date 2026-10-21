import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PromptGraphqlArgument } from '@/modules/prompts/constants/prompt-input.constants';
import { toGraphqlPromptTestResult } from '@/modules/prompts/helpers/prompt-test-graphql.helpers';
import { TestPromptUseCase } from '@/modules/prompts/use-cases/test-prompt.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  PromptTestResult,
  TestPromptInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class TestPromptResolver {
  constructor(private readonly testPromptUseCase: TestPromptUseCase) {}

  @Mutation()
  async testPrompt(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(PromptGraphqlArgument.Input) input: TestPromptInput,
  ): Promise<PromptTestResult> {
    return toGraphqlPromptTestResult(await this.testPromptUseCase.execute(ctx, input));
  }
}

import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlApiRequestTestResult } from '@/modules/agents/helpers/api-request-test-graphql.helpers';
import { TestApiRequestUseCase } from '@/modules/agents/use-cases/test-api-request.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ApiRequestTestResult,
  TestApiRequestInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class TestApiRequestResolver {
  constructor(private readonly testApiRequestUseCase: TestApiRequestUseCase) {}

  @Mutation()
  async testApiRequest(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: TestApiRequestInput,
  ): Promise<ApiRequestTestResult> {
    return toGraphqlApiRequestTestResult(await this.testApiRequestUseCase.execute(ctx, input));
  }
}

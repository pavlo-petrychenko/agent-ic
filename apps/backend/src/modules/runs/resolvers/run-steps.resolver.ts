import { Args, Resolver, Subscription } from '@nestjs/graphql';
import {
  RunGraphqlArgument,
  RunGraphqlField,
} from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRunStepEvent } from '@/modules/runs/helpers/run-step-graphql.helpers';
import type { RunStepUpdate } from '@/modules/runs/typedefs/run-step-update.typedefs';
import { SubscribeToRunStepsUseCase } from '@/modules/runs/use-cases/subscribe-to-run-steps.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';

@Resolver()
export class RunStepsResolver {
  constructor(private readonly subscribeToRunStepsUseCase: SubscribeToRunStepsUseCase) {}

  @Subscription(RunGraphqlField.RunSteps, { resolve: toGraphqlRunStepEvent })
  runSteps(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(RunGraphqlArgument.RunId) runId: string,
  ): Promise<AsyncGenerator<RunStepUpdate, void, undefined>> {
    return this.subscribeToRunStepsUseCase.execute(ctx, { runId });
  }
}

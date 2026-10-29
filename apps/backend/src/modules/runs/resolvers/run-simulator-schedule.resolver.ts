import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RunGraphqlArgument } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlSimulatorScheduleRun } from '@/modules/runs/helpers/simulator-schedule-graphql.helpers';
import type { SimulatorScheduleRunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import { RunSimulatorScheduleUseCase } from '@/modules/runs/use-cases/run-simulator-schedule.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { RunSimulatorScheduleInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RunSimulatorScheduleResolver {
  constructor(private readonly runSimulatorScheduleUseCase: RunSimulatorScheduleUseCase) {}

  @Mutation()
  async runSimulatorSchedule(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(RunGraphqlArgument.Input) input: RunSimulatorScheduleInput,
  ): Promise<SimulatorScheduleRunParent> {
    return toGraphqlSimulatorScheduleRun(
      await this.runSimulatorScheduleUseCase.execute(ctx, input),
    );
  }
}

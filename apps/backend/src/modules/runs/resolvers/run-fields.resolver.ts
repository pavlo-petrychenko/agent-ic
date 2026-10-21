import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RunGraphqlParent } from '@/modules/runs/constants/run-graphql.constants';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { toGraphqlRunStep } from '@/modules/runs/helpers/run-graphql.helpers';
import type { RunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import { GetRunTotalsUseCase } from '@/modules/runs/use-cases/get-run-totals.use-case';
import { ListRunStepsUseCase } from '@/modules/runs/use-cases/list-run-steps.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { RunStep, RunTotals } from '@/platform/graphql-server/generated/schema.generated';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Resolver(RunGraphqlParent.Run)
export class RunFieldsResolver {
  @ResolveField()
  async steps(
    @Parent() run: RunParent,
    @Loader(ListRunStepsUseCase) steps: LoaderOf<ListRunStepsUseCase>,
  ): Promise<RunStep[]> {
    return (await steps.load(run.id)).map(toGraphqlRunStep);
  }

  @ResolveField()
  async totals(
    @Parent() run: RunParent,
    @Loader(GetRunTotalsUseCase) totals: LoaderOf<GetRunTotalsUseCase>,
  ): Promise<RunTotals> {
    const found = await totals.load(run.id);
    if (found === null) {
      throw new RunNotFoundError(run.id);
    }
    return found;
  }
}

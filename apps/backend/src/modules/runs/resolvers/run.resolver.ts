import { Args, Query, Resolver } from '@nestjs/graphql';
import { RunGraphqlArgument } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRun } from '@/modules/runs/helpers/run-graphql.helpers';
import type { RunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import { GetRunUseCase } from '@/modules/runs/use-cases/get-run.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';

@Resolver()
export class RunResolver {
  constructor(private readonly getRunUseCase: GetRunUseCase) {}

  @Query()
  async run(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(RunGraphqlArgument.Id) id: string,
  ): Promise<RunParent> {
    return toGraphqlRun(await this.getRunUseCase.execute(ctx, { id }));
  }
}

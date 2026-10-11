import { Args, Query, Resolver } from '@nestjs/graphql';
import { RunGraphqlArgument } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRun } from '@/modules/runs/helpers/run-graphql.helpers';
import { GetRunUseCase } from '@/modules/runs/use-cases/get-run.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Run } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RunResolver {
  constructor(private readonly getRunUseCase: GetRunUseCase) {}

  @Query()
  async run(@GraphqlCtx() ctx: UseCaseCtx, @Args(RunGraphqlArgument.Id) id: string): Promise<Run> {
    return toGraphqlRun(await this.getRunUseCase.execute(ctx, { id }));
  }
}

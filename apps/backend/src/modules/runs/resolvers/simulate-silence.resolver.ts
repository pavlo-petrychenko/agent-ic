import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RunGraphqlArgument } from '@/modules/runs/constants/run-graphql.constants';
import { toGraphqlRun } from '@/modules/runs/helpers/run-graphql.helpers';
import type { RunParent } from '@/modules/runs/typedefs/run-graphql.typedefs';
import { SimulateSilenceUseCase } from '@/modules/runs/use-cases/simulate-silence.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { SimulateSilenceInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SimulateSilenceResolver {
  constructor(private readonly simulateSilenceUseCase: SimulateSilenceUseCase) {}

  @Mutation()
  async simulateSilence(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(RunGraphqlArgument.Input) input: SimulateSilenceInput,
  ): Promise<RunParent> {
    return toGraphqlRun(await this.simulateSilenceUseCase.execute(ctx, input));
  }
}
